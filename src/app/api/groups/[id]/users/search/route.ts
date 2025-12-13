import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Search users for group invitation (leaders and admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Search query must be at least 2 characters" }, { status: 400 })
    }

    // Check if user is a leader of this group or ADMIN
    const group = await prisma.fellowshipGroup.findUnique({
      where: { id },
      include: { members: true },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    const isAdmin = session.user.role === "ADMIN"
    const isLeader = group.members.some((m) => m.userId === session.user.id && m.role === "LEADER")

    if (!isAdmin && !isLeader) {
      return NextResponse.json({ error: "Only leaders and admins can search users for invitations" }, { status: 403 })
    }

    // Get existing member IDs
    const existingMemberIds = group.members.map((m) => m.userId)

    // Get users with pending invitations for this group
    const pendingInvitations = await prisma.groupInvitation.findMany({
      where: { groupId: id, status: "PENDING" },
      select: { userId: true },
    })
    const pendingInviteIds = pendingInvitations.map((i) => i.userId)

    // Get users with pending join requests for this group
    const pendingRequests = await prisma.groupJoinRequest.findMany({
      where: { groupId: id, status: "PENDING" },
      select: { userId: true },
    })
    const pendingRequestIds = pendingRequests.map((r) => r.userId)

    // Search users by email (partial match, case-insensitive)
    const lowerQuery = query.toLowerCase()
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        image: true,
        gender: true,
        dateOfBirth: true,
        marriedStatus: true,
      },
      orderBy: { email: "asc" },
    })

    // Filter by email case-insensitively in JavaScript
    const matchingUsers = allUsers.filter((user) => user.email.toLowerCase().includes(lowerQuery))

    // Separate into available users and already-in-group users
    const users = matchingUsers
      .filter((user) => !existingMemberIds.includes(user.id) && !pendingInviteIds.includes(user.id) && !pendingRequestIds.includes(user.id))
      .slice(0, 10)

    // Check if any matching users are already members
    const alreadyMembers = matchingUsers
      .filter((user) => existingMemberIds.includes(user.id))
      .map((user) => ({ email: user.email, fullName: user.fullName }))

    // Check if any matching users have pending invites
    const hasPendingInvite = matchingUsers
      .filter((user) => pendingInviteIds.includes(user.id))
      .map((user) => ({ email: user.email, fullName: user.fullName }))

    // Check if any matching users have pending requests
    const hasPendingRequest = matchingUsers
      .filter((user) => pendingRequestIds.includes(user.id))
      .map((user) => ({ email: user.email, fullName: user.fullName }))

    return NextResponse.json({ users, alreadyMembers, hasPendingInvite, hasPendingRequest })
  } catch (error) {
    console.error("Search users error:", error)
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
}

