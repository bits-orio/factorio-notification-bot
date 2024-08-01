import dotenv from 'dotenv';

dotenv.config();

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
export const CLIENT_ID = process.env.CLIENT_ID!;
export const FACTORIO_USERNAME = process.env.FACTORIO_USERNAME!;
export const FACTORIO_PASSWORD = process.env.FACTORIO_PASSWORD!;
export const FACTORIO_TOKEN = process.env.FACTORIO_TOKEN!;
export const CHECK_INTERVAL = 10000; // 10 seconds
export const RETRY_DELAY = 5000; // 5 seconds
export const SUBSCRIPTIONS_FILE = 'subscriptions.json';
