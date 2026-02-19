import { PrismaClient, PostType, PostStatus, SelectionMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample badges
  const badges = await prisma.badge.createMany({
    data: [
      {
        id: 'helper',
        name: 'Helper',
        description: 'Awarded for making your first contribution',
        tier: 'bronze',
        iconUrl: '🥉',
        criteria: JSON.stringify({ entries: 1 }),
      },
      {
        id: 'contributor',
        name: 'Contributor',
        description: 'Awarded for making 5 contributions',
        tier: 'silver',
        iconUrl: '🥈',
        criteria: JSON.stringify({ entries: 5 }),
      },
      {
        id: 'community-pillar',
        name: 'Community Pillar',
        description: 'Awarded for making 10 contributions',
        tier: 'gold',
        iconUrl: '🥇',
        criteria: JSON.stringify({ entries: 10 }),
      },
      {
        id: 'legend',
        name: 'Legend',
        description: 'Awarded for making 25 contributions',
        tier: 'platinum',
        iconUrl: '💎',
        criteria: JSON.stringify({ entries: 25 }),
      },
      {
        id: 'icon',
        name: 'Icon',
        description: 'Awarded for making 50 contributions',
        tier: 'diamond',
        iconUrl: '👑',
        criteria: JSON.stringify({ entries: 50 }),
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Created ${badges.count} badges`);

  // Create sample users
  const users = [
    {
      walletAddress: '9FakeSolanaWallet11111111111111111111111111111',
      name: 'Alex Chen',
      bio: 'Crypto enthusiast and community builder. Love helping others succeed! 🚀',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=AlexChen',
      xp: 2500,
    },
    {
      walletAddress: '9FakeSolanaWallet22222222222222222222222222222',
      name: 'Sarah Johnson',
      bio: 'Artist and designer. Creating beautiful things and spreading positivity ✨',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SarahJohnson',
      xp: 890,
    },
    {
      walletAddress: '9FakeSolanaWallet33333333333333333333333333333',
      name: 'Marcus Williams',
      bio: 'Tech entrepreneur. Building the future one project at a time 💻',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=MarcusWilliams',
      xp: 5200,
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { walletAddress: userData.walletAddress },
      update: {},
      create: userData,
    });
    createdUsers.push(user);
  }

  console.log(`Created/updated ${createdUsers.length} users`);

  // Create sample posts
  const posts = [
    {
      creatorId: createdUsers[0].id,
      type: PostType.giveaway,
      title: '🎁 $500 USDC Giveaway for New Developers!',
      description: 'Celebrating our community growth! I\'m giving away $500 USDC to help new developers get started. Share your coding journey and what you\'re building!',
      category: 'technology',
      status: PostStatus.open,
      selectionMethod: SelectionMethod.random,
      winnerCount: 1,
      media: JSON.stringify([{ type: 'image', url: '/crypto-giveaway-banner.png' }]),
      endsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    },
    {
      creatorId: createdUsers[1].id,
      type: PostType.giveaway,
      title: '🎨 Design Tutorial Video + Free Resources',
      description: 'Just dropped my latest design tutorial! Learn advanced Figma techniques and get access to my premium design system. Giving away 5 copies of my complete UI kit to lucky winners!',
      category: 'design',
      status: PostStatus.open,
      selectionMethod: SelectionMethod.random,
      winnerCount: 5,
      media: JSON.stringify([{ type: 'video', url: '/design-tutorial-thumbnail.png' }]),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  ];

  const createdPosts = [];
  for (const postData of posts) {
    const post = await prisma.post.create({
      data: postData,
    });
    createdPosts.push(post);
  }

  console.log(`Created ${createdPosts.length} posts`);

  // Create sample entries
  const entries = [
    {
      postId: createdPosts[0].id,
      userId: createdUsers[1].id,
      content: 'Started coding 2 years ago with Python! Currently building a web app for local businesses.',
      proofUrl: 'https://github.com/sarahj/local-business-app',
      isWinner: false,
    },
    {
      postId: createdPosts[0].id,
      userId: createdUsers[2].id,
      content: 'Been coding for 3 years, started with game development! Now working on streaming tools.',
      proofUrl: 'https://github.com/marcusw/stream-tools',
      isWinner: true,
    },
  ];

  const createdEntries = [];
  for (const entryData of entries) {
    const entry = await prisma.entry.create({
      data: entryData,
    });
    createdEntries.push(entry);
  }

  console.log(`Created ${createdEntries.length} entries`);

  // Assign some badges to users
  await prisma.userBadge.createMany({
    data: [
      {
        userId: createdUsers[0].id,
        badgeId: 'legend',
        awardedAt: new Date(),
      },
      {
        userId: createdUsers[1].id,
        badgeId: 'contributor',
        awardedAt: new Date(),
      },
      {
        userId: createdUsers[2].id,
        badgeId: 'icon',
        awardedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });