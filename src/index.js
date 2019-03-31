import { GraphQLServer } from "graphql-yoga";
import { PythonShell } from "python-shell";

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
console.log(__dirname);
const options = {
	mode: "text",

	pythonPath: "",

	pythonOptions: ["-u"],

	scriptPath: `${__dirname}/python`,

	args: ["value1", "value2", "value3"]
};

PythonShell.run("example.py", options, function(err, results) {
	if (err) throw err;

	console.log("results: %j", results);
});
