import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get leader requests for a group (leaders and admin only)
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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // PENDING, APPROVED, REJECTED

    // Check if user is a leader of this group or ADMIN
    const membership = await prisma.fellowshipMembership.findFirst({
      where: { userId: session.user.id, groupId: id, role: "LEADER" },
    })
    const isAdmin = session.user.role === "ADMIN"

    if (!membership && !isAdmin) {
      return NextResponse.json(
        { error: "Only group leaders can view leader requests" },
        { status: 403 }
      )
    }

    const statusFilter = status ? { status } : {}

    const requests = await prisma.groupLeaderRequest.findMany({
      where: {
        groupId: id,
        ...statusFilter,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, image: true },
        },
        reviewer: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Get leader requests error:", error)
    return NextResponse.json({ error: "Failed to fetch leader requests" }, { status: 500 })
  }
}

// POST - Submit a leader application or withdrawal request
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
    const { requestType, message } = await request.json()

    // Validate request type
    if (!["APPLY_LEADER", "WITHDRAW_LEADER"].includes(requestType)) {
      return NextResponse.json(
        { error: "Invalid request type. Must be APPLY_LEADER or WITHDRAW_LEADER." },
        { status: 400 }
      )
    }

    // Check if user is a member of this group
    const membership = await prisma.fellowshipMembership.findFirst({
      where: { userId: session.user.id, groupId: id },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "You must be a member of this group to submit a leader request" },
        { status: 403 }
      )
    }

    // For APPLY_LEADER: user must be a regular member (not already a leader)
    if (requestType === "APPLY_LEADER" && membership.role === "LEADER") {
      return NextResponse.json(
        { error: "You are already a leader of this group" },
        { status: 400 }
      )
    }

    // For WITHDRAW_LEADER: user must be a leader
    if (requestType === "WITHDRAW_LEADER" && membership.role !== "LEADER") {
      return NextResponse.json(
        { error: "You are not a leader of this group" },
        { status: 400 }
      )
    }

    // Check for existing pending request
    const existingRequest = await prisma.groupLeaderRequest.findFirst({
      where: {
        userId: session.user.id,
        groupId: id,
        requestType,
        status: "PENDING",
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request of this type" },
        { status: 400 }
      )
    }

    const leaderRequest = await prisma.groupLeaderRequest.create({
      data: {
        userId: session.user.id,
        groupId: id,
        requestType,
        message: message || null,
        status: "PENDING",
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    })

    return NextResponse.json(
      { message: "Request submitted successfully", request: leaderRequest },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create leader request error:", error)
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 })
  }
}

