import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Get all group events with optional filters
// Query params:
// - status: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
// - eventType: ONLINE, OFFLINE
// - sortOrder: asc, desc (default: asc for upcoming events first)
// - limit: number of events to return
// - upcoming: if "true", only show PLANNED events with future dates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const eventType = searchParams.get("eventType")
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc"
    const limit = searchParams.get("limit")
    const upcoming = searchParams.get("upcoming") === "true"

    // Build where clause
    const whereClause: {
      status?: string | { in: string[] }
      eventType?: string
      eventTime?: { gte: Date }
    } = {}

    // For upcoming events, only show PLANNED status
    if (upcoming) {
      whereClause.status = "PLANNED"
      whereClause.eventTime = { gte: new Date() }
    } else if (status) {
      // Handle multiple statuses separated by comma
      const statuses = status.split(",").filter(s => 
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
      take: limit ? parseInt(limit) : undefined,
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Get all events error:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

