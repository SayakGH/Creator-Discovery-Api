import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

const platforms = ['youtube', 'instagram', 'tiktok'];
const niches = [
  'fitness',
  'tech',
  'lifestyle',
  'beauty',
  'gaming',
  'food',
  'travel',
  'finance',
];
const countries = ['IN', 'US', 'UK', 'BR', 'ID', 'NG', 'PH'];

const creatorNames = [
  'Alex Rivera',
  'Priya Sharma',
  'Jake Thompson',
  'Amelia Chen',
  'Carlos Mendez',
  'Sofia Okonkwo',
  'Liam Nguyen',
  'Isabella Santos',
  'Ethan Kim',
  'Mia Patel',
  'Noah Johnson',
  'Emma Williams',
  'Olivia Brown',
  'Ava Davis',
  'Lucas Garcia',
  'Charlotte Miller',
  'Mason Wilson',
  'Sophia Moore',
  'James Taylor',
  'Amelia Anderson',
  'Oliver Thomas',
  'Harper Jackson',
  'Benjamin White',
  'Evelyn Harris',
  'Elijah Martin',
  'Abigail Thompson',
  'Logan Garcia',
  'Emily Martinez',
  'Alexander Robinson',
  'Elizabeth Clark',
  'Ryan Rodriguez',
  'Scarlett Lewis',
  'Daniel Lee',
  'Victoria Walker',
  'Matthew Hall',
  'Madison Allen',
  'David Young',
  'Luna Hernandez',
  'Joseph King',
  'Grace Wright',
  'Samuel Scott',
  'Chloe Torres',
  'Henry Green',
  'Zoey Adams',
  'Owen Baker',
  'Nora Nelson',
  'Sebastian Carter',
  'Riley Mitchell',
  'Jack Perez',
  'Layla Roberts',
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateBio(name: string, niche: string, platform: string): string {
  const bios = [
    `${name} is a passionate ${niche} creator on ${platform} with an engaged community.`,
    `Helping people navigate ${niche} one post at a time. Follow ${name} on ${platform}.`,
    `${name} shares authentic ${niche} content and connects deeply with their ${platform} audience.`,
    `Award-winning ${niche} influencer on ${platform}. Partnered with top brands worldwide.`,
    `${name} turns everyday ${niche} moments into viral ${platform} content.`,
  ];
  return rand(bios);
}

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.shortlist.deleteMany();
  await prisma.creator.deleteMany();
  await prisma.brand.deleteMany();

  // Seed 200 creators
  const creators: Prisma.CreatorCreateManyInput[] = [];
  for (let i = 0; i < 200; i++) {
    const name = creatorNames[i % creatorNames.length] + (i >= 50 ? ` ${Math.floor(i / 50)}` : '');
    const platform = rand(platforms);
    const niche = rand(niches);
    creators.push({
      name,
      platform,
      niche,
      bio: generateBio(name, niche, platform),
      followerCount: randInt(5000, 5000000),
      engagementRate: randFloat(1, 12),
      audienceCountry: rand(countries),
      sampleContent: `https://example.com/${platform}/${name.toLowerCase().replace(/\s+/g, '-')}-${i}`,
    });
  }

  await prisma.creator.createMany({ data: creators });
  console.log(`Created ${creators.length} creators`);

  // Seed 2 brand accounts (password: "password123")
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.brand.createMany({
    data: [
      { email: 'brand@example.com', password: hashedPassword },
      { email: 'acme@example.com', password: hashedPassword },
    ],
  });
  console.log('Created 2 brand accounts (password: password123)');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
