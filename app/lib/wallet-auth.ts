import { prisma } from "@/lib/prisma";
import { verifyChallenge } from "@/lib/sep10";

export type WalletAuthOptions = {
  walletAddress: string;
  transaction: string;
  username?: string | null;
  email?: string | null;
};

export type WalletAuthResult =
  | {
      success: true;
      user: {
        id: string;
        walletAddress: string;
        username: string | null;
        name: string;
        email: string | null;
        avatarUrl: string | null;
        bio: string | null;
        xp: number;
        walletBalance: number;
        createdAt: Date;
      };
    }
  | {
      success: false;
      status: number;
      error: string;
      message: string;
    };

export async function authenticateWalletWithChallenge(
  options: WalletAuthOptions,
): Promise<WalletAuthResult> {
  const { walletAddress, transaction, username, email } = options;
  const transactionHash = await getTransactionHash(transaction);

  const existingChallenge = await prisma.usedChallenge.findUnique({
    where: { transactionHash },
  });

  if (existingChallenge) {
    return {
      success: false,
      status: 403,
      error: "Replay attack detected",
      message: "This signature has already been used. Please request a new challenge.",
    };
  }

  const verificationResult = verifyChallenge(transaction, walletAddress);

  if (!verificationResult.valid) {
    return {
      success: false,
      status: 401,
      error: "Verification failed",
      message: verificationResult.error || "Invalid signature",
    };
  }

  await prisma.usedChallenge.create({
    data: {
      transactionHash,
      publicKey: walletAddress,
      usedAt: new Date(),
    },
  });

  let user = await prisma.user.findUnique({
    where: { walletAddress },
  });

  if (!user && username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return {
        success: false,
        status: 409,
        error: "Username already taken",
        message: "Choose a different username and try again.",
      };
    }

    user = await prisma.user.create({
      data: {
        walletAddress,
        name: username,
        username,
        email: email || null,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`,
        xp: 0,
        walletBalance: 0,
      },
    });
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        walletAddress,
        name: `User_${walletAddress.slice(0, 8)}`,
        username: `user_${walletAddress.slice(0, 8)}`,
        email: email || null,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`,
        xp: 0,
        walletBalance: 0,
      },
    });
  }

  return { success: true, user };
}

export async function getTransactionHash(signedXDR: string): Promise<string> {
  const { TransactionBuilder, Networks } = await import("@stellar/stellar-sdk");
  const transaction = TransactionBuilder.fromXDR(signedXDR, Networks.PUBLIC);
  return transaction.hash().toString("hex");
}
