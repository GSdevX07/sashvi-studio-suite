import * as jwt from "jsonwebtoken";

const secret: jwt.Secret = process.env.JWT_SECRET || "change-me-in-prod";
const accessExpiry = process.env.JWT_ACCESS_EXPIRES || "24h";
const adminAccessExpiry = process.env.JWT_ADMIN_ACCESS_EXPIRES || "7d";
const refreshExpiry = process.env.JWT_REFRESH_EXPIRES || "30d";

export function signAccess(payload: object) {
  return (jwt as any).sign(payload, secret as any, { expiresIn: accessExpiry } as any);
}

export function signAdminAccess(payload: object) {
  return (jwt as any).sign(payload, secret as any, { expiresIn: adminAccessExpiry } as any);
}

export function signRefresh(payload: object) {
  return (jwt as any).sign(payload, secret as any, { expiresIn: refreshExpiry } as any);
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
