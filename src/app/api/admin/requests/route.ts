import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - Fetch all user requests (admin only)
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const whereClause: Record<string, unknown> = {}
    if (status && status !== "ALL") {
      whereClause.status = status
    }

    const requests = await prisma.userRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Failed to fetch requests:", error)
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
  }
}

// PUT - Approve or decline a request (admin only)
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
    const { id, status, reviewNote } = body

    if (!id) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    if (!status || !["APPROVED", "DECLINED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const existingRequest = await prisma.userRequest.findUnique({ where: { id } })
    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (existingRequest.status !== "SUBMITTED") {
      return NextResponse.json({ error: "Only submitted requests can be reviewed" }, { status: 400 })
    }

    // Update the request
    const updatedRequest = await prisma.userRequest.update({
      where: { id },
      data: {
        status,
        reviewNote,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    })

    // If approved membership request, update user role and joinedAt
    if (status === "APPROVED" && existingRequest.category === "MEMBERSHIP") {
      if (existingRequest.requestType === "APPLY_NEW" || existingRequest.requestType === "TRANSFER_IN") {
        await prisma.user.update({
          where: { id: existingRequest.userId },
          data: {
            role: "MEMBER",
            joinedAt: new Date(), // Set membership approval date
          },
        })
      } else if (existingRequest.requestType === "TRANSFER_OUT") {
        await prisma.user.update({
          where: { id: existingRequest.userId },
          data: {
            role: "GUEST",
            joinedAt: null, // Clear joinedAt when transferring out
          },
        })
      }
    }

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error("Failed to process request:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
