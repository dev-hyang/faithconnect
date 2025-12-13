import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get a single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const { eventId } = await params

    const event = await prisma.groupEvent.findUnique({
      where: { id: eventId },
      include: {
        group: {
          select: { id: true, name: true, visibility: true },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Get event error:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

// PUT - Update an event (leaders only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, eventId } = await params

    // Check if user is a leader of this group or ADMIN
    const membership = await prisma.fellowshipMembership.findFirst({
      where: { userId: session.user.id, groupId: id, role: "LEADER" },
    })
    const isAdmin = session.user.role === "ADMIN"

    if (!membership && !isAdmin) {
      return NextResponse.json(
        { error: "Only group leaders can update events" },
        { status: 403 }
      )
    }

    const event = await prisma.groupEvent.findUnique({
      where: { id: eventId },
    })

    if (!event || event.groupId !== id) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const { title, description, eventTime, eventType, location, status } = await request.json()

    // Validate eventType if provided
    if (eventType && !["ONLINE", "OFFLINE"].includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid event type. Must be ONLINE or OFFLINE." },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    const updatedEvent = await prisma.groupEvent.update({
      where: { id: eventId },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        eventTime: eventTime ? new Date(eventTime) : undefined,
        eventType: eventType || undefined,
        location: location !== undefined ? location : undefined,
        status: status || undefined,
      },
    })

    return NextResponse.json({ message: "Event updated successfully", event: updatedEvent })
  } catch (error) {
    console.error("Update event error:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

// DELETE - Delete an event (leaders only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, eventId } = await params

    // Check if user is a leader of this group or ADMIN
    const membership = await prisma.fellowshipMembership.findFirst({
      where: { userId: session.user.id, groupId: id, role: "LEADER" },
    })
    const isAdmin = session.user.role === "ADMIN"

    if (!membership && !isAdmin) {
      return NextResponse.json(
        { error: "Only group leaders can delete events" },
        { status: 403 }
      )
    }

    const event = await prisma.groupEvent.findUnique({
      where: { id: eventId },
    })

    if (!event || event.groupId !== id) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await prisma.groupEvent.delete({ where: { id: eventId } })

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Delete event error:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}

