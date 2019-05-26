import { GraphQLServer } from "graphql-yoga";
import express from "express";
import Query from "./resolvers/Query";
import Mutation from "./resolvers/Mutation";
import Subscription from "./resolvers/Subscription";
import User from "./resolvers/User";
import prisma from "./prisma";
import elastic from "./elastic";

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
			elastic,
			request
		};
	}
});

server.express.use("/uploads", express.static("uploads"));

server.start(() => {
	console.log("The server is up!");
});
