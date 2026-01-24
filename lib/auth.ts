// Mock auth for development
// Replace this with actual Prisma client when database is set up
import { NextRequest } from 'next/server';

const MOCK_USER = {
    id: 'usr_1',
    walletAddress: '9FakeSolanaWallet11111111111111111111111111111',
    name: 'Test User (Mock)',
    bio: 'This is a dummy user for local/dev testing',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=TestUser',
    xp: 420,
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date(),
};

const MOCK_MODE = {
    loggedIn: true,           // change to false → simulates not logged in
    hasWallet: true,
    isAdmin: false,           // you can add admin flag later if needed
};

const getCurrentUser = async (request: NextRequest) => {
    if (MOCK_MODE.loggedIn) {
        const mockWalletFromHeader = request.headers.get('x-mock-wallet');
        const user = {
            ...MOCK_USER,
            walletAddress: mockWalletFromHeader || MOCK_USER.walletAddress,
        };
        return user;
    }
    return null;
}

export { getCurrentUser }