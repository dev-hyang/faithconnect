import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Valid values for enums
const VALID_ROLES = ["ADMIN", "MEMBER", "GUEST"]
const VALID_MARRIED_STATUS = ["SINGLE", "MARRIED", "WIDOWED", "DIVORCED"]
const VALID_SPOUSE_GENDER = ["MALE", "FEMALE"]

// GET - Get current user profile with all fields
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
        // Contact info
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        // Faith-related fields
        isBaptized: true,
        whenBaptized: true,
        marriedStatus: true,
        spouseGender: true,
        // Admin-specific fields
        ministryRole: true,
        responsibility: true,
        officePhone: true,
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

// Define update data type
interface ProfileUpdateData {
  email?: string
  fullName?: string
  password?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  isBaptized?: boolean
  whenBaptized?: Date | null
  marriedStatus?: string | null
  spouseGender?: string | null
  ministryRole?: string | null
  responsibility?: string | null
  officePhone?: string | null
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

    const body = await request.json()
    const {
      email,
      fullName,
      currentPassword,
      newPassword,
      phone,
      address,
      city,
      state,
      zipCode,
      isBaptized,
      whenBaptized,
      marriedStatus,
      spouseGender,
      ministryRole,
      responsibility,
      officePhone,
    } = body

    // Prepare update data
    const updateData: ProfileUpdateData = {}

    // Email update
    if (email) {
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

    // Basic info
    if (fullName !== undefined) updateData.fullName = fullName

    // Contact info
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (zipCode !== undefined) updateData.zipCode = zipCode

    // Faith-related fields
    if (isBaptized !== undefined) updateData.isBaptized = isBaptized
    if (whenBaptized !== undefined) {
      updateData.whenBaptized = whenBaptized ? new Date(whenBaptized) : null
    }

    // Validate and set marriedStatus
    if (marriedStatus !== undefined) {
      if (marriedStatus && !VALID_MARRIED_STATUS.includes(marriedStatus)) {
        return NextResponse.json(
          { error: `Invalid married status. Must be one of: ${VALID_MARRIED_STATUS.join(", ")}` },
          { status: 400 }
        )
      }
      updateData.marriedStatus = marriedStatus || null
    }

    // Validate spouseGender - required if married
    if (spouseGender !== undefined) {
      if (spouseGender && !VALID_SPOUSE_GENDER.includes(spouseGender)) {
        return NextResponse.json(
          { error: `Invalid spouse gender. Must be one of: ${VALID_SPOUSE_GENDER.join(", ")}` },
          { status: 400 }
        )
      }
      updateData.spouseGender = spouseGender || null
    }

    // Validate: if married, spouse gender is required
    const effectiveMarriedStatus = marriedStatus !== undefined ? marriedStatus : body.currentMarriedStatus
    const effectiveSpouseGender = spouseGender !== undefined ? spouseGender : body.currentSpouseGender

    if (effectiveMarriedStatus === "MARRIED" && !effectiveSpouseGender) {
      return NextResponse.json(
        { error: "Spouse gender is required when married status is MARRIED" },
        { status: 400 }
      )
    }

    // Admin-specific fields (only update if user is admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, password: true },
    })

    if (currentUser?.role === "ADMIN") {
      if (ministryRole !== undefined) updateData.ministryRole = ministryRole
      if (responsibility !== undefined) updateData.responsibility = responsibility
      if (officePhone !== undefined) updateData.officePhone = officePhone
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 }
        )
      }

      if (!currentUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password)

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
        createdAt: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        isBaptized: true,
        whenBaptized: true,
        marriedStatus: true,
        spouseGender: true,
        ministryRole: true,
        responsibility: true,
        officePhone: true,
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

// Export valid values for client-side use
export { VALID_ROLES, VALID_MARRIED_STATUS, VALID_SPOUSE_GENDER }

