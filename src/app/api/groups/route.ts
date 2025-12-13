import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Visibility levels:
// PUBLIC - visible to all (ADMIN, MEMBER, GUEST)
// INTERNAL - visible to ADMIN and MEMBER only
// PRIVATE - visible to ADMIN only
// Note: Users can always see groups they are members of or have pending join requests for

// GET - List all fellowship groups based on user role visibility
export async function GET() {
  try {
    const session = await auth()
    const userRole = session?.user?.role || "GUEST"
    const userId = session?.user?.id

    // Build visibility filter based on user role
    let visibilityFilter: string[]
    if (userRole === "ADMIN") {
      // ADMIN can see all groups
      visibilityFilter = ["PUBLIC", "INTERNAL", "PRIVATE"]
    } else if (userRole === "MEMBER") {
      // MEMBER can see PUBLIC and INTERNAL groups
      visibilityFilter = ["PUBLIC", "INTERNAL"]
    } else {
      // GUEST can only see PUBLIC groups
      visibilityFilter = ["PUBLIC"]
    }

    // Build where clause: visibility-based OR user is member/has pending request
    const whereClause = userId
      ? {
          OR: [
            { visibility: { in: visibilityFilter } },
            { members: { some: { userId } } },
            { joinRequests: { some: { userId, status: "PENDING" } } },
          ],
        }
      : { visibility: { in: visibilityFilter } }

    const groups = await prisma.fellowshipGroup.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        members: {
          where: { role: "LEADER" },
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        _count: {
          select: { members: true, events: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform to include leader info and all leaders
    const transformedGroups = groups.map((group) => ({
      ...group,
      leader: group.members.find((m) => m.role === "LEADER")?.user || null,
      leaders: group.members.filter((m) => m.role === "LEADER").map((m) => m.user),
    }))

    return NextResponse.json({ groups: transformedGroups })
  } catch (error) {
    console.error("Get groups error:", error)
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    )
  }
}

// POST - Create a new fellowship group
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only ADMIN and MEMBER can create groups
    if (session.user.role === "GUEST") {
      return NextResponse.json(
        { error: "Guests cannot create groups. Please contact an admin to upgrade your account." },
        { status: 403 }
      )
    }

    const {
      name,
      description,
      imageUrl,
      visibility = "PUBLIC",
      scheduleType = "ADHOC",
      scheduleDetails,
      maxMembers,
      maxLeaders = 10,
      gender = "ALL",
      minAge,
      maxAge,
      marriedOnly = false
    } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      )
    }

    // Validate visibility
    if (!["PUBLIC", "INTERNAL", "PRIVATE"].includes(visibility)) {
      return NextResponse.json(
        { error: "Invalid visibility. Must be PUBLIC, INTERNAL, or PRIVATE." },
        { status: 400 }
      )
    }

    // Validate scheduleType
    if (!["RECURRING", "ADHOC"].includes(scheduleType)) {
      return NextResponse.json(
        { error: "Invalid schedule type. Must be RECURRING or ADHOC." },
        { status: 400 }
      )
    }

    // Validate gender
    if (!["ALL", "FEMALE", "MALE"].includes(gender)) {
      return NextResponse.json(
        { error: "Invalid gender. Must be ALL, FEMALE, or MALE." },
        { status: 400 }
      )
    }

    // Validate maxMembers (range 3-20, default 10)
    const validMaxMembers = Math.min(20, Math.max(3, parseInt(maxMembers) || 10))

    // Validate maxLeaders (range 3-20)
    const validMaxLeaders = Math.min(20, Math.max(3, parseInt(maxLeaders) || 10))

    // Validate age range (0-120)
    const validMinAge = minAge !== null && minAge !== undefined ? Math.min(120, Math.max(0, parseInt(minAge))) : null
    const validMaxAge = maxAge !== null && maxAge !== undefined ? Math.min(120, Math.max(0, parseInt(maxAge))) : null

    // Validate age range logic
    if (validMinAge !== null && validMaxAge !== null && validMinAge > validMaxAge) {
      return NextResponse.json(
        { error: "Minimum age cannot be greater than maximum age." },
        { status: 400 }
      )
    }

    const group = await prisma.fellowshipGroup.create({
      data: {
        name,
        description,
        imageUrl,
        visibility,
        scheduleType,
        scheduleDetails: scheduleDetails || null,
        maxMembers: validMaxMembers,
        maxLeaders: validMaxLeaders,
        gender,
        minAge: validMinAge,
        maxAge: validMaxAge,
        marriedOnly: Boolean(marriedOnly),
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    })

    // Add creator as a member with LEADER role
    await prisma.fellowshipMembership.create({
      data: {
        userId: session.user.id,
        groupId: group.id,
        role: "LEADER",
      },
    })

    return NextResponse.json(
      { message: "Group created successfully", group },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create group error:", error)
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    )
  }
}

