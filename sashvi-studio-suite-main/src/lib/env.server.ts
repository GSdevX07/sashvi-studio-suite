import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
export const JWT_SECRET = process.env.JWT_SECRET;
