import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
);

export interface JWTPayload {
  userId: string;
  walletAddress: string;
  username: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

export async function createToken(payload: {
  userId: string;
  walletAddress: string;
  username: string;
}): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    walletAddress: payload.walletAddress,
    username: payload.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    throw new Error("Invalid token");
  }
}
