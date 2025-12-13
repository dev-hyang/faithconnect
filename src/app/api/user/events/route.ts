import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get events from groups where the user is a member
// Query params:
// - status: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED (comma-separated for multiple)
// - eventType: ONLINE, OFFLINE
// - sortOrder: asc, desc (default: desc for latest first)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const eventType = searchParams.get("eventType")
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    // Get all groups where the user is a member, including their role
    const memberships = await prisma.fellowshipMembership.findMany({
      where: { userId: session.user.id },
      select: { groupId: true, role: true },
    })

    const groupIds = memberships.map((m) => m.groupId)
    // Track which groups the user is a leader of
    const leaderGroupIds = new Set(
      memberships.filter((m) => m.role === "LEADER").map((m) => m.groupId)
    )
    const isAdmin = session.user.role === "ADMIN"

    if (groupIds.length === 0) {
      return NextResponse.json({ events: [], leaderGroupIds: [] })
    }

    // Build where clause
    const whereClause: {
      groupId: { in: string[] }
      status?: string | { in: string[] }
      eventType?: string
    } = {
      groupId: { in: groupIds },
    }

    if (status) {
      // Handle multiple statuses separated by comma
      const statuses = status.split(",").filter((s) =>
        ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(s)
      )
      if (statuses.length === 1) {
        whereClause.status = statuses[0]
      } else if (statuses.length > 1) {
        whereClause.status = { in: statuses }
      }
    }

    if (eventType && ["ONLINE", "OFFLINE"].includes(eventType)) {
      whereClause.eventType = eventType
    }

    const events = await prisma.groupEvent.findMany({
      where: whereClause,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            visibility: true,
          },
        },
      },
      orderBy: { eventTime: sortOrder },
    })

    // Add canEdit flag to each event (true if user is leader of that group or admin)
    const eventsWithEditFlag = events.map((event) => ({
      ...event,
      canEdit: isAdmin || leaderGroupIds.has(event.groupId),
    }))

    return NextResponse.json({ events: eventsWithEditFlag })
  } catch (error) {
    console.error("Get user events error:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

