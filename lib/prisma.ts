import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

// Test connection
export async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Prisma connected to database');
    return true;
  } catch (error) {
    console.error('Prisma connection failed:', error);
    return false;
  }
}
