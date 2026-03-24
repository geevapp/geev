import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run Prisma seed');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ranks = [
  {
    id: 'newcomer',
    level: 1,
    title: 'Newcomer',
    color: 'text-gray-500',
    minPoints: 0,
    maxPoints: 199,
  },
  {
    id: 'helper',
    level: 2,
    title: 'Helper',
    color: 'text-green-500',
    minPoints: 200,
    maxPoints: 799,
  },
  {
    id: 'contributor',
    level: 3,
    title: 'Contributor',
    color: 'text-blue-500',
    minPoints: 800,
    maxPoints: 1999,
  },
  {
    id: 'champion',
    level: 4,
    title: 'Champion',
    color: 'text-orange-500',
    minPoints: 2000,
    maxPoints: 4999,
  },
  {
    id: 'legend',
    level: 5,
    title: 'Legend',
    color: 'text-yellow-500',
    minPoints: 5000,
    maxPoints: 999999,
  },
];

const badges = [
  {
    id: 'first-step',
    name: 'First Step',
    description: 'Completed your first activity',
    color: 'bg-blue-100 text-blue-800',
    tier: 'Bronze',
    iconUrl: 'https://api.dicebear.com/9.x/icons/svg?seed=first-step',
    criteria: { activities: 1 },
  },
  {
    id: 'generous-giver',
    name: 'Generous Giver',
    description: 'Completed five activities',
    color: 'bg-green-100 text-green-800',
    tier: 'Silver',
    iconUrl: 'https://api.dicebear.com/9.x/icons/svg?seed=generous-giver',
    criteria: { activities: 5 },
  },
  {
    id: 'community-hero',
    name: 'Community Hero',
    description: 'Completed ten activities',
    color: 'bg-yellow-100 text-yellow-800',
    tier: 'Gold',
    iconUrl: 'https://api.dicebear.com/9.x/icons/svg?seed=community-hero',
    criteria: { activities: 10 },
  },
];

const users = [
  {
    walletAddress: '9FakeSolanaWallet11111111111111111111111111111',
    name: 'Alex Chen',
    username: 'alex',
    email: 'alex@example.com',
    bio: 'Crypto enthusiast and community builder.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=AlexChen',
    xp: 2500,
  },
  {
    walletAddress: '9FakeSolanaWallet22222222222222222222222222222',
    name: 'Sarah Johnson',
    username: 'sarah',
    email: 'sarah@example.com',
    bio: 'Designer and open source contributor.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SarahJohnson',
    xp: 890,
  },
  {
    walletAddress: '9FakeSolanaWallet33333333333333333333333333333',
    name: 'Marcus Williams',
    username: 'marcus',
    email: 'marcus@example.com',
    bio: 'Founder building community tools.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=MarcusWilliams',
    xp: 5200,
  },
  {
    walletAddress: '9FakeSolanaWallet44444444444444444444444444444',
    name: 'Nina Patel',
    username: 'nina',
    email: 'nina@example.com',
    bio: 'Frontend engineer and mentor.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=NinaPatel',
    xp: 1450,
  },
  {
    walletAddress: '9FakeSolanaWallet55555555555555555555555555555',
    name: 'Jordan Kim',
    username: 'jordan',
    email: 'jordan@example.com',
    bio: 'Product-minded full stack developer.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=JordanKim',
    xp: 320,
  },
];

function rankIdForXp (xp: number): string {
  if (xp >= 5000) return 'legend';
  if (xp >= 2000) return 'champion';
  if (xp >= 800) return 'contributor';
  if (xp >= 200) return 'helper';
  return 'newcomer';
}

async function main () {
  console.log('Seeding auth-related data...');

  for (const rank of ranks) {
    await prisma.rank.upsert({
      where: { id: rank.id },
      update: rank,
      create: rank,
    });
  }
  console.log(`Upserted ${ranks.length} ranks`);

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { id: badge.id },
      update: badge,
      create: badge,
    });
  }
  console.log(`Upserted ${badges.length} badges`);

  const createdUsers = [];
  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { walletAddress: user.walletAddress },
      update: {
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        xp: user.xp,
        rankId: rankIdForXp(user.xp),
      },
      create: {
        ...user,
        rankId: rankIdForXp(user.xp),
      },
    });
    createdUsers.push(created);
  }
  console.log(`Upserted ${createdUsers.length} users`);

  await prisma.userBadge.createMany({
    data: [
      { userId: createdUsers[0].id, badgeId: 'community-hero' },
      { userId: createdUsers[1].id, badgeId: 'generous-giver' },
      { userId: createdUsers[2].id, badgeId: 'community-hero' },
      { userId: createdUsers[3].id, badgeId: 'first-step' },
      { userId: createdUsers[4].id, badgeId: 'first-step' },
    ],
    skipDuplicates: true,
  });
  console.log('Assigned default badges');

  console.log('Database seeding completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });