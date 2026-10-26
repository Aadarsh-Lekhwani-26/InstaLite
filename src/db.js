require("dotenv/config");

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const pgAdapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const dbClient = new PrismaClient({ adapter: pgAdapter });

module.exports = dbClient;
