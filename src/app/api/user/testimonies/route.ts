import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const VALID_STATUSES = ["DRAFT", "PENDING_APPROVAL", "PUBLISHED", "REJECTED", "CANCELLED"]

// GET - Fetch user's own testimonies
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const whereClause: Record<string, unknown> = { userId: session.user.id }
    if (status && VALID_STATUSES.includes(status)) {
      whereClause.status = status
    }

    const testimonies = await prisma.testimony.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ testimonies })
  } catch (error) {
    console.error("Failed to fetch user testimonies:", error)
    return NextResponse.json({ error: "Failed to fetch testimonies" }, { status: 500 })
  }
}

// POST - Create a new testimony
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    const testimony = await prisma.testimony.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        userId: session.user.id,
        status: "DRAFT",
      },
    })

    return NextResponse.json({ testimony }, { status: 201 })
  } catch (error) {
    console.error("Failed to create testimony:", error)
    return NextResponse.json({ error: "Failed to create testimony" }, { status: 500 })
  }
}

// PUT - Update a testimony
export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, description, action } = body

    if (!id) {
      return NextResponse.json({ error: "Testimony ID is required" }, { status: 400 })
    }

    const testimony = await prisma.testimony.findUnique({ where: { id } })
    if (!testimony || testimony.userId !== session.user.id) {
      return NextResponse.json({ error: "Testimony not found" }, { status: 404 })
    }

    // Handle action: submit, cancel
    if (action === "submit") {
      if (!["DRAFT", "REJECTED", "CANCELLED"].includes(testimony.status)) {
        return NextResponse.json({ error: "Only draft, rejected, or cancelled testimonies can be submitted" }, { status: 400 })
      }
      const updated = await prisma.testimony.update({
        where: { id },
        data: { status: "PENDING_APPROVAL", updatedAt: new Date() },
      })
      return NextResponse.json({ testimony: updated })
    }

    if (action === "cancel") {
      if (!["DRAFT", "PENDING_APPROVAL", "REJECTED"].includes(testimony.status)) {
        return NextResponse.json({ error: "Cannot cancel this testimony" }, { status: 400 })
      }
      const updated = await prisma.testimony.update({
        where: { id },
        data: { status: "CANCELLED", updatedAt: new Date() },
      })
      return NextResponse.json({ testimony: updated })
    }

    // Regular update - only allowed for DRAFT, REJECTED, CANCELLED
    if (!["DRAFT", "REJECTED", "CANCELLED"].includes(testimony.status)) {
      return NextResponse.json({ error: "Only draft, rejected, or cancelled testimonies can be edited" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (title?.trim()) updateData.title = title.trim()
    if (description?.trim()) updateData.description = description.trim()

    const updated = await prisma.testimony.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ testimony: updated })
  } catch (error) {
    console.error("Failed to update testimony:", error)
    return NextResponse.json({ error: "Failed to update testimony" }, { status: 500 })
  }
}

// DELETE - Delete a testimony (only DRAFT or CANCELLED)
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Testimony ID is required" }, { status: 400 })
    }

    const testimony = await prisma.testimony.findUnique({ where: { id } })
    if (!testimony || testimony.userId !== session.user.id) {
      return NextResponse.json({ error: "Testimony not found" }, { status: 404 })
    }

    if (!["DRAFT", "CANCELLED"].includes(testimony.status)) {
      return NextResponse.json({ error: "Only draft or cancelled testimonies can be deleted" }, { status: 400 })
    }

    await prisma.testimony.delete({ where: { id } })
    return NextResponse.json({ message: "Testimony deleted" })
  } catch (error) {
    console.error("Failed to delete testimony:", error)
    return NextResponse.json({ error: "Failed to delete testimony" }, { status: 500 })
  }
}

