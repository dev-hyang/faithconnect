import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get user's group memberships
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const memberships = await prisma.fellowshipMembership.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            visibility: true,
            gender: true,
            imageUrl: true,
            scheduleType: true,
            scheduleDetails: true,
            _count: {
              select: { members: true, events: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    })

    return NextResponse.json({ memberships })
  } catch (error) {
    console.error("Get user groups error:", error)
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 })
  }
}

