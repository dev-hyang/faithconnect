import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/user/leader-requests - Get incoming join requests for groups where user is a leader
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Find all groups where user is a leader
  const leaderMemberships = await prisma.fellowshipMembership.findMany({
    where: {
      userId: session.user.id,
      role: "LEADER",
    },
    select: { groupId: true },
  })

  const groupIds = leaderMemberships.map((m) => m.groupId)

  if (groupIds.length === 0) {
    return NextResponse.json({ requests: [] })
  }

  // Get all pending join requests for these groups
  const requests = await prisma.groupJoinRequest.findMany({
    where: {
      groupId: { in: groupIds },
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          image: true,
          gender: true,
          dateOfBirth: true,
          marriedStatus: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          visibility: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ requests })
}

