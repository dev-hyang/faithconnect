import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Invite a user to join a group (leaders and admin only)
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
    const { userId, message } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if group exists
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

    const isAdmin = session.user.role === "ADMIN"
    const isLeader = group.members.some((m) => m.userId === session.user.id && m.role === "LEADER")

    if (!isAdmin && !isLeader) {
      return NextResponse.json({ error: "Only leaders and admins can invite users" }, { status: 403 })
    }

    // Check if group is full
    if (group._count.members >= group.maxMembers) {
      return NextResponse.json({ error: "Group is full" }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = group.members.find((m) => m.userId === userId)
    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this group" }, { status: 400 })
    }

    // Check if there's already a pending invitation
    const existingInvite = await prisma.groupInvitation.findFirst({
      where: { userId, groupId: id, status: "PENDING" },
    })
    if (existingInvite) {
      return NextResponse.json({ error: "User already has a pending invitation" }, { status: 400 })
    }

    // Check if there's already a pending join request
    const existingRequest = await prisma.groupJoinRequest.findFirst({
      where: { userId, groupId: id, status: "PENDING" },
    })
    if (existingRequest) {
      return NextResponse.json({ error: "User already has a pending join request" }, { status: 400 })
    }

    // Create the invitation
    const invitation = await prisma.groupInvitation.create({
      data: {
        userId,
        groupId: id,
        invitedById: session.user.id,
        message: message || null,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        invitedBy: { select: { id: true, fullName: true, email: true } },
      },
    })

    return NextResponse.json({ 
      success: true, 
      invitation,
      message: `Invitation sent to ${user.fullName || user.email}` 
    })
  } catch (error) {
    console.error("Invite user error:", error)
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 })
  }
}

// GET - Get pending invitations for a group (leaders and admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const group = await prisma.fellowshipGroup.findUnique({
      where: { id },
      include: { members: true },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    const isAdmin = session.user.role === "ADMIN"
    const isLeader = group.members.some((m) => m.userId === session.user.id && m.role === "LEADER")

    if (!isAdmin && !isLeader) {
      return NextResponse.json({ error: "Not authorized to view invitations" }, { status: 403 })
    }

    const invitations = await prisma.groupInvitation.findMany({
      where: { groupId: id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        invitedBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error("Get invitations error:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}

