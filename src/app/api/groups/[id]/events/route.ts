import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get events for a group (filtered by status via query params)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userRole = session?.user?.role || "GUEST"
    const userId = session?.user?.id
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // PLANNED, IN_PROGRESS, COMPLETED, CANCELLED

    // First check if group exists and user can view it
    const group = await prisma.fellowshipGroup.findUnique({
      where: { id },
      select: {
        visibility: true,
        members: userId ? { where: { userId }, take: 1 } : false,
        joinRequests: userId ? { where: { userId, status: "PENDING" }, take: 1 } : false,
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check if user is a member or has a pending join request
    const isMember = userId && group.members && group.members.length > 0
    const hasPendingRequest = userId && group.joinRequests && group.joinRequests.length > 0

    // Check visibility - allow if user is member/has pending request
    if (!isMember && !hasPendingRequest) {
      if (group.visibility === "PRIVATE" && userRole !== "ADMIN") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
      if (group.visibility === "INTERNAL" && !["ADMIN", "MEMBER"].includes(userRole)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Build status filter
    const statusFilter = status ? { status } : {}

    const events = await prisma.groupEvent.findMany({
      where: {
        groupId: id,
        ...statusFilter,
      },
      orderBy: { eventTime: "desc" },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Get events error:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

// POST - Create a new event for a group (leaders only)
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

    // Check if user is a leader of this group or ADMIN
    const membership = await prisma.fellowshipMembership.findFirst({
      where: { userId: session.user.id, groupId: id, role: "LEADER" },
    })
    const isAdmin = session.user.role === "ADMIN"

    if (!membership && !isAdmin) {
      return NextResponse.json(
        { error: "Only group leaders can create events" },
        { status: 403 }
      )
    }

    const { title, description, eventTime, eventType, location, status } = await request.json()

    if (!title || !eventTime) {
      return NextResponse.json(
        { error: "Title and event time are required" },
        { status: 400 }
      )
    }

    // Validate eventType
    if (eventType && !["ONLINE", "OFFLINE"].includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid event type. Must be ONLINE or OFFLINE." },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    const event = await prisma.groupEvent.create({
      data: {
        title,
        description: description || null,
        eventTime: new Date(eventTime),
        eventType: eventType || "OFFLINE",
        location: location || null,
        status: status || "PLANNED",
        groupId: id,
      },
    })

    return NextResponse.json(
      { message: "Event created successfully", event },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

