import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      address,
      city,
      state,
      zipCode,
      isAdmin,
      ministryRole,
      responsibility,
      officePhone,
    } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (!phone || !address) {
      return NextResponse.json(
        { error: "Phone and address are required" },
        { status: 400 }
      )
    }

    // Admin-specific validation
    if (isAdmin) {
      if (!ministryRole || !responsibility || !officePhone) {
        return NextResponse.json(
          { error: "All ministry fields are required for admin registration" },
          { status: 400 }
        )
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user - ADMIN if admin checkbox checked, otherwise GUEST
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: fullName || null,
        role: isAdmin ? "ADMIN" : "GUEST",
        phone,
        address,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        ministryRole: isAdmin ? ministryRole : null,
        responsibility: isAdmin ? responsibility : null,
        officePhone: isAdmin ? officePhone : null,
      },
    })

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

