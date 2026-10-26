require("dotenv/config");

const { defineConfig, env } = require("prisma/config");

const prismaConfig = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

module.exports = prismaConfig;
