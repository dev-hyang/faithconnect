import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - List all fellowship groups
export async function GET() {
  try {
    const groups = await prisma.fellowshipGroup.findMany({
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
          select: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform to include leader info
    const transformedGroups = groups.map((group) => ({
      ...group,
      leader: group.members.find((m) => m.role === "LEADER")?.user || null,
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

    const { name, description, imageUrl, schedule, maxMembers } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      )
    }

    const group = await prisma.fellowshipGroup.create({
      data: {
        name,
        description,
        imageUrl,
        schedule: schedule || null,
        maxMembers: maxMembers || 20,
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

