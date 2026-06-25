import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'change-me-in-prod';
const accessExpiry = process.env.JWT_ACCESS_EXPIRES || '15m';
const refreshExpiry = process.env.JWT_REFRESH_EXPIRES || '7d';

export function signAccess(payload: object) {
  return jwt.sign(payload, secret, { expiresIn: accessExpiry });
}

export function signRefresh(payload: object) {
  return jwt.sign(payload, secret, { expiresIn: refreshExpiry });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, secret);
  } catch (e) {
    return null;
  }
}
