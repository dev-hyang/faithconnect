import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get a specific leader request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { requestId } = await params

    const leaderRequest = await prisma.groupLeaderRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, image: true },
        },
        reviewer: {
          select: { id: true, fullName: true, email: true },
        },
        group: {
          select: { id: true, name: true },
        },
      },
    })

    if (!leaderRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json({ request: leaderRequest })
  } catch (error) {
    console.error("Get leader request error:", error)
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 })
  }
}

// PUT - Approve or reject a leader request (leaders only, not the requester)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, requestId } = await params
    const { status, reviewNote } = await request.json()

    // Validate status
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be APPROVED or REJECTED." },
        { status: 400 }
      )
    }

    // Check if user is a leader of this group (and not the requester) or ADMIN
    const membership = await prisma.fellowshipMembership.findFirst({
      where: { userId: session.user.id, groupId: id, role: "LEADER" },
    })
    const isAdmin = session.user.role === "ADMIN"

    const leaderRequest = await prisma.groupLeaderRequest.findUnique({
      where: { id: requestId },
    })

    if (!leaderRequest || leaderRequest.groupId !== id) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Cannot review own request
    if (leaderRequest.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot review your own request" },
        { status: 403 }
      )
    }

    if (!membership && !isAdmin) {
      return NextResponse.json(
        { error: "Only group leaders can review leader requests" },
        { status: 403 }
      )
    }

    if (leaderRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been reviewed" },
        { status: 400 }
      )
    }

    // Update the request
    await prisma.groupLeaderRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
    })

    // If approved, update the membership role
    if (status === "APPROVED") {
      if (leaderRequest.requestType === "APPLY_LEADER") {
        // Promote member to leader
        await prisma.fellowshipMembership.updateMany({
          where: { userId: leaderRequest.userId, groupId: id },
          data: { role: "LEADER" },
        })
      } else if (leaderRequest.requestType === "WITHDRAW_LEADER") {
        // Check if there are other leaders
        const leaderCount = await prisma.fellowshipMembership.count({
          where: { groupId: id, role: "LEADER" },
        })

        if (leaderCount <= 1) {
          return NextResponse.json(
            { error: "Cannot withdraw. The group must have at least one leader." },
            { status: 400 }
          )
        }

        // Demote leader to regular member
        await prisma.fellowshipMembership.updateMany({
          where: { userId: leaderRequest.userId, groupId: id },
          data: { role: "MEMBER" },
        })
      }
    }

    return NextResponse.json({
      message: `Request ${status.toLowerCase()} successfully`,
    })
  } catch (error) {
    console.error("Review leader request error:", error)
    return NextResponse.json({ error: "Failed to review request" }, { status: 500 })
  }
}

