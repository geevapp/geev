import NextAuth from "next-auth";
import { NextRequest } from 'next/server';
import { authConfig } from "./auth-config";
import { prisma } from './prisma';

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

const getCurrentUser = async (_request: NextRequest) => {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            walletAddress: true,
            name: true,
            bio: true,
            avatarUrl: true,
            xp: true,
            walletBalance: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return dbUser;
};

export { getCurrentUser };