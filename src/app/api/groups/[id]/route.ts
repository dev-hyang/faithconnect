import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get a single group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        },
        events: {
          orderBy: { startDate: "asc" },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    return NextResponse.json({ group })
  } catch (error) {
    console.error("Get group error:", error)
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 })
  }
}

// PUT - Update a group
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

    // Check if user is creator, a LEADER member, or ADMIN
    const isCreator = group.createdById === session.user.id
    const isLeader = group.members.some((m) => m.role === "LEADER")
    const isAdmin = session.user.role === "ADMIN"

    if (!isCreator && !isLeader && !isAdmin) {
      return NextResponse.json({ error: "Not authorized to update this group" }, { status: 403 })
    }

    const { name, description, imageUrl, schedule } = await request.json()

    const updatedGroup = await prisma.fellowshipGroup.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        schedule: schedule !== undefined ? schedule : undefined,
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

