import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper function to check if user can view group based on visibility
function canViewGroup(visibility: string, userRole: string | undefined): boolean {
  if (userRole === "ADMIN") return true
  if (userRole === "MEMBER" && ["PUBLIC", "INTERNAL"].includes(visibility)) return true
  if (visibility === "PUBLIC") return true
  return false
}

// GET - Get a single group with visibility check
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const userRole = session?.user?.role || "GUEST"
    const { id } = await params

    const group = await prisma.fellowshipGroup.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, image: true },
            },
          },
          orderBy: { role: "asc" }, // LEADER comes first alphabetically
        },
        events: {
          orderBy: { eventTime: "desc" },
        },
        _count: {
          select: { members: true, events: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check visibility
    if (!canViewGroup(group.visibility, userRole)) {
      return NextResponse.json({ error: "You don't have permission to view this group" }, { status: 403 })
    }

    // Separate members by role
    const leaders = group.members.filter((m) => m.role === "LEADER")
    const regularMembers = group.members.filter((m) => m.role === "MEMBER")

    // Separate events by status
    const inProgressEvents = group.events.filter((e) => e.status === "IN_PROGRESS")
    const upcomingEvents = group.events.filter((e) => e.status === "PLANNED")
    const historyEvents = group.events.filter((e) => ["COMPLETED", "CANCELLED"].includes(e.status))

    return NextResponse.json({
      group: {
        ...group,
        leaders,
        regularMembers,
        inProgressEvents,
        upcomingEvents,
        historyEvents,
      }
    })
  } catch (error) {
    console.error("Get group error:", error)
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 })
  }
}

// PUT - Update a group (only leaders can edit)
export async function PUT(
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
      include: {
        members: { where: { userId: session.user.id } },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check if user is a LEADER member or ADMIN
    const isLeader = group.members.some((m) => m.role === "LEADER")
    const isAdmin = session.user.role === "ADMIN"

    if (!isLeader && !isAdmin) {
      return NextResponse.json({ error: "Only group leaders can update this group" }, { status: 403 })
    }

    const {
      name,
      description,
      imageUrl,
      visibility,
      scheduleType,
      scheduleDetails
    } = await request.json()

    // Validate visibility if provided
    if (visibility && !["PUBLIC", "INTERNAL", "PRIVATE"].includes(visibility)) {
      return NextResponse.json(
        { error: "Invalid visibility. Must be PUBLIC, INTERNAL, or PRIVATE." },
        { status: 400 }
      )
    }

    // Validate scheduleType if provided
    if (scheduleType && !["RECURRING", "ADHOC"].includes(scheduleType)) {
      return NextResponse.json(
        { error: "Invalid schedule type. Must be RECURRING or ADHOC." },
        { status: 400 }
      )
    }

    const updatedGroup = await prisma.fellowshipGroup.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        visibility: visibility || undefined,
        scheduleType: scheduleType || undefined,
        scheduleDetails: scheduleDetails !== undefined ? scheduleDetails : undefined,
        updatedById: session.user.id,
      },
    })

    return NextResponse.json({ message: "Group updated successfully", group: updatedGroup })
  } catch (error) {
    console.error("Update group error:", error)
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 })
  }
}

// DELETE - Delete a group
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
    const group = await prisma.fellowshipGroup.findUnique({
      where: { id },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Only creator or ADMIN can delete
    if (group.createdById !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized to delete this group" }, { status: 403 })
    }

    await prisma.fellowshipGroup.delete({ where: { id } })

    return NextResponse.json({ message: "Group deleted successfully" })
  } catch (error) {
    console.error("Delete group error:", error)
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 })
  }
}

