import { Prisma } from "prisma-binding";

const prisma = new Prisma({
	typeDefs: "src/generated/prisma.graphql",
	endpoint: "https://us1.prisma.sh/kyungminlee-5dfb92/remody-server/dev"
});

export { prisma as default };
