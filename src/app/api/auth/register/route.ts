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
      gender,
      dateOfBirth,
      isBaptized,
      whenBaptized,
      marriedStatus,
      spouseGender,
      applyForMembership,
      faithStatement,
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

    if (!gender) {
      return NextResponse.json(
        { error: "Gender is required" },
        { status: 400 }
      )
    }

    // Spouse gender required if married
    if (marriedStatus === "MARRIED" && !spouseGender) {
      return NextResponse.json(
        { error: "Spouse gender is required when married" },
        { status: 400 }
      )
    }

    // Membership application validation
    if (applyForMembership) {
      if (!isBaptized) {
        return NextResponse.json(
          { error: "Baptism is required for membership application" },
          { status: 400 }
        )
      }
      if (!faithStatement) {
        return NextResponse.json(
          { error: "Faith statement is required for membership application" },
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

    // Create user - always GUEST role initially (even if applying for membership)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: fullName || null,
        role: "GUEST", // Always start as GUEST
        phone,
        address,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        isBaptized: isBaptized || false,
        whenBaptized: whenBaptized ? new Date(whenBaptized) : null,
        marriedStatus: marriedStatus || null,
        spouseGender: marriedStatus === "MARRIED" ? spouseGender : null,
      },
    })

    // If user applied for membership, create a membership request
    if (applyForMembership) {
      await prisma.userRequest.create({
        data: {
          userId: user.id,
          category: "MEMBERSHIP",
          requestType: "APPLY_NEW",
          title: "Apply for New Membership",
          status: "SUBMITTED", // Auto-submit since they applied during registration
          reason: "Applied during account registration",
          testimony: faithStatement,
        },
      })
    }

    return NextResponse.json(
      {
        message: applyForMembership
          ? "User registered successfully. Your membership application has been submitted for review."
          : "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        membershipRequestCreated: applyForMembership,
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

