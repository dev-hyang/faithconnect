import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/groups/[id]/join-requests - Get pending join requests for a group (leaders only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: groupId } = await params

  // Check if user is a leader of this group or admin
  const membership = await prisma.fellowshipMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  })

  const isLeader = membership?.role === "LEADER"
  const isAdmin = session.user.role === "ADMIN"

  if (!isLeader && !isAdmin) {
    return NextResponse.json({ error: "Only group leaders can view join requests" }, { status: 403 })
  }

  const requests = await prisma.groupJoinRequest.findMany({
    where: { groupId, status: "PENDING" },
    include: {
      user: { select: { id: true, fullName: true, email: true, image: true, gender: true, dateOfBirth: true, marriedStatus: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ requests })
}

// PUT /api/groups/[id]/join-requests - Approve or reject a join request (leaders only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: groupId } = await params
  const body = await request.json()
  const { requestId, action, comment } = body

  if (!requestId || !action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  // Rejection requires a comment
  if (action === "reject" && (!comment || comment.trim().length === 0)) {
    return NextResponse.json({ error: "Comment is required when rejecting a request" }, { status: 400 })
  }

  // Check if user is a leader of this group or admin
  const membership = await prisma.fellowshipMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  })

  const isLeader = membership?.role === "LEADER"
  const isAdmin = session.user.role === "ADMIN"

  if (!isLeader && !isAdmin) {
    return NextResponse.json({ error: "Only group leaders can manage join requests" }, { status: 403 })
  }

  // Find the request
  const joinRequest = await prisma.groupJoinRequest.findFirst({
    where: { id: requestId, groupId },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  })

  if (!joinRequest) {
    return NextResponse.json({ error: "Join request not found" }, { status: 404 })
  }

  if (joinRequest.status !== "PENDING") {
    return NextResponse.json({ error: "This request has already been processed" }, { status: 400 })
  }

  if (action === "approve") {
    // Check max members limit
    const group = await prisma.fellowshipGroup.findUnique({
      where: { id: groupId },
      include: { _count: { select: { members: true } } },
    })

    if (group && group._count.members >= group.maxMembers) {
      return NextResponse.json({ error: "Group has reached maximum members" }, { status: 400 })
    }

    // Add user as member and update request
    await prisma.$transaction([
      prisma.fellowshipMembership.create({
        data: { userId: joinRequest.userId, groupId, role: "MEMBER" },
      }),
      prisma.groupJoinRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          reviewComment: comment || null,
        },
      }),
    ])

    return NextResponse.json({
      message: `${joinRequest.user.fullName || joinRequest.user.email} has been added to the group`,
    })
  } else {
    // Reject request
    await prisma.groupJoinRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewComment: comment,
      },
    })

    return NextResponse.json({
      message: `Join request from ${joinRequest.user.fullName || joinRequest.user.email} has been rejected`,
    })
  }
}

