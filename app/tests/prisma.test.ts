import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma, prismaExtended } from "@/lib/prisma";

describe("Prisma", () => {
    let createdUserId: string | null = null;
    let createdPostId: string | null = null;
    let walletAddress = '';

    beforeEach(async () => {
        const fix = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
        walletAddress = `0x${fix.padEnd(40, 'a').slice(0, 40)}`;

        const user = await prisma.user.create({
            data: {
                name: "Test User " + fix,
                email: "testuser" + fix + "@example.com",
                walletAddress,
            },
        })
        createdUserId = user.id;

        const post = await prisma.post.create({
            data: {
                endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                slug: "test-post-" + fix,
                type: 'giveaway',
                title: "Test Post " + fix,
                description: "This is a test post.",
                requirements: {
                    create: {
                        proofRequired: false,
                        minBadgeTier: 'Silver',
                        minReputation: 1,
                    },
                },
                comments: {
                    create: [
                        {
                            userId: user.id,
                            content: "This is a test comment.",
                        },
                        {
                            userId: user.id,
                            content: "This is another test comment.",
                        }
                    ],
                },
                user: {
                    connect: {
                        id: user.id,
                    },
                },
            },
        });
        createdPostId = post.id;
    });

    afterEach(async () => {
        if (createdPostId) {
            await prisma.post.deleteMany({ where: { id: createdPostId } });
            createdPostId = null;
        }

        if (createdUserId) {
            await prisma.user.deleteMany({ where: { id: createdUserId } });
            createdUserId = null;
        }
    });

    it("should count related posts and comments correctly", async () => {
        const user = await prismaExtended.user.withCount(['posts', 'comments']).findMany()

        expect(user[0].countPosts).toBe(1);
        expect(user[0].countComments).toBe(2);
    });

    it("should support findUnique", async () => {
        const user = await prismaExtended.user.withCount(['posts', 'comments']).findUnique({
            where: { id: createdUserId! },
        });

        expect(user?.countPosts).toBeDefined();
        expect(user?.countComments).toBeDefined();
        expect(user?.countPosts).toBe(1);
        expect(user?.countComments).toBe(2);
    });

    it("should support findUniqueOrThrow", async () => {
        const user = await prismaExtended.user.withCount(['posts', 'comments']).findUniqueOrThrow({
            where: { id: createdUserId! },
        });

        expect(user.countPosts).toBe(1);
        expect(user.countComments).toBe(2);
    });

    it("should support findFirstOrThrow", async () => {
        const user = await prismaExtended.user.withCount(['posts', 'comments']).findFirstOrThrow({
            where: { id: createdUserId! },
        });

        expect(user.countPosts).toBe(1);
        expect(user.countComments).toBe(2);
    });

})