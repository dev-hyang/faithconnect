import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Request to join a group (for guests)
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
    const { message } = await request.json()

    const group = await prisma.fellowshipGroup.findUnique({
      where: { id },
      include: { members: true },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check if already a member
    const isMember = group.members.some((m) => m.userId === session.user.id)
    if (isMember) {
      return NextResponse.json({ error: "You are already a member of this group" }, { status: 400 })
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.groupJoinRequest.findFirst({
      where: { userId: session.user.id, groupId: id, status: "PENDING" },
    })

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending request for this group" }, { status: 400 })
    }

    const joinRequest = await prisma.groupJoinRequest.create({
      data: {
        userId: session.user.id,
        groupId: id,
        message: message || null,
        status: "PENDING",
      },
    })

    return NextResponse.json({ message: "Join request submitted successfully", request: joinRequest }, { status: 201 })
  } catch (error) {
    console.error("Join request error:", error)
    return NextResponse.json({ error: "Failed to submit join request" }, { status: 500 })
  }
}

// GET - Get join requests for a group (admin or leader only)
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

    // Check permissions
    const isAdmin = session.user.role === "ADMIN"
    const isLeader = group.members.some((m) => m.userId === session.user.id && m.role === "LEADER")

    if (!isAdmin && !isLeader) {
      return NextResponse.json({ error: "Not authorized to view join requests" }, { status: 403 })
    }

    const requests = await prisma.groupJoinRequest.findMany({
      where: { groupId: id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Get join requests error:", error)
    return NextResponse.json({ error: "Failed to fetch join requests" }, { status: 500 })
  }
}

// PATCH - Approve or reject a join request (admin or leader only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { requestId, status } = await request.json()

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be APPROVED or REJECTED" }, { status: 400 })
    }

    const group = await prisma.fellowshipGroup.findUnique({
      where: { id },
      include: { members: true, _count: { select: { members: true } } },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check permissions
    const isAdmin = session.user.role === "ADMIN"
    const isLeader = group.members.some((m) => m.userId === session.user.id && m.role === "LEADER")

    if (!isAdmin && !isLeader) {
      return NextResponse.json({ error: "Not authorized to manage join requests" }, { status: 403 })
    }

    const joinRequest = await prisma.groupJoinRequest.findUnique({ where: { id: requestId } })
    if (!joinRequest || joinRequest.groupId !== id) {
      return NextResponse.json({ error: "Join request not found" }, { status: 404 })
    }

    // Update request status
    await prisma.groupJoinRequest.update({ where: { id: requestId }, data: { status } })

    // If approved, add user as member
    if (status === "APPROVED") {
      if (group._count.members >= group.maxMembers) {
        return NextResponse.json({ error: "Group has reached maximum capacity" }, { status: 400 })
      }
      await prisma.fellowshipMembership.create({
        data: { userId: joinRequest.userId, groupId: id, role: "MEMBER" },
      })
    }

    return NextResponse.json({ message: `Request ${status.toLowerCase()} successfully` })
  } catch (error) {
    console.error("Update join request error:", error)
    return NextResponse.json({ error: "Failed to update join request" }, { status: 500 })
  }
}

