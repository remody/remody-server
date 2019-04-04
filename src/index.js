import { GraphQLServer } from "graphql-yoga";
import mysql from "mysql";
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
		const pool = mysql.createPool({
			host: process.env.RDS_HOSTNAME,
			user: process.env.RDS_USERNAME,
			password: process.env.RDS_PASSWORD,
			port: process.env.RDS_PORT,
			database: process.env.RDS_MAINDB
		});
		return {
			prisma,
			request,
			mysql: pool
		};
	}
});

server.start(() => {
	console.log("The server is up!");
});
