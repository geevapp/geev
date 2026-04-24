import { prisma } from '@/lib/prisma';

export async function checkAndAwardBadges(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            posts: { where: { type: 'giveaway' } },
            helpContributions: true,
            followers: true,
          }
        },
        badges: true,
      }
    });

    if (!user) return;

    const currentBadgeIds = new Set(user.badges.map(b => b.badgeId));
    const newlyAwarded: string[] = [];

    // Rule: First Giveaway
    if (user._count.posts >= 1 && !currentBadgeIds.has('first-giveaway')) {
      newlyAwarded.push('first-giveaway');
    }

    // Rule: Generous Heart
    if (user._count.helpContributions >= 10 && !currentBadgeIds.has('generous-heart')) {
      newlyAwarded.push('generous-heart');
    }

    // Rule: Community Builder
    if (user._count.followers >= 100 && !currentBadgeIds.has('community-builder')) {
      newlyAwarded.push('community-builder');
    }

    // Other generic badge checks (e.g. from seed.ts)
    const activitiesCount = await prisma.activity.count({ where: { userId } });
    if (activitiesCount >= 1 && !currentBadgeIds.has('first-step')) newlyAwarded.push('first-step');
    if (activitiesCount >= 5 && !currentBadgeIds.has('generous-giver')) newlyAwarded.push('generous-giver');
    if (activitiesCount >= 10 && !currentBadgeIds.has('community-hero')) newlyAwarded.push('community-hero');

    for (const badgeId of newlyAwarded) {
      // Ensure the badge exists in the DB, create on the fly if it's one of the new examples
      const badgeExists = await prisma.badge.findUnique({ where: { id: badgeId } });
      
      if (!badgeExists) {
        let name = badgeId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        let color = 'bg-blue-100 text-blue-800';
        let tier = 'Bronze';
        let iconUrl = `https://api.dicebear.com/9.x/icons/svg?seed=${badgeId}`;
        
        if (badgeId === 'first-giveaway') {
           color = 'bg-purple-100 text-purple-800';
        } else if (badgeId === 'generous-heart') {
           color = 'bg-pink-100 text-pink-800';
           tier = 'Silver';
        } else if (badgeId === 'community-builder') {
           color = 'bg-green-100 text-green-800';
           tier = 'Gold';
        }

        await prisma.badge.create({
          data: {
            id: badgeId,
            name,
            description: `Awarded for earning the ${name} achievement`,
            color,
            tier,
            iconUrl,
          }
        });
      }

      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId } },
        update: {},
        create: {
          userId,
          badgeId,
        }
      });
      
      // Optionally create a notification here
      await prisma.notification.create({
        data: {
          userId,
          type: 'badge_awarded',
          message: `You earned a new badge: ${badgeId.replace('-', ' ')}!`,
          link: `/profile/${userId}`,
        }
      });
    }
  } catch (error) {
    console.error('Error checking and awarding badges:', error);
  }
}
