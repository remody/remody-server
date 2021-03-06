import jwt from "jsonwebtoken";
import { PythonShell } from "python-shell";
import { query } from "../utils/mysql";
import { pythonShell } from "../utils/python";
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
	async mysqlConnection(parent, args, info) {
		try {
			const result = await query(`SELECT * FROM professor`);
			console.table(result);
		} catch (err) {
			throw new Error(err);
		}
		return true;
	},
	async elasticSearchConnection(parent, args, { elastic }, info) {
		try {
			const result = await elastic.search({
				index: "paper",
				body: {
					query: {
						bool: {
							must: [
								{
									query_string: {
										query: "논문"
									}
								}
							],
							must_not: [],
							should: []
						}
					},
					from: 0,
					size: 10,
					sort: [],
					aggs: {}
				}
			});
			console.log(result.body);
			console.log(result.body.hits.hits.map(item => item._source));
		} catch (err) {
			throw new Error(err);
		}

		return true;
	},
	async pythonExample(parent, args, ctx, info) {
		const result = await pythonShell("example.py");
		console.log(result);

		return true;
	},
	async UserSchemaInfo(parent, { schemaId }, { request, prisma }, info) {
		const header = request.headers.authorization;
		const token = header.replace("Bearer ", "");
		if (!header) {
			throw new Error("Authentication Needed");
		}
		const { userId: id } = jwt.decode(token, process.env["REMODY_SECRET"]);
		const rightUserCheck = await prisma.query.userSchema(
			{
				where: { id: schemaId }
			},
			"{ id name user { id } }"
		);
		if (!rightUserCheck) {
			throw new Error("No UserSchema found");
		}
		if (rightUserCheck.user.id !== id) {
			throw new Error("You can't get Schema Info");
		}

		try {
			const [fieldQuery, rows] = await Promise.all([
				query(`show full columns from ${id}_${rightUserCheck.name};`),
				query(`SELECT * FROM ${id}_${rightUserCheck.name};`)
			]);
			const fields = fieldQuery.map(item => item.Field);
			const [{ id: nextId }] =
				rows.length >= 1
					? await query(
							`SELECT id FROM ${id}_${
								rightUserCheck.name
							} ORDER BY id DESC LIMIT 1;`
					  )
					: [{ id: 0 }];

			return {
				fields,
				rows,
				nextId
			};
		} catch (err) {
			throw new Error("MySQL Error");
		}
	},
	async papers(
		parent,
		{ first, after, queryString },
		{ prisma, elastic },
		info
	) {
		const args = { first };
		if (after) {
			args.after = after;
		}
		if (queryString) {
			try {
				const result = await elastic.search({
					index: "paper",
					body: {
						query: {
							bool: {
								must: [
									{
										query_string: {
											query: queryString
										}
									}
								],
								must_not: [],
								should: []
							}
						},
						from: 0,
						size: 100,
						sort: [],
						aggs: {}
					}
				});
				const ids = result.body.hits.hits.map(item => item._id);
				return prisma.query.papers(
					{ first, where: { id_in: ids } },
					info
				);
			} catch (err) {
				throw new Error(err);
			}
		}
		return prisma.query.papers({ first }, info);
	}
};

export { Query as default };
