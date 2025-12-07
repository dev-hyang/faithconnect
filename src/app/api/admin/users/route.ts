import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - Fetch all users (admin only)
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    const whereClause: Record<string, unknown> = {}
    if (role && role !== "ALL") {
      whereClause.role = role
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

// PUT - Update user (admin only)
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
    const { id, role, isActive, ...profileData } = body

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    // Update role if provided
    if (role !== undefined) {
      if (!["ADMIN", "MEMBER", "GUEST"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }
      updateData.role = role
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // Update profile fields if provided
    const allowedFields = [
      "fullName", "phone", "address", "city", "state", "zipCode",
      "isBaptized", "whenBaptized", "marriedStatus", "spouseGender",
      "ministryRole", "responsibility", "officePhone"
    ]

    for (const field of allowedFields) {
      if (profileData[field] !== undefined) {
        updateData[field] = profileData[field]
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Failed to update user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
