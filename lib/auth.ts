// Auth utilities for database integration
// Replace this with actual Prisma client when database is set up
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

const MOCK_MODE = {
    loggedIn: true,           // change to false → simulates not logged in
    hasWallet: true,
    isAdmin: false,           // you can add admin flag later if needed
};

const getCurrentUser = async (request: NextRequest) => {
    if (MOCK_MODE.loggedIn) {
        const mockWalletFromHeader = request.headers.get('x-mock-wallet');
        
        // Try to find user in database first
        try {
            if (mockWalletFromHeader) {
                const dbUser = await prisma.user.findUnique({
                    where: { walletAddress: mockWalletFromHeader }
                });
                
                if (dbUser) {
                    return {
                        id: dbUser.id,
                        walletAddress: dbUser.walletAddress,
                        name: dbUser.name,
                        bio: dbUser.bio,
                        avatarUrl: dbUser.avatarUrl,
                        xp: dbUser.xp,
                        createdAt: dbUser.createdAt,
                        updatedAt: dbUser.updatedAt,
                    };
                }
            }
        } catch (error) {
            console.log('Database not available, using mock user');
        }
        
        // Fallback to mock user
        const MOCK_USER = {
            id: 'usr_1',
            walletAddress: mockWalletFromHeader || '9FakeSolanaWallet11111111111111111111111111111',
            name: 'Test User (Mock)',
            bio: 'This is a dummy user for local/dev testing',
            avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=TestUser',
            xp: 420,
            createdAt: new Date('2025-10-01'),
            updatedAt: new Date(),
        };
        
        return MOCK_USER;
    }
    return null;
};

export { getCurrentUser };