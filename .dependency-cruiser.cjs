module.exports = {
  forbidden: [
    {
      name: "prisma-only-in-server-db",
      comment: "Prisma access belongs exclusively to the database boundary.",
      from: { pathNot: "^src/server/db/" },
      to: { path: "^src/lib/prisma\\.ts$" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
  },
};
