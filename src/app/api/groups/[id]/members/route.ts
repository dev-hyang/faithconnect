import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get group members (only for members of the group or admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    const group = await prisma.fellowshipGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true, image: true } },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check if user is a member or admin
    const isMember = session?.user?.id && group.members.some((m) => m.userId === session.user.id)
    const isAdmin = session?.user?.role === "ADMIN"

    if (!isMember && !isAdmin) {
      // Return only count for non-members
      return NextResponse.json({ memberCount: group.members.length, members: null })
    }

    return NextResponse.json({ members: group.members, memberCount: group.members.length })
  } catch (error) {
    console.error("Get members error:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

// POST - Add a member to the group (admin or leader only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { userId, role = "MEMBER" } = await request.json()

    const group = await prisma.fellowshipGroup.findUnique({
      where: { id },
      include: {
        members: true,
        _count: { select: { members: true } },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check permissions - admin or leader can add members
    const isAdmin = session.user.role === "ADMIN"
    const isLeader = group.members.some((m) => m.userId === session.user.id && m.role === "LEADER")

    if (!isAdmin && !isLeader) {
      return NextResponse.json({ error: "Not authorized to add members" }, { status: 403 })
    }

    // Check max members limit
    if (group._count.members >= group.maxMembers) {
      return NextResponse.json({ error: `Group has reached maximum capacity of ${group.maxMembers} members` }, { status: 400 })
    }

    // Check if user is already a member
    const existingMember = group.members.find((m) => m.userId === userId)
    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this group" }, { status: 400 })
    }

    const membership = await prisma.fellowshipMembership.create({
      data: { userId, groupId: id, role },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    })

    return NextResponse.json({ message: "Member added successfully", membership }, { status: 201 })
  } catch (error) {
    console.error("Add member error:", error)
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 })
  }
}

// PUT - Update member role (transfer leadership)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { action, targetUserId } = await request.json()

    const group = await prisma.fellowshipGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, fullName: true, email: true } } }
        }
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    const isLeader = group.members.some((m) => m.userId === session.user.id && m.role === "LEADER")

    if (action === "transfer_leadership") {
      if (!isLeader) {
        return NextResponse.json({ error: "Only leaders can transfer leadership" }, { status: 403 })
      }

      const targetMember = group.members.find((m) => m.userId === targetUserId)
      if (!targetMember) {
        return NextResponse.json({ error: "Target member not found" }, { status: 404 })
      }

      if (targetMember.role === "LEADER") {
        return NextResponse.json({ error: "Target is already a leader" }, { status: 400 })
      }

      // Transfer leadership: current leader becomes member, target becomes leader
      await prisma.$transaction([
        prisma.fellowshipMembership.updateMany({
          where: { userId: session.user.id, groupId: id },
          data: { role: "MEMBER" },
        }),
        prisma.fellowshipMembership.updateMany({
          where: { userId: targetUserId, groupId: id },
          data: { role: "LEADER" },
        }),
      ])

      return NextResponse.json({ message: "Leadership transferred successfully" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Update member error:", error)
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
  }
}

// DELETE - Remove a member from the group or leave group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { userId, action } = await request.json()

    const group = await prisma.fellowshipGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, fullName: true, email: true } } }
        }
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    const isAdmin = session.user.role === "ADMIN"
    const isLeader = group.members.some((m) => m.userId === session.user.id && m.role === "LEADER")
    const isSelf = userId === session.user.id

    // Handle self-leave (member withdrawing)
    if (action === "leave" && isSelf) {
      const membership = group.members.find((m) => m.userId === session.user.id)
      if (!membership) {
        return NextResponse.json({ error: "You are not a member of this group" }, { status: 400 })
      }

      if (membership.role === "LEADER") {
        // Check if there are other leaders
        const leaderCount = group.members.filter((m) => m.role === "LEADER").length
        if (leaderCount <= 1) {
          return NextResponse.json({ error: "Cannot leave: You are the only leader. Please transfer leadership first." }, { status: 400 })
        }
      }

      // Remove the member
      await prisma.fellowshipMembership.deleteMany({
        where: { userId: session.user.id, groupId: id },
      })

      // Get current user info
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { fullName: true, email: true }
      })

      // Create a notification for group leaders
      const leaders = group.members.filter((m) => m.role === "LEADER")
      for (const leader of leaders) {
        await prisma.userRequest.create({
          data: {
            userId: leader.userId,
            category: "GROUP",
            requestType: "LEAVE_GROUP",
            title: `${currentUser?.fullName || currentUser?.email} left ${group.name}`,
            status: "APPROVED", // Auto-approved since it's a notification
            reason: `Member voluntarily left the group`,
            groupId: id,
            groupName: group.name,
          },
        })
      }

      return NextResponse.json({ message: "You have left the group" })
    }

    // Handle remove by leader/admin
    if (!isAdmin && !isLeader) {
      return NextResponse.json({ error: "Not authorized to remove members" }, { status: 403 })
    }

    // Leaders cannot remove other leaders (only admins can)
    const targetMember = group.members.find((m) => m.userId === userId)
    if (targetMember?.role === "LEADER" && !isAdmin) {
      return NextResponse.json({ error: "Leaders cannot remove other leaders" }, { status: 403 })
    }

    await prisma.fellowshipMembership.deleteMany({
      where: { userId, groupId: id },
    })

    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}

