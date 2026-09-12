import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("Password123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "jamesatagher@gmail.com" },
    update: {},
    create: {
      id: "scitech-admin",
      email: "jamesatagher@gmail.com",
      name: "James Atagher",
      password: hashedPassword,
      description: "Founder & Lead Developer of SciTech Community",
      location: "San Francisco, CA",
      verified: true,
      firstLogin: true,
    },
  });

  console.log("Created admin user:", admin.email);

  // Create sample communities
  const community1 = await prisma.community.upsert({
    where: { id: "comm-ai-robotics" },
    update: {},
    create: {
      id: "comm-ai-robotics",
      name: "AI & Autonomous Systems",
      category: "tech",
      price: "free",
      type: "public",
      description:
        "A collaborative space for artificial intelligence, machine learning, neural networks, and robotics enthusiasts.",
      createdBy: admin.id,
      members: {
        create: [{ userId: admin.id }],
      },
    },
  });

  const community2 = await prisma.community.upsert({
    where: { id: "comm-biotech-genomics" },
    update: {},
    create: {
      id: "comm-biotech-genomics",
      name: "Biotech & Computational Biology",
      category: "science",
      price: "free",
      type: "public",
      description:
        "Advancing computational genomics, protein folding, bioinformatics, and precision medicine.",
      createdBy: admin.id,
      members: {
        create: [{ userId: admin.id }],
      },
    },
  });

  // Create a welcome post in community 1
  await prisma.post.upsert({
    where: { id: "post-welcome" },
    update: {},
    create: {
      id: "post-welcome",
      title: "Welcome to SciTech Community! 🚀",
      content:
        "Welcome everyone! This platform is built for researchers, developers, and creators to share discoveries, exchange ideas, and collaborate on cutting-edge technologies. Feel free to explore, join communities, and start discussions!",
      post: "Welcome everyone! This platform is built for researchers, developers, and creators to share discoveries, exchange ideas, and collaborate on cutting-edge technologies.",
      communityId: community1.id,
      userId: admin.id,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
