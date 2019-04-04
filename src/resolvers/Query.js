import jwt from "jsonwebtoken";
import { PythonShell } from "python-shell";
import { query } from "../utils/mysql";
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
	userSchemas(parent, args, { prisma, request }, info) {
		const header = request.headers.authorization;
		const token = header.replace("Bearer ", "");
		if (!token) {
			throw new Error("Authentication Needed");
		}
		const { userId } = jwt.decode(token, process.env["REMODY_SECRET"]);

		return prisma.query.userSchemas(
			{
				where: {
					user: {
						id: userId
					}
				}
			},
			info
		);
	},
	async mysqlConnection(parent, args, { mysql }, info) {
		try {
			const result = await query(mysql, `SELECT * FROM professor`);
			console.table(result);
		} catch (err) {
			throw new Error(err);
		}
		return true;
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
