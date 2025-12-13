import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Fetch all published testimonies (public)
export async function GET() {
  try {
    const testimonies = await prisma.testimony.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({ testimonies })
  } catch (error) {
    console.error("Failed to fetch testimonies:", error)
    return NextResponse.json({ error: "Failed to fetch testimonies" }, { status: 500 })
  }
}

