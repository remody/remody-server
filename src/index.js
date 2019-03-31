import { GraphQLServer } from "graphql-yoga";

import Query from "./resolvers/Query";
import Mutation from "./resolvers/Mutation";
import Subscription from "./resolvers/Subscription";
import User from "./resolvers/User";
import prisma from "./prisma";

const server = new GraphQLServer({
	typeDefs: "./src/schema.graphql",
	resolvers: {
		Query,
		Mutation,
		Subscription,
		User
	},
	context({ request }) {
		return {
			prisma,
			request
		};
	}
});

server.start(() => {
	console.log("The server is up!");
});
