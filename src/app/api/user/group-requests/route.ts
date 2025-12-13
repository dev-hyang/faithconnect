import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get user's group join requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get("groupId")

    // If groupId is provided, check if user has a pending request for that group
    if (groupId) {
      const pendingRequest = await prisma.groupJoinRequest.findFirst({
        where: {
          userId: session.user.id,
          groupId,
          status: "PENDING",
        },
      })
      return NextResponse.json({ hasPending: !!pendingRequest })
    }

    // Otherwise, get all user's group join requests
    const requests = await prisma.groupJoinRequest.findMany({
      where: { userId: session.user.id },
      include: {
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
  } catch (error) {
    console.error("Get user group requests error:", error)
    return NextResponse.json({ error: "Failed to fetch group requests" }, { status: 500 })
  }
}

