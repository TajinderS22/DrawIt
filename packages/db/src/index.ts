import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import pg from "pg"

declare global {
  var prisma: PrismaClient | undefined;
}

let _client: PrismaClient | undefined;

export function getPrisma () :PrismaClient {
    if (_client) return _client;

    const connectionString = `${process.env.DATABASE_URL}`;



    const pool = new pg.Pool({connectionString})
    const adapter = new PrismaPg({ connectionString });


    _client = new PrismaClient({ adapter });
    return _client;

}
export { getPrisma as prisma };
