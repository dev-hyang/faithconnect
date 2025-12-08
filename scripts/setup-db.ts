/**
 * Database Setup Script
 * 
 * This script checks if the database exists and sets it up if needed.
 * - If database doesn't exist: creates it, runs migrations, and seeds data
 * - If database exists: skips setup
 * 
 * Usage: npx tsx scripts/setup-db.ts
 */

import { existsSync } from "fs"
import { execSync } from "child_process"
import { join } from "path"

const DB_PATH = join(process.cwd(), "prisma", "dev.db")

async function main() {
  console.log("🔍 Checking database status...")

  if (existsSync(DB_PATH)) {
    console.log("✅ Database already exists. Skipping setup.")
    console.log("   To reset the database, run: npm run db:reset")
    return
  }

  console.log("📦 Database not found. Setting up...")

  try {
    // Generate Prisma client
    console.log("\n1️⃣  Generating Prisma client...")
    execSync("npx prisma generate", { stdio: "inherit" })

    // Push schema to database (creates the database)
    console.log("\n2️⃣  Creating database and applying schema...")
    execSync("npx prisma db push", { stdio: "inherit" })

    // Seed the database
    console.log("\n3️⃣  Seeding database with initial data...")
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" })

    console.log("\n✅ Database setup complete!")
    console.log("\n📋 Test accounts created:")
    console.log("   Admin:  admin1@example.com / 123Abc!")
    console.log("   Member: member1@example.com / 123Abc!")
    console.log("   Guest:  guest1@example.com / 123Abc!")
  } catch (error) {
    console.error("\n❌ Database setup failed:", error)
    process.exit(1)
  }
}

main()

