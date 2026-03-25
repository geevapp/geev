import { prisma } from './prisma';

/**
 * Badge Award Rules Configuration
 * Defines the criteria for automatically awarding badges based on user activity
 */
interface BadgeRule {
  badgeId: string;
  checkFunction: (userId: string) => Promise<boolean>;
}

/**
 * Check if user has created their first giveaway
 */
async function checkFirstGiveaway(userId: string): Promise<boolean> {
  const giveawayCount = await prisma.post.count({
    where: {
      userId,
      type: 'giveaway',
    },
  });
  return giveawayCount === 1; // Awarded exactly when they create their first one
}

/**
 * Check if user has contributed to 10 help requests
 */
async function checkGenerousHeart(userId: string): Promise<boolean> {
  const contributionCount = await prisma.helpContribution.count({
    where: {
      userId,
    },
  });
  return contributionCount === 10; // Awarded exactly at 10 contributions
}

/**
 * Check if user has reached 100 followers
 */
async function checkCommunityBuilder(userId: string): Promise<boolean> {
  const followerCount = await prisma.follow.count({
    where: {
      followingId: userId,
    },
  });
  return followerCount === 100; // Awarded exactly at 100 followers
}

/**
 * Check if user has won their first giveaway
 */
async function checkFirstWin(userId: string): Promise<boolean> {
  const winCount = await prisma.postWinner.count({
    where: {
      userId,
    },
  });
  return winCount === 1; // Awarded exactly at first win
}

/**
 * Check if user has created 5 giveaways
 */
async function checkExperiencedGiver(userId: string): Promise<boolean> {
  const giveawayCount = await prisma.post.count({
    where: {
      userId,
      type: 'giveaway',
    },
  });
  return giveawayCount === 5; // Awarded at 5 giveaways created
}

/**
 * Check if user has made 25 contributions
 */
async function checkDedicatedHelper(userId: string): Promise<boolean> {
  const contributionCount = await prisma.helpContribution.count({
    where: {
      userId,
    },
  });
  return contributionCount === 25; // Awarded at 25 contributions
}

// Define all badge rules
const BADGE_RULES: BadgeRule[] = [
  {
    badgeId: 'first-giveaway',
    checkFunction: checkFirstGiveaway,
  },
  {
    badgeId: 'generous-heart',
    checkFunction: checkGenerousHeart,
  },
  {
    badgeId: 'community-builder',
    checkFunction: checkCommunityBuilder,
  },
  {
    badgeId: 'first-win',
    checkFunction: checkFirstWin,
  },
  {
    badgeId: 'experienced-giver',
    checkFunction: checkExperiencedGiver,
  },
  {
    badgeId: 'dedicated-helper',
    checkFunction: checkDedicatedHelper,
  },
];

/**
 * Check and award badges for a user based on their activity
 * This function evaluates all badge eligibility rules and creates UserBadge records
 * for any badges the user qualifies for but doesn't already have.
 * 
 * @param userId - The ID of the user to check and award badges for
 * @returns Promise<void>
 */
export async function checkAndAwardBadges(userId: string): Promise<void> {
  try {
    // Get all badges the user currently has
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });

    const ownedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));

    // Check each badge rule
    for (const rule of BADGE_RULES) {
      // Skip if user already has this badge
      if (ownedBadgeIds.has(rule.badgeId)) {
        continue;
      }

      // Check if user meets the criteria
      const shouldAward = await rule.checkFunction(userId);

      if (shouldAward) {
        // Verify the badge exists in the database before awarding
        const badgeExists = await prisma.badge.findUnique({
          where: { id: rule.badgeId },
        });

        if (badgeExists) {
          // Award the badge by creating a UserBadge record
          await prisma.userBadge.create({
            data: {
              userId,
              badgeId: rule.badgeId,
            },
          });

          console.log(`Badge "${rule.badgeId}" awarded to user ${userId}`);
        } else {
          console.warn(`Badge "${rule.badgeId}" does not exist in database`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking and awarding badges:', error);
    // Don't throw - badge awarding is best-effort and shouldn't break main operations
  }
}

/**
 * Force award a specific badge to a user (for manual/seed purposes)
 * 
 * @param userId - The ID of the user to award the badge to
 * @param badgeId - The ID of the badge to award
 * @returns Promise<boolean> - true if badge was awarded, false if already had it
 */
export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  try {
    // Check if user already has the badge
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        },
      },
    });

    if (existing) {
      return false; // User already has this badge
    }

    // Verify the badge exists
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      console.warn(`Cannot award badge "${badgeId}" - badge does not exist`);
      return false;
    }

    // Award the badge
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
      },
    });

    console.log(`Badge "${badgeId}" manually awarded to user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return false;
  }
}
