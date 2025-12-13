import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - Fetch testimonies for admin review
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const whereClause: Record<string, unknown> = {}
    if (status && status !== "ALL") {
      whereClause.status = status
    }

    const testimonies = await prisma.testimony.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })

    return NextResponse.json({ testimonies })
  } catch (error) {
    console.error("Failed to fetch testimonies for admin:", error)
    return NextResponse.json({ error: "Failed to fetch testimonies" }, { status: 500 })
  }
}

// PUT - Approve or reject a testimony
export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, adminComment } = body

    if (!id) {
      return NextResponse.json({ error: "Testimony ID is required" }, { status: 400 })
    }

    if (!status || !["PUBLISHED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be PUBLISHED or REJECTED" }, { status: 400 })
    }

    const testimony = await prisma.testimony.findUnique({ where: { id } })
    if (!testimony) {
      return NextResponse.json({ error: "Testimony not found" }, { status: 404 })
    }

    if (testimony.status !== "PENDING_APPROVAL") {
      return NextResponse.json({ error: "Only pending testimonies can be reviewed" }, { status: 400 })
    }

    // Prevent admin from reviewing their own testimony
    if (testimony.userId === session.user.id) {
      return NextResponse.json({ error: "You cannot review your own testimony" }, { status: 403 })
    }

    const updated = await prisma.testimony.update({
      where: { id },
      data: {
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        adminComment: adminComment || null,
      },
    })

    return NextResponse.json({ testimony: updated })
  } catch (error) {
    console.error("Failed to review testimony:", error)
    return NextResponse.json({ error: "Failed to review testimony" }, { status: 500 })
  }
}

