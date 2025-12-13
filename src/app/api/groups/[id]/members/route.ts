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

// DELETE - Remove a member from the group (admin or leader only)
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
    const { userId } = await request.json()

    const group = await prisma.fellowshipGroup.findUnique({
      where: { id },
      include: { members: true },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check permissions
    const isAdmin = session.user.role === "ADMIN"
    const isLeader = group.members.some((m) => m.userId === session.user.id && m.role === "LEADER")

    if (!isAdmin && !isLeader) {
      return NextResponse.json({ error: "Not authorized to remove members" }, { status: 403 })
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

