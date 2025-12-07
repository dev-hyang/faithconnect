import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const VALID_CATEGORIES = ["MEMBERSHIP", "GROUP"]
const VALID_MEMBERSHIP_TYPES = ["APPLY_NEW", "TRANSFER_IN", "TRANSFER_OUT"]
const VALID_GROUP_TYPES = ["JOIN_GROUP", "LEAVE_GROUP"]
const VALID_STATUSES = ["INITIAL", "SUBMITTED", "APPROVED", "DECLINED"]

// GET - Fetch user's requests
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requests = await prisma.userRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Failed to fetch requests:", error)
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
  }
}

// POST - Create a new request
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { category, requestType, reason, testimony, previousChurch, targetChurch, groupId, groupName } = body

    // Validate category
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    // Validate request type based on category
    if (category === "MEMBERSHIP" && !VALID_MEMBERSHIP_TYPES.includes(requestType)) {
      return NextResponse.json({ error: "Invalid membership request type" }, { status: 400 })
    }
    if (category === "GROUP" && !VALID_GROUP_TYPES.includes(requestType)) {
      return NextResponse.json({ error: "Invalid group request type" }, { status: 400 })
    }

    // Generate title based on request type
    const titleMap: Record<string, string> = {
      APPLY_NEW: "Apply for New Membership",
      TRANSFER_IN: "Transfer-in Membership",
      TRANSFER_OUT: "Transfer-out Membership",
      JOIN_GROUP: `Join Group: ${groupName || "Unknown"}`,
      LEAVE_GROUP: `Leave Group: ${groupName || "Unknown"}`,
    }

    // Check for existing pending/submitted request of same type
    const existingRequest = await prisma.userRequest.findFirst({
      where: {
        userId: session.user.id,
        category,
        requestType,
        status: { in: ["INITIAL", "SUBMITTED"] },
      },
    })

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending request of this type" }, { status: 400 })
    }

    const newRequest = await prisma.userRequest.create({
      data: {
        userId: session.user.id,
        category,
        requestType,
        title: titleMap[requestType] || requestType,
        status: "INITIAL",
        reason,
        testimony,
        previousChurch: requestType === "TRANSFER_IN" ? previousChurch : null,
        targetChurch: requestType === "TRANSFER_OUT" ? targetChurch : null,
        groupId: category === "GROUP" ? groupId : null,
        groupName: category === "GROUP" ? groupName : null,
      },
    })

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error("Failed to create request:", error)
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 })
  }
}

// PUT - Update a request (only INITIAL status can be edited)
export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, reason, testimony, previousChurch, targetChurch, status } = body

    if (!id) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    const existingRequest = await prisma.userRequest.findUnique({ where: { id } })

    if (!existingRequest || existingRequest.userId !== session.user.id) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Only allow editing INITIAL requests, or submitting them
    if (existingRequest.status !== "INITIAL" && status !== "SUBMITTED") {
      return NextResponse.json({ error: "Cannot edit a submitted request" }, { status: 400 })
    }

    // Validate before submitting
    if (status === "SUBMITTED") {
      if (!existingRequest.reason && !reason) {
        return NextResponse.json({ error: "Reason is required to submit" }, { status: 400 })
      }
      if (!existingRequest.testimony && !testimony) {
        return NextResponse.json({ error: "Testimony is required to submit" }, { status: 400 })
      }
    }

    const updatedRequest = await prisma.userRequest.update({
      where: { id },
      data: {
        reason: reason ?? existingRequest.reason,
        testimony: testimony ?? existingRequest.testimony,
        previousChurch: previousChurch ?? existingRequest.previousChurch,
        targetChurch: targetChurch ?? existingRequest.targetChurch,
        status: status && VALID_STATUSES.includes(status) ? status : existingRequest.status,
      },
    })

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error("Failed to update request:", error)
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 })
  }
}

// DELETE - Delete a request (only INITIAL status can be deleted)
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    const existingRequest = await prisma.userRequest.findUnique({ where: { id } })

    if (!existingRequest || existingRequest.userId !== session.user.id) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Only allow deleting INITIAL requests
    if (existingRequest.status !== "INITIAL") {
      return NextResponse.json({ error: "Cannot delete a submitted request" }, { status: 400 })
    }

    await prisma.userRequest.delete({ where: { id } })

    return NextResponse.json({ message: "Request deleted successfully" })
  } catch (error) {
    console.error("Failed to delete request:", error)
    return NextResponse.json({ error: "Failed to delete request" }, { status: 500 })
  }
}
