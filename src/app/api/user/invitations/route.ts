import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get user's group invitations
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invitations = await prisma.groupInvitation.findMany({
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
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error("Get user invitations error:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}

// PATCH - Accept or decline an invitation
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invitationId, action } = await request.json()

    if (!invitationId || !action) {
      return NextResponse.json({ error: "Invitation ID and action are required" }, { status: 400 })
    }

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Action must be 'accept' or 'decline'" }, { status: 400 })
    }

    // Find the invitation
    const invitation = await prisma.groupInvitation.findUnique({
      where: { id: invitationId },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.userId !== session.user.id) {
      return NextResponse.json({ error: "This invitation is not for you" }, { status: 403 })
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "This invitation has already been processed" }, { status: 400 })
    }

    if (action === "accept") {
      // Check if group is full
      if (invitation.group._count.members >= invitation.group.maxMembers) {
        return NextResponse.json({ error: "Sorry, this group is now full" }, { status: 400 })
      }

      // Accept invitation: update status and add user to group
      await prisma.$transaction([
        prisma.groupInvitation.update({
          where: { id: invitationId },
          data: { status: "ACCEPTED" },
        }),
        prisma.fellowshipMembership.create({
          data: {
            userId: session.user.id,
            groupId: invitation.groupId,
            role: "MEMBER",
          },
        }),
      ])

      return NextResponse.json({ 
        success: true, 
        message: `You have joined ${invitation.group.name}!` 
      })
    } else {
      // Decline invitation
      await prisma.groupInvitation.update({
        where: { id: invitationId },
        data: { status: "DECLINED" },
      })

      return NextResponse.json({ 
        success: true, 
        message: "Invitation declined" 
      })
    }
  } catch (error) {
    console.error("Process invitation error:", error)
    return NextResponse.json({ error: "Failed to process invitation" }, { status: 500 })
  }
}

