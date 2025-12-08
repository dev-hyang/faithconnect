import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("123Abc!", 12)

  // 2 ADMIN accounts (createdAt <= joinedAt, joinedAt = membership approval date)
  const admins = [
    {
      email: "admin1@example.com",
      fullName: "Pastor John Smith",
      phone: "(101) 202-0001",
      address: "100 Church Street",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      marriedStatus: "MARRIED",
      spouseGender: "FEMALE",
      isBaptized: true,
      whenBaptized: new Date("1995-04-15"),
      createdAt: new Date("2009-11-01"), // Account created before joining
      joinedAt: new Date("2010-01-15"), // Founding pastor
      ministryRole: "Senior Pastor",
      responsibility: "Pastoral care, preaching, and church leadership",
      officePhone: "(101) 202-0001 x1",
    },
    {
      email: "admin2@example.com",
      fullName: "Deacon Mary Johnson",
      phone: "(101) 202-0002",
      address: "200 Ministry Lane",
      city: "Springfield",
      state: "IL",
      zipCode: "62702",
      marriedStatus: "MARRIED",
      spouseGender: "MALE",
      isBaptized: true,
      whenBaptized: new Date("2000-06-20"),
      createdAt: new Date("2015-04-15"), // Account created before joining
      joinedAt: new Date("2015-06-01"), // Joined as admin later
      ministryRole: "Church Administrator",
      responsibility: "Membership management, events coordination, and admin support",
      officePhone: "(101) 202-0002 x2",
    },
  ]

  // 7 GUEST accounts (original 5 + 2 new) - createdAt within last 5 years, no joinedAt
  const guests = [
    {
      email: "guest1@example.com",
      fullName: "Alice Johnson",
      phone: "(101) 202-0101",
      address: "123 Oak Street",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      marriedStatus: "SINGLE",
      isBaptized: false,
      createdAt: new Date("2024-06-15"), // 6 months ago
    },
    {
      email: "guest2@example.com",
      fullName: "Bob Williams",
      phone: "(101) 202-0102",
      address: "456 Maple Avenue",
      city: "Columbus",
      state: "OH",
      zipCode: "43215",
      marriedStatus: "MARRIED",
      spouseGender: "FEMALE",
      isBaptized: true,
      whenBaptized: new Date("2020-06-15"),
      createdAt: new Date("2024-09-01"), // 3 months ago
    },
    {
      email: "guest3@example.com",
      fullName: "Carol Davis",
      phone: "(101) 202-0103",
      address: "789 Pine Road",
      city: "Austin",
      state: "TX",
      zipCode: "73301",
      marriedStatus: "DIVORCED",
      isBaptized: false,
      createdAt: new Date("2023-03-20"), // ~2 years ago
    },
    {
      email: "guest4@example.com",
      fullName: "Daniel Brown",
      phone: "(101) 202-0104",
      address: "321 Elm Lane",
      city: "Denver",
      state: "CO",
      zipCode: "80202",
      marriedStatus: "WIDOWED",
      isBaptized: true,
      whenBaptized: new Date("2015-03-22"),
      createdAt: new Date("2024-11-25"), // 2 weeks ago
    },
    {
      email: "guest5@example.com",
      fullName: "Emily Martinez",
      phone: "(101) 202-0105",
      address: "654 Cedar Court",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      marriedStatus: "SINGLE",
      isBaptized: false,
      createdAt: new Date("2024-11-20"), // 3 weeks ago
    },
    {
      email: "guest6@example.com",
      fullName: "Rachel Green",
      phone: "(101) 202-0106",
      address: "789 Central Park West",
      city: "New York",
      state: "NY",
      zipCode: "10024",
      marriedStatus: "SINGLE",
      isBaptized: true,
      whenBaptized: new Date("2023-01-15"),
      createdAt: new Date("2021-08-10"), // ~4 years ago
    },
    {
      email: "guest7@example.com",
      fullName: "Michael Scott",
      phone: "(101) 202-0107",
      address: "1725 Slough Avenue",
      city: "Scranton",
      state: "PA",
      zipCode: "18503",
      marriedStatus: "DIVORCED",
      isBaptized: false,
      createdAt: new Date("2022-05-15"), // ~2.5 years ago
    },
  ]

  // 15 MEMBER accounts (original 10 + 5 new) - createdAt <= joinedAt, joinedAt = membership approval date
  const members = [
    {
      email: "member1@example.com",
      fullName: "Frank Thompson",
      phone: "(101) 202-0201",
      address: "111 First Street",
      city: "Portland",
      state: "OR",
      zipCode: "97201",
      marriedStatus: "MARRIED",
      spouseGender: "FEMALE",
      isBaptized: true,
      whenBaptized: new Date("2018-04-10"),
      createdAt: new Date("2018-03-15"), // Account created before membership
      joinedAt: new Date("2018-05-01"), // Approved shortly after baptism
    },
    {
      email: "member2@example.com",
      fullName: "Grace Lee",
      phone: "(101) 202-0202",
      address: "222 Second Avenue",
      city: "Phoenix",
      state: "AZ",
      zipCode: "85001",
      marriedStatus: "SINGLE",
      isBaptized: true,
      whenBaptized: new Date("2019-08-25"),
      createdAt: new Date("2019-08-01"), // Account created before transfer
      joinedAt: new Date("2019-09-15"), // Transfer-in approved
    },
    {
      email: "member3@example.com",
      fullName: "Henry Wilson",
      phone: "(101) 202-0203",
      address: "333 Third Boulevard",
      city: "Nashville",
      state: "TN",
      zipCode: "37201",
      marriedStatus: "MARRIED",
      spouseGender: "FEMALE",
      isBaptized: true,
      whenBaptized: new Date("2017-12-01"),
      createdAt: new Date("2017-11-15"),
      joinedAt: new Date("2018-01-10"),
    },
    {
      email: "member4@example.com",
      fullName: "Isabella Garcia",
      phone: "(101) 202-0204",
      address: "444 Fourth Drive",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      marriedStatus: "DIVORCED",
      isBaptized: true,
      whenBaptized: new Date("2016-07-14"),
      createdAt: new Date("2016-06-01"),
      joinedAt: new Date("2016-08-20"),
    },
    {
      email: "member5@example.com",
      fullName: "James Anderson",
      phone: "(101) 202-0205",
      address: "555 Fifth Place",
      city: "Atlanta",
      state: "GA",
      zipCode: "30301",
      marriedStatus: "MARRIED",
      spouseGender: "FEMALE",
      isBaptized: true,
      whenBaptized: new Date("2021-01-30"),
      createdAt: new Date("2021-01-15"),
      joinedAt: new Date("2021-03-01"),
    },
    {
      email: "member6@example.com",
      fullName: "Katherine Chen",
      phone: "(101) 202-0206",
      address: "666 Sixth Way",
      city: "Boston",
      state: "MA",
      zipCode: "02101",
      marriedStatus: "SINGLE",
      isBaptized: true,
      whenBaptized: new Date("2020-11-08"),
      createdAt: new Date("2020-10-20"),
      joinedAt: new Date("2020-12-15"),
    },
    {
      email: "member7@example.com",
      fullName: "Liam Robinson",
      phone: "(101) 202-0207",
      address: "777 Seventh Circle",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      marriedStatus: "WIDOWED",
      isBaptized: true,
      whenBaptized: new Date("2010-05-20"),
      createdAt: new Date("2010-04-01"), // Long-time member
      joinedAt: new Date("2010-06-01"),
    },
    {
      email: "member8@example.com",
      fullName: "Mia Patel",
      phone: "(101) 202-0208",
      address: "888 Eighth Lane",
      city: "San Diego",
      state: "CA",
      zipCode: "92101",
      marriedStatus: "MARRIED",
      spouseGender: "MALE",
      isBaptized: true,
      whenBaptized: new Date("2019-02-14"),
      createdAt: new Date("2019-01-20"),
      joinedAt: new Date("2019-03-10"),
    },
  ]

  // Continue members array - createdAt <= joinedAt
  const moreMembers = [
    {
      email: "member9@example.com",
      fullName: "Noah Kim",
      phone: "(101) 202-0209",
      address: "999 Ninth Court",
      city: "Dallas",
      state: "TX",
      zipCode: "75201",
      marriedStatus: "SINGLE",
      isBaptized: true,
      whenBaptized: new Date("2022-06-18"),
      createdAt: new Date("2022-05-01"),
      joinedAt: new Date("2022-07-20"),
    },
    {
      email: "member10@example.com",
      fullName: "Olivia Taylor",
      phone: "(101) 202-0210",
      address: "1010 Tenth Street",
      city: "Philadelphia",
      state: "PA",
      zipCode: "19101",
      marriedStatus: "MARRIED",
      spouseGender: "MALE",
      isBaptized: true,
      whenBaptized: new Date("2018-09-05"),
      createdAt: new Date("2018-08-15"),
      joinedAt: new Date("2018-10-15"),
    },
    {
      email: "member11@example.com",
      fullName: "Ethan Carter",
      phone: "(101) 202-0211",
      address: "1111 Eleventh Avenue",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      marriedStatus: "SINGLE",
      isBaptized: true,
      whenBaptized: new Date("2021-03-28"),
      createdAt: new Date("2021-02-15"),
      joinedAt: new Date("2021-05-01"),
    },
    {
      email: "member12@example.com",
      fullName: "Sophia Rodriguez",
      phone: "(101) 202-0212",
      address: "1212 Twelfth Boulevard",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      marriedStatus: "MARRIED",
      spouseGender: "MALE",
      isBaptized: true,
      whenBaptized: new Date("2019-07-12"),
      createdAt: new Date("2019-06-01"),
      joinedAt: new Date("2019-08-25"),
    },
    {
      email: "member13@example.com",
      fullName: "William Turner",
      phone: "(101) 202-0213",
      address: "1313 Thirteenth Place",
      city: "Houston",
      state: "TX",
      zipCode: "77001",
      marriedStatus: "WIDOWED",
      isBaptized: true,
      whenBaptized: new Date("2005-11-20"),
      createdAt: new Date("2012-01-10"), // Long-time member
      joinedAt: new Date("2012-03-15"),
    },
    {
      email: "member14@example.com",
      fullName: "Emma Watson",
      phone: "(101) 202-0214",
      address: "1414 Fourteenth Drive",
      city: "Orlando",
      state: "FL",
      zipCode: "32801",
      marriedStatus: "SINGLE",
      isBaptized: true,
      whenBaptized: new Date("2020-08-15"),
      createdAt: new Date("2020-07-20"),
      joinedAt: new Date("2020-09-20"),
    },
    {
      email: "member15@example.com",
      fullName: "Alexander Wright",
      phone: "(101) 202-0215",
      address: "1515 Fifteenth Circle",
      city: "Charlotte",
      state: "NC",
      zipCode: "28201",
      marriedStatus: "MARRIED",
      spouseGender: "FEMALE",
      isBaptized: true,
      whenBaptized: new Date("2017-05-30"),
      createdAt: new Date("2017-05-01"),
      joinedAt: new Date("2017-07-01"),
    },
  ]

  const allMembers = [...members, ...moreMembers]

  console.log("Seeding database...")

  // Create ADMIN users
  for (const admin of admins) {
    const existing = await prisma.user.findUnique({ where: { email: admin.email } })
    if (!existing) {
      await prisma.user.create({
        data: {
          ...admin,
          password: hashedPassword,
          role: "ADMIN",
        },
      })
      console.log(`Created ADMIN: ${admin.email}`)
    } else {
      console.log(`Skipped (exists): ${admin.email}`)
    }
  }

  // Create GUEST users
  for (const guest of guests) {
    const existing = await prisma.user.findUnique({ where: { email: guest.email } })
    if (!existing) {
      await prisma.user.create({
        data: {
          ...guest,
          password: hashedPassword,
          role: "GUEST",
        },
      })
      console.log(`Created GUEST: ${guest.email}`)
    } else {
      console.log(`Skipped (exists): ${guest.email}`)
    }
  }

  // Create MEMBER users
  for (const member of allMembers) {
    const existing = await prisma.user.findUnique({ where: { email: member.email } })
    if (!existing) {
      await prisma.user.create({
        data: {
          ...member,
          password: hashedPassword,
          role: "MEMBER",
        },
      })
      console.log(`Created MEMBER: ${member.email}`)
    } else {
      console.log(`Skipped (exists): ${member.email}`)
    }
  }

  // Create membership requests for some users
  console.log("Seeding membership requests...")

  // Get users to create requests for
  const guest1 = await prisma.user.findUnique({ where: { email: "guest1@example.com" } })
  const guest2 = await prisma.user.findUnique({ where: { email: "guest2@example.com" } })
  const guest3 = await prisma.user.findUnique({ where: { email: "guest3@example.com" } })
  const guest4 = await prisma.user.findUnique({ where: { email: "guest4@example.com" } })
  const guest5 = await prisma.user.findUnique({ where: { email: "guest5@example.com" } })
  const member1 = await prisma.user.findUnique({ where: { email: "member1@example.com" } })
  const member2 = await prisma.user.findUnique({ where: { email: "member2@example.com" } })

  const membershipRequests = [
    // SUBMITTED - pending review (new membership) - submitted 2 weeks ago
    {
      userId: guest1?.id,
      category: "MEMBERSHIP",
      requestType: "APPLY_NEW",
      title: "Apply for New Membership",
      status: "SUBMITTED",
      reason: "Got baptized recently",
      testimony: "I accepted Christ as my Savior last year and was baptized in June. I have been attending this church for 6 months and feel called to become a full member. The community here has been so welcoming and I want to commit to growing in faith together.",
      createdAt: new Date("2024-11-20"),
    },
    // SUBMITTED - pending review (transfer-in) - submitted 1 week ago
    {
      userId: guest2?.id,
      category: "MEMBERSHIP",
      requestType: "TRANSFER_IN",
      title: "Transfer-in Membership",
      status: "SUBMITTED",
      reason: "Transferred from other church",
      previousChurch: "First Baptist Church, Columbus OH",
      testimony: "My family and I moved to this area 3 months ago. We were active members at First Baptist Church for over 10 years. We are excited to join this community and continue serving the Lord here.",
      createdAt: new Date("2024-11-28"),
    },
    // APPROVED - new membership (matches member1 joinedAt: 2018-05-01)
    {
      userId: member1?.id,
      category: "MEMBERSHIP",
      requestType: "APPLY_NEW",
      title: "Apply for New Membership",
      status: "APPROVED",
      reason: "Got baptized recently",
      testimony: "I was baptized in April 2018 after a year of attending Bible study. This church has been instrumental in my spiritual growth and I am grateful to be part of this family.",
      createdAt: new Date("2018-04-15"), // Submitted 2 weeks before approval
      reviewedAt: new Date("2018-05-01"), // Same as joinedAt
      reviewNote: "Welcome to our church family! Your testimony is inspiring.",
    },
    // APPROVED - transfer-in membership (matches member2 joinedAt: 2019-09-15)
    {
      userId: member2?.id,
      category: "MEMBERSHIP",
      requestType: "TRANSFER_IN",
      title: "Transfer-in Membership",
      status: "APPROVED",
      reason: "Transferred from other church",
      previousChurch: "Grace Community Church, Tucson AZ",
      testimony: "After relocating for work, I searched for a church that teaches the Word faithfully. I found this church and immediately felt at home. I look forward to serving and growing here.",
      createdAt: new Date("2019-08-28"), // Submitted 2.5 weeks before approval
      reviewedAt: new Date("2019-09-15"), // Same as joinedAt
      reviewNote: "Transfer approved. We received confirmation from Grace Community Church.",
    },
    // DECLINED - new membership - submitted 2 months ago, declined 1 month ago
    {
      userId: guest3?.id,
      category: "MEMBERSHIP",
      requestType: "APPLY_NEW",
      title: "Apply for New Membership",
      status: "DECLINED",
      reason: "Got baptized recently",
      testimony: "I want to join the church.",
      createdAt: new Date("2024-10-01"),
      reviewedAt: new Date("2024-10-15"),
      reviewNote: "Thank you for your interest. We encourage you to attend our New Members class first and provide a more detailed testimony of your faith journey. Please reapply after completing the class.",
    },
    // INITIAL - draft (not yet submitted) - created 3 days ago
    {
      userId: guest4?.id,
      category: "MEMBERSHIP",
      requestType: "APPLY_NEW",
      title: "Apply for New Membership",
      status: "INITIAL",
      reason: "Got baptized recently",
      testimony: "I was baptized many years ago and have been...", // incomplete draft
      createdAt: new Date("2024-12-02"),
    },
    // SUBMITTED - transfer-in pending - submitted 5 days ago
    {
      userId: guest5?.id,
      category: "MEMBERSHIP",
      requestType: "TRANSFER_IN",
      title: "Transfer-in Membership",
      status: "SUBMITTED",
      reason: "Transferred from other church",
      previousChurch: "Hillside Chapel, Bellevue WA",
      testimony: "I have been a member of Hillside Chapel for 5 years where I served in the worship team and children's ministry. Due to a job change, I have relocated and am seeking to transfer my membership to continue serving the Lord.",
      createdAt: new Date("2024-12-01"),
    },
  ]

  for (const request of membershipRequests) {
    if (!request.userId) continue

    // Check if request already exists for this user with same type
    const existing = await prisma.userRequest.findFirst({
      where: {
        userId: request.userId,
        requestType: request.requestType,
      },
    })

    if (!existing) {
      await prisma.userRequest.create({ data: request as Parameters<typeof prisma.userRequest.create>[0]["data"] })
      console.log(`Created request: ${request.title} (${request.status}) for user ${request.userId}`)
    } else {
      console.log(`Skipped (exists): ${request.title} for user ${request.userId}`)
    }
  }

  console.log("Seeding completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

