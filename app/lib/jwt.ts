import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production";
const key = new TextEncoder().encode(secretKey);

export interface UserJwtPayload {
  jti: string;
  iat: number;
  exp: number;
  userId: string;
  walletAddress: string;
  username: string;
}

/**
 * Create a new JWT token
 */
export async function createToken(payload: {
  userId: string;
  walletAddress: string;
  username: string;
}): Promise<string> {
  const token = await new SignJWT({
    ...payload,
    jti: Math.random().toString(36).substring(2, 15),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<UserJwtPayload> {
  try {
    const verified = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    
    // Type assertion with validation
    const payload: any = verified.payload;
    
    if (!payload.userId || !payload.walletAddress || !payload.username) {
      throw new Error("Invalid token payload");
    }
    
    return {
      jti: payload.jti,
      iat: payload.iat,
      exp: payload.exp,
      userId: payload.userId,
      walletAddress: payload.walletAddress,
      username: payload.username,
    };
  } catch (error) {
    throw new Error("Invalid token");
  }
}

/**
 * Get token from request cookies
 */
export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split("=");
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies["auth-token"] || null;
}