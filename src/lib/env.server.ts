import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sashvistudio.com";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sashviadmin6000";
export const JWT_SECRET = process.env.JWT_SECRET;
