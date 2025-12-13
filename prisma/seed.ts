import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("1234Abc!", 12)

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
      gender: "MALE",
      dateOfBirth: new Date("1965-03-15"), // 59 years old
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
      gender: "FEMALE",
      dateOfBirth: new Date("1970-08-22"), // 54 years old
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

  // 10 GUEST accounts - createdAt within last 5 years, no joinedAt
  const guests = [
    {
      email: "guest1@example.com",
      fullName: "Alice Johnson",
      phone: "(101) 202-0101",
      address: "123 Oak Street",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      gender: "FEMALE",
      dateOfBirth: new Date("1998-05-12"), // 26 years old - young adult
      marriedStatus: "SINGLE",
      isBaptized: false,
      createdAt: new Date("2024-06-15"),
    },
    {
      email: "guest2@example.com",
      fullName: "Bob Williams",
      phone: "(101) 202-0102",
      address: "456 Maple Avenue",
      city: "Columbus",
      state: "OH",
      zipCode: "43215",
      gender: "MALE",
      dateOfBirth: new Date("1985-11-03"), // 39 years old
      marriedStatus: "MARRIED",
      spouseGender: "FEMALE",
      isBaptized: true,
      whenBaptized: new Date("2020-06-15"),
      createdAt: new Date("2024-09-01"),
    },
    {
      email: "guest3@example.com",
      fullName: "Carol Davis",
      phone: "(101) 202-0103",
      address: "789 Pine Road",
      city: "Austin",
      state: "TX",
      zipCode: "73301",
      gender: "FEMALE",
      dateOfBirth: new Date("1975-02-28"), // 49 years old
      marriedStatus: "DIVORCED",
      isBaptized: false,
      createdAt: new Date("2023-03-20"),
    },
    {
      email: "guest4@example.com",
      fullName: "Daniel Brown",
      phone: "(101) 202-0104",
      address: "321 Elm Lane",
      city: "Denver",
      state: "CO",
      zipCode: "80202",
      gender: "MALE",
      dateOfBirth: new Date("1958-07-19"), // 66 years old - senior
      marriedStatus: "WIDOWED",
      isBaptized: true,
      whenBaptized: new Date("2015-03-22"),
      createdAt: new Date("2024-11-25"),
    },
    {
      email: "guest5@example.com",
      fullName: "Emily Martinez",
      phone: "(101) 202-0105",
      address: "654 Cedar Court",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      gender: "FEMALE",
      dateOfBirth: new Date("2000-09-14"), // 24 years old - young adult
      marriedStatus: "SINGLE",
      isBaptized: false,
      createdAt: new Date("2024-11-20"),
    },
    {
      email: "guest6@example.com",
      fullName: "Rachel Green",
      phone: "(101) 202-0106",
      address: "789 Central Park West",
      city: "New York",
      state: "NY",
      zipCode: "10024",
      gender: "FEMALE",
      dateOfBirth: new Date("1992-04-05"), // 32 years old
      marriedStatus: "SINGLE",
      isBaptized: true,
      whenBaptized: new Date("2023-01-15"),
      createdAt: new Date("2021-08-10"),
    },
    {
      email: "guest7@example.com",
      fullName: "Michael Scott",
      phone: "(101) 202-0107",
      address: "1725 Slough Avenue",
      city: "Scranton",
      state: "PA",
      zipCode: "18503",
      gender: "MALE",
      dateOfBirth: new Date("1962-03-15"), // 62 years old - senior
      marriedStatus: "DIVORCED",
      isBaptized: false,
      createdAt: new Date("2022-05-15"),
    },
    {
      email: "guest8@example.com",
      fullName: "Tommy Chen",
      phone: "(101) 202-0108",
      address: "555 Youth Drive",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      gender: "MALE",
      dateOfBirth: new Date("2010-08-22"), // 14 years old - teenager
      marriedStatus: "SINGLE",
      isBaptized: false,
      createdAt: new Date("2024-10-01"),
    },
    {
      email: "guest9@example.com",
      fullName: "Sarah Kim",
      phone: "(101) 202-0109",
      address: "666 Teen Lane",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      gender: "FEMALE",
      dateOfBirth: new Date("2008-12-10"), // 16 years old - teenager
      marriedStatus: "SINGLE",
      isBaptized: true,
      whenBaptized: new Date("2024-06-15"),
      createdAt: new Date("2024-08-15"),
    },
    {
      email: "guest10@example.com",
      fullName: "James Wilson Jr",
      phone: "(101) 202-0110",
      address: "777 Youth Street",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      gender: "MALE",
      dateOfBirth: new Date("2012-01-30"), // 12 years old - teenager
      marriedStatus: "SINGLE",
      isBaptized: false,
      createdAt: new Date("2024-09-20"),
    },
  ]

  // 15 MEMBER accounts - createdAt <= joinedAt, joinedAt = membership approval date
  const members = [
    {
      email: "member1@example.com",
      fullName: "Frank Thompson",
      phone: "(101) 202-0201",
      address: "111 First Street",
      city: "Portland",
      state: "OR",
      zipCode: "97201",
      gender: "MALE",
      dateOfBirth: new Date("1980-06-15"), // 44 years old
      marriedStatus: "MARRIED",
      spouseGender: "FEMALE",
      isBaptized: true,
      whenBaptized: new Date("2018-04-10"),
      createdAt: new Date("2018-03-15"),
      joinedAt: new Date("2018-05-01"),
    },
    {
      email: "member2@example.com",
      fullName: "Grace Lee",
      phone: "(101) 202-0202",
      address: "222 Second Avenue",
      city: "Phoenix",
      state: "AZ",
      zipCode: "85001",
      gender: "FEMALE",
      dateOfBirth: new Date("1995-03-22"), // 29 years old - young adult
      marriedStatus: "SINGLE",
      isBaptized: true,
      whenBaptized: new Date("2019-08-25"),
      createdAt: new Date("2019-08-01"),
      joinedAt: new Date("2019-09-15"),
    },
    {
      email: "member3@example.com",
      fullName: "Henry Wilson",
      phone: "(101) 202-0203",
      address: "333 Third Boulevard",
      city: "Nashville",
      state: "TN",
      zipCode: "37201",
      gender: "MALE",
      dateOfBirth: new Date("1978-11-08"), // 46 years old
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
      gender: "FEMALE",
      dateOfBirth: new Date("1968-09-30"), // 56 years old - senior
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
      gender: "MALE",
      dateOfBirth: new Date("1982-04-12"), // 42 years old
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
      gender: "FEMALE",
      dateOfBirth: new Date("1997-07-25"), // 27 years old - young adult
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
      gender: "MALE",
      dateOfBirth: new Date("1955-12-03"), // 69 years old - senior
      marriedStatus: "WIDOWED",
      isBaptized: true,
      whenBaptized: new Date("2010-05-20"),
      createdAt: new Date("2010-04-01"),
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
      gender: "FEMALE",
      dateOfBirth: new Date("1988-02-14"), // 36 years old
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
      gender: "MALE",
      dateOfBirth: new Date("1999-01-15"), // 25 years old - young adult
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
      gender: "FEMALE",
      dateOfBirth: new Date("1990-08-05"), // 34 years old
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
      gender: "MALE",
      dateOfBirth: new Date("1996-05-28"), // 28 years old - young adult
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
      gender: "FEMALE",
      dateOfBirth: new Date("1985-07-12"), // 39 years old
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
      gender: "MALE",
      dateOfBirth: new Date("1950-11-20"), // 74 years old - senior
      marriedStatus: "WIDOWED",
      isBaptized: true,
      whenBaptized: new Date("2005-11-20"),
      createdAt: new Date("2012-01-10"),
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
      gender: "FEMALE",
      dateOfBirth: new Date("1994-04-15"), // 30 years old - young adult
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
      gender: "MALE",
      dateOfBirth: new Date("1975-05-30"), // 49 years old
      marriedStatus: "MARRIED",
      spouseGender: "FEMALE",
      isBaptized: true,
      whenBaptized: new Date("2017-05-30"),
      createdAt: new Date("2017-05-01"),
      joinedAt: new Date("2017-07-01"),
    },
    // Additional members for different groups
    {
      email: "member16@example.com",
      fullName: "Robert Senior",
      phone: "(101) 202-0216",
      address: "1616 Elder Lane",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      gender: "MALE",
      dateOfBirth: new Date("1960-03-10"), // 64 years old - senior
      marriedStatus: "MARRIED",
      spouseGender: "FEMALE",
      isBaptized: true,
      whenBaptized: new Date("1985-06-15"),
      createdAt: new Date("2015-01-15"),
      joinedAt: new Date("2015-03-01"),
    },
    {
      email: "member17@example.com",
      fullName: "Margaret Elder",
      phone: "(101) 202-0217",
      address: "1717 Wisdom Way",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      gender: "FEMALE",
      dateOfBirth: new Date("1958-07-22"), // 66 years old - senior
      marriedStatus: "MARRIED",
      spouseGender: "MALE",
      isBaptized: true,
      whenBaptized: new Date("1980-04-20"),
      createdAt: new Date("2014-06-10"),
      joinedAt: new Date("2014-08-15"),
    },
    {
      email: "member18@example.com",
      fullName: "David Young",
      phone: "(101) 202-0218",
      address: "1818 Youth Avenue",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      gender: "MALE",
      dateOfBirth: new Date("2002-09-05"), // 22 years old - young adult
      marriedStatus: "SINGLE",
      isBaptized: true,
      whenBaptized: new Date("2020-12-20"),
      createdAt: new Date("2021-01-05"),
      joinedAt: new Date("2021-03-15"),
    },
    {
      email: "member19@example.com",
      fullName: "Jessica Young",
      phone: "(101) 202-0219",
      address: "1919 Campus Drive",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      gender: "FEMALE",
      dateOfBirth: new Date("2001-11-18"), // 23 years old - young adult
      marriedStatus: "SINGLE",
      isBaptized: true,
      whenBaptized: new Date("2019-08-10"),
      createdAt: new Date("2020-02-20"),
      joinedAt: new Date("2020-04-01"),
    },
    {
      email: "member20@example.com",
      fullName: "Thomas Teen",
      phone: "(101) 202-0220",
      address: "2020 High School Road",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      gender: "MALE",
      dateOfBirth: new Date("2009-05-12"), // 15 years old - teenager
      marriedStatus: "SINGLE",
      isBaptized: true,
      whenBaptized: new Date("2024-01-15"),
      createdAt: new Date("2023-09-01"),
      joinedAt: new Date("2024-02-01"),
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

  // Seed Fellowship Groups with different visibility levels
  console.log("Seeding fellowship groups...")

  const admin1 = await prisma.user.findUnique({ where: { email: "admin1@example.com" } })
  const member3 = await prisma.user.findUnique({ where: { email: "member3@example.com" } })
  const member4 = await prisma.user.findUnique({ where: { email: "member4@example.com" } })
  const member5 = await prisma.user.findUnique({ where: { email: "member5@example.com" } })
  const member16 = await prisma.user.findUnique({ where: { email: "member16@example.com" } })
  const member17 = await prisma.user.findUnique({ where: { email: "member17@example.com" } })

  if (admin1 && member3 && member4 && member5) {
    const groupsData = [
      // Community Outreach Team - no restrictions
      {
        name: "Community Outreach Team",
        description: "Dedicated to serving our local community through various outreach programs including food drives, homeless ministry, blood drives, and neighborhood clean-ups. Open to everyone who wants to make a difference!",
        visibility: "PUBLIC",
        scheduleType: "ADHOC",
        scheduleDetails: "Meets as needed for outreach events",
        maxMembers: 20,  // Max is 20
        createdById: member5.id,
      },
      // Young Adults Fellowship - age 18-30
      {
        name: "Young Adults Fellowship",
        description: "A vibrant community for young adults (18-30) to grow in faith together. We meet weekly for Bible study, worship, and fellowship. Our group focuses on navigating life's challenges with a Christ-centered perspective.",
        visibility: "PUBLIC",
        scheduleType: "RECURRING",
        scheduleDetails: "Every Friday 7:00 PM",
        maxMembers: 15,
        minAge: 18,
        maxAge: 30,
        createdById: member3.id,
      },
      // Women's Bible Study - Female only
      {
        name: "Women's Bible Study",
        description: "A nurturing environment for women to dive deep into Scripture together. We explore various books of the Bible and discuss how to apply God's truth to our daily lives as wives, mothers, professionals, and servants of Christ.",
        visibility: "PUBLIC",
        scheduleType: "RECURRING",
        scheduleDetails: "Every Wednesday 10:00 AM",
        maxMembers: 12,
        gender: "FEMALE",
        createdById: member4.id,
      },
      // Men's Prayer Breakfast - Male only
      {
        name: "Men's Prayer Breakfast",
        description: "A weekly gathering for men to share breakfast, pray together, and study God's Word. We focus on building strong Christian men who lead their families and communities with integrity.",
        visibility: "INTERNAL",
        scheduleType: "RECURRING",
        scheduleDetails: "Every Saturday 7:00 AM",
        maxMembers: 15,
        gender: "MALE",
        createdById: admin1.id,
      },
      // Teenage Group - age 10-17
      {
        name: "Youth Group",
        description: "A fun and engaging group for teenagers to learn about faith, build friendships, and grow together. We have games, worship, and Bible studies designed just for teens!",
        visibility: "PUBLIC",
        scheduleType: "RECURRING",
        scheduleDetails: "Every Sunday 6:00 PM",
        maxMembers: 20,
        minAge: 10,
        maxAge: 17,
        createdById: admin1.id,
      },
      // Senior Fellowship - age 55+
      {
        name: "Senior Fellowship",
        description: "A warm community for our seasoned saints to share wisdom, pray together, and enjoy fellowship. We celebrate life experiences and support one another through all seasons.",
        visibility: "PUBLIC",
        scheduleType: "RECURRING",
        scheduleDetails: "Every Thursday 10:00 AM",
        maxMembers: 15,
        minAge: 55,
        createdById: member16?.id || admin1.id,
      },
      // Senior Men's Fellowship - Male, age 55+
      {
        name: "Senior Men's Fellowship",
        description: "A brotherhood for men 55 and older to share life experiences, pray together, and encourage one another. We focus on mentoring younger generations and leaving a godly legacy.",
        visibility: "INTERNAL",
        scheduleType: "RECURRING",
        scheduleDetails: "Every Tuesday 9:00 AM",
        maxMembers: 10,
        gender: "MALE",
        minAge: 55,
        createdById: member16?.id || admin1.id,
      },
      // Senior Women's Fellowship - Female, age 55+
      {
        name: "Senior Women's Fellowship",
        description: "A sisterhood for women 55 and older to share wisdom, support each other, and grow in faith together. We embrace our role as Titus 2 women mentoring the next generation.",
        visibility: "INTERNAL",
        scheduleType: "RECURRING",
        scheduleDetails: "Every Tuesday 2:00 PM",
        maxMembers: 10,
        gender: "FEMALE",
        minAge: 55,
        createdById: member17?.id || member4.id,
      },
      // Married Couples Fellowship - married only
      {
        name: "Married Couples Fellowship",
        description: "A supportive community for married couples to strengthen their marriages through biblical principles. We share meals, study together, and build lasting friendships with other couples.",
        visibility: "PUBLIC",
        scheduleType: "RECURRING",
        scheduleDetails: "Second Saturday of each month 6:00 PM",
        maxMembers: 15,
        marriedOnly: true,
        createdById: member3.id,
      },
      // Leadership Team - private
      {
        name: "Leadership Team",
        description: "Private group for church leadership to coordinate ministry activities, discuss strategic planning, and pray for the congregation.",
        visibility: "PRIVATE",
        scheduleType: "RECURRING",
        scheduleDetails: "First Monday of each month 6:00 PM",
        maxMembers: 8,
        createdById: admin1.id,
      },
    ]

    // Get all members with their details for proper group assignment
    const allMemberUsers = await prisma.user.findMany({
      where: { role: "MEMBER" },
    })

    // Helper function to calculate age
    const calculateAge = (dob: Date | null): number => {
      if (!dob) return 0
      const today = new Date()
      let age = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--
      }
      return age
    }

    // Helper function to check if a member matches group requirements
    const memberMatchesGroup = (member: typeof allMemberUsers[0], groupData: typeof groupsData[0]): boolean => {
      // Gender check
      if (groupData.gender && groupData.gender !== "ALL" && member.gender !== groupData.gender) {
        return false
      }
      // Age check
      const age = calculateAge(member.dateOfBirth)
      if (groupData.minAge && age < groupData.minAge) return false
      if (groupData.maxAge && age > groupData.maxAge) return false
      // Married check
      if (groupData.marriedOnly && member.marriedStatus !== "MARRIED") return false
      return true
    }

    for (const groupData of groupsData) {
      const existingGroup = await prisma.fellowshipGroup.findFirst({
        where: { name: groupData.name },
      })

      if (!existingGroup) {
        const group = await prisma.fellowshipGroup.create({
          data: groupData,
        })

        // Add creator as leader (leaders don't need to match age/gender requirements)
        await prisma.fellowshipMembership.create({
          data: {
            userId: groupData.createdById,
            groupId: group.id,
            role: "LEADER",
          },
        })

        console.log(`Created group: ${group.name} (${group.visibility})`)

        // Find eligible members based on group restrictions (excluding the creator)
        const eligibleMembers = allMemberUsers.filter(m =>
          m.id !== groupData.createdById && memberMatchesGroup(m, groupData)
        )

        // Add up to 3 eligible members to each group
        for (const memberToAdd of eligibleMembers.slice(0, 3)) {
          const existingMembership = await prisma.fellowshipMembership.findFirst({
            where: { userId: memberToAdd.id, groupId: group.id },
          })
          if (!existingMembership) {
            await prisma.fellowshipMembership.create({
              data: {
                userId: memberToAdd.id,
                groupId: group.id,
                role: "MEMBER",
              },
            })
            console.log(`  Added member ${memberToAdd.fullName} to ${group.name}`)
          }
        }

        // Add sample events to each group
        const now = new Date()
        let events = []

        // Special events for Community Outreach Team
        if (group.name === "Community Outreach Team") {
          events = [
            { groupId: group.id, title: "Monthly Food Package Distribution", description: "Prepare and distribute food packages to families in need", eventTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), eventType: "OFFLINE", location: "Church Parking Lot", status: "PLANNED" },
            { groupId: group.id, title: "Community Food Delivery", description: "Deliver meals to homebound seniors", eventTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), eventType: "OFFLINE", location: "Church Kitchen", status: "PLANNED" },
            { groupId: group.id, title: "Blood Drive", description: "Partner with Red Cross for community blood drive", eventTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), eventType: "OFFLINE", location: "Fellowship Hall", status: "PLANNED" },
            { groupId: group.id, title: "Annual Open House", description: "Welcome the community to tour our facilities", eventTime: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), eventType: "OFFLINE", location: "Entire Campus", status: "PLANNED" },
            { groupId: group.id, title: "Thanksgiving Free Lunch", description: "Serve free Thanksgiving meals to the community", eventTime: new Date("2024-11-28"), eventType: "OFFLINE", location: "Fellowship Hall", status: "COMPLETED" },
            { groupId: group.id, title: "Christmas Party", description: "Annual community Christmas celebration with gifts for children", eventTime: new Date("2024-12-21"), eventType: "OFFLINE", location: "Church Auditorium", status: "COMPLETED" },
            { groupId: group.id, title: "Neighborhood Cleanup", description: "Spring cleaning of local parks and streets", eventTime: new Date("2024-04-20"), eventType: "OFFLINE", location: "Community Park", status: "COMPLETED" },
            { groupId: group.id, title: "Back to School Supply Drive", description: "Distribute school supplies to underprivileged children", eventTime: new Date("2024-08-15"), eventType: "OFFLINE", location: "Church Lobby", status: "COMPLETED" },
          ]
        } else {
          events = [
            { groupId: group.id, title: `${group.name} - Weekly Meeting`, description: "Our regular weekly gathering", eventTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), eventType: "OFFLINE", location: "Main Fellowship Hall", status: "PLANNED" },
            { groupId: group.id, title: `${group.name} - Special Event`, description: "A special gathering for our group", eventTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), eventType: "OFFLINE", location: "Church Auditorium", status: "COMPLETED" },
            { groupId: group.id, title: `${group.name} - Online Prayer`, description: "Virtual prayer meeting via Zoom", eventTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), eventType: "ONLINE", location: "Zoom Meeting", status: "IN_PROGRESS" },
          ]
        }

        for (const eventData of events) {
          await prisma.groupEvent.create({ data: eventData })
        }
        console.log(`  Added ${events.length} events to ${group.name}`)
      } else {
        console.log(`Skipped (exists): ${groupData.name}`)
      }
    }
  }

  // Seed Testimonies
  console.log("Seeding testimonies...")

  const allUsers = await prisma.user.findMany()
  const adminUsers = allUsers.filter(u => u.role === "ADMIN")
  const memberUsers = allUsers.filter(u => u.role === "MEMBER")

  // Get specific users for testimonies
  const testimonyAdmin = adminUsers[0] // For reviewedBy

  // Published testimonies (12 total)
  const publishedTestimonies = [
    { title: "Found Peace in Christ", description: "After years of searching for meaning, I finally found peace when I accepted Jesus into my life. This church community has been instrumental in my spiritual growth.", userId: memberUsers[0]?.id },
    { title: "Healed from Addiction", description: "I was struggling with addiction for 10 years. Through prayer, counseling, and the support of this amazing church family, God delivered me completely. I've been sober for 3 years now.", userId: memberUsers[1]?.id },
    { title: "Marriage Restored", description: "My marriage was on the brink of divorce. Through the couples fellowship and pastoral guidance, God restored our relationship. We're now stronger than ever.", userId: memberUsers[2]?.id },
    { title: "From Doubt to Faith", description: "I came to this church as a skeptic, just accompanying my wife. The genuine love I experienced and the powerful teaching transformed my heart. Now I serve in the worship team.", userId: memberUsers[3]?.id },
    { title: "God's Provision in Job Loss", description: "When I lost my job, I was devastated. But God used that season to draw me closer to Him. The church supported my family, and I found an even better job within months.", userId: memberUsers[4]?.id },
    { title: "Healing from Grief", description: "After losing my mother, I was consumed by grief. The compassion of this community helped me process my pain and find hope in Christ's promise of eternal life.", userId: memberUsers[5]?.id },
    { title: "Delivered from Fear", description: "Anxiety controlled my life for years. Through consistent prayer and the faith of believers around me, God has given me a peace that surpasses understanding.", userId: memberUsers[6]?.id },
    { title: "Finding Purpose", description: "I spent decades chasing success but felt empty. At 55, I discovered my true purpose in serving others through the senior fellowship. Life has never been more fulfilling.", userId: memberUsers[7]?.id },
    { title: "Youth Transformed", description: "As a teenager, I was heading down the wrong path. The youth group leaders invested in me and showed me a better way. Now I mentor other young people.", userId: memberUsers[8]?.id },
    { title: "Miraculous Healing", description: "Doctors gave me 6 months to live. The church rallied in prayer, and today I'm cancer-free. God is still in the miracle business!", userId: memberUsers[9]?.id },
    { title: "Restored Relationship with Father", description: "I hadn't spoken to my father in 15 years. God worked in both our hearts through separate churches, and we reconciled last Easter. Family is precious.", userId: memberUsers[10]?.id },
    { title: "From Homeless to Hopeful", description: "I was living on the streets when someone from this church brought me a meal and told me about Jesus. They helped me get back on my feet. Now I volunteer at the shelter.", userId: memberUsers[11]?.id },
  ]

  for (const testimony of publishedTestimonies) {
    if (!testimony.userId) continue
    const existing = await prisma.testimony.findFirst({
      where: { userId: testimony.userId, title: testimony.title }
    })
    if (!existing) {
      await prisma.testimony.create({
        data: {
          ...testimony,
          status: "PUBLISHED",
          reviewedBy: testimonyAdmin?.id,
          reviewedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date in last 90 days
        }
      })
      console.log(`Created PUBLISHED testimony: ${testimony.title}`)
    }
  }

  // Pending approval testimonies (4 total)
  const pendingTestimonies = [
    { title: "New Beginning", description: "I just started my faith journey last month. The welcome I received here was overwhelming. Looking forward to growing with this family.", userId: memberUsers[12]?.id },
    { title: "God's Faithfulness", description: "Through every season of life, God has been faithful. I want to share how He carried me through the loss of my business and helped me start again.", userId: memberUsers[13]?.id },
    { title: "Answered Prayer", description: "We prayed for a child for 7 years. Last month, we received news that our adoption is finalized. God answers prayers in His perfect timing.", userId: memberUsers[14]?.id },
    { title: "Breaking Generational Cycles", description: "I come from a family with no faith background. Christ broke the cycle of brokenness in my family. My children will know the Lord.", userId: memberUsers[15]?.id },
  ]

  for (const testimony of pendingTestimonies) {
    if (!testimony.userId) continue
    const existing = await prisma.testimony.findFirst({
      where: { userId: testimony.userId, title: testimony.title }
    })
    if (!existing) {
      await prisma.testimony.create({
        data: { ...testimony, status: "PENDING_APPROVAL" }
      })
      console.log(`Created PENDING_APPROVAL testimony: ${testimony.title}`)
    }
  }

  // Draft testimonies (4 total)
  const draftTestimonies = [
    { title: "My Story", description: "Working on sharing my testimony...", userId: memberUsers[16]?.id },
    { title: "God is Good", description: "I want to share how God has been working in my life recently.", userId: memberUsers[17]?.id },
    { title: "Journey to Faith", description: "Still writing my story of how I came to know Christ.", userId: adminUsers[0]?.id },
    { title: "Grateful Heart", description: "So many things to be thankful for...", userId: adminUsers[1]?.id },
  ]

  for (const testimony of draftTestimonies) {
    if (!testimony.userId) continue
    const existing = await prisma.testimony.findFirst({
      where: { userId: testimony.userId, title: testimony.title }
    })
    if (!existing) {
      await prisma.testimony.create({
        data: { ...testimony, status: "DRAFT" }
      })
      console.log(`Created DRAFT testimony: ${testimony.title}`)
    }
  }

  // Rejected testimonies (3 total)
  const rejectedTestimonies = [
    { title: "Quick Note", description: "God is good.", userId: memberUsers[0]?.id, adminComment: "Please provide more detail about your experience. We'd love to hear your full story!" },
    { title: "Test", description: "Testing the system.", userId: memberUsers[1]?.id, adminComment: "This appears to be a test submission. Please submit your actual testimony when ready." },
    { title: "My Faith", description: "I believe in God.", userId: memberUsers[2]?.id, adminComment: "Thank you for your faith! Could you share more about your personal journey and how God has worked in your life?" },
  ]

  for (const testimony of rejectedTestimonies) {
    if (!testimony.userId) continue
    const existing = await prisma.testimony.findFirst({
      where: { userId: testimony.userId, title: testimony.title }
    })
    if (!existing) {
      await prisma.testimony.create({
        data: {
          title: testimony.title,
          description: testimony.description,
          userId: testimony.userId,
          status: "REJECTED",
          reviewedBy: testimonyAdmin?.id,
          reviewedAt: new Date(),
          adminComment: testimony.adminComment,
        }
      })
      console.log(`Created REJECTED testimony: ${testimony.title}`)
    }
  }

  // Cancelled testimonies (3 total)
  const cancelledTestimonies = [
    { title: "Changed My Mind", description: "I was going to share but decided to wait.", userId: memberUsers[3]?.id },
    { title: "Not Ready Yet", description: "Still processing my journey.", userId: memberUsers[4]?.id },
    { title: "Will Resubmit Later", description: "Need to think about this more.", userId: memberUsers[5]?.id },
  ]

  for (const testimony of cancelledTestimonies) {
    if (!testimony.userId) continue
    const existing = await prisma.testimony.findFirst({
      where: { userId: testimony.userId, title: testimony.title }
    })
    if (!existing) {
      await prisma.testimony.create({
        data: { ...testimony, status: "CANCELLED" }
      })
      console.log(`Created CANCELLED testimony: ${testimony.title}`)
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

