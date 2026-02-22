import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

// Test connection
export async function testConnection () {
  try {
    await prisma.$connect();
    console.log('Prisma connected to database');
    return true;
  } catch (error) {
    console.error('Prisma connection failed:', error);
    return false;
  }
}
