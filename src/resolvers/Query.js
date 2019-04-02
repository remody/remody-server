import jwt from "jsonwebtoken";
import { PythonShell } from "python-shell";

const Query = {
	users(parent, args, { prisma }, info) {
		const onArgs = {};
		if (args.query) {
			onArgs.where = {
				OR: [
					{ name_contains: args.query },
					{ email_contains: args.query }
				]
			};
		}
		return prisma.query.users(onArgs, info);
	},
	me(parent, args, { prisma, request }, info) {
		const header = request.headers.authorization;
		const token = header ? header.replace("Bearer ", "") : args.token;
		if (!token) {
			throw new Error("Authentication Needed");
		}
		const { userId } = jwt.decode(token, process.env["REMODY_SECRET"]);
		return prisma.query.user({ where: { id: userId } }, info);
	},
	files(parent, args, { prisma }, info) {
		const { userId } = jwt.decode(args.token, process.env["REMODY_SECRET"]);
		console.log(userId);
		return prisma.query.files(
			{
				where: {
					owner: {
						id: userId
					}
				}
			},
			info
		);
	},
	pythonExample(parent, args, { prisma }, info) {
		const options = {
			mode: "text",

			pythonPath: "",

			pythonOptions: ["-u"],

			scriptPath: `${__dirname}/../python`,

			args: ["value1", "value2", "value3"]
		};

		PythonShell.run("example.py", options, function(err, results) {
			if (err) throw err;

			console.log("results: %j", results);
		});

		return true;
	}
};

export { Query as default };
