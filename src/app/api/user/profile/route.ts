import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET - Get current user profile
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        image: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { email, fullName, currentPassword, newPassword } = await request.json()

    // Prepare update data
    const updateData: { email?: string; fullName?: string; password?: string } = {}

    if (email) {
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: session.user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        )
      }

      updateData.email = email
    }

    if (fullName !== undefined) {
      updateData.fullName = fullName
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 }
        )
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      })

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        )
      }

      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        image: true,
      },
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

