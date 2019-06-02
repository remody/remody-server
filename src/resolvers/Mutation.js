import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs, { createWriteStream } from "fs";
import mkdirp from "mkdirp";
import shortid from "shortid";
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import { query } from "../utils/mysql";
import { pythonShell } from "../utils/python";

const uploadDir = `uploads`;

mkdirp.sync(uploadDir);

const storeUpload = async ({ stream, filename, userId }) => {
	const id = shortid.generate();
	const userPath = `${uploadDir}/${userId}`;
	mkdirp.sync(userPath);
	const path = `${userPath}/${id}-${filename}`;

	return new Promise((resolve, reject) =>
		stream
			.pipe(createWriteStream(path))
			.on("finish", () => resolve({ id, path }))
			.on("error", reject)
	);
};

const processUpload = async (upload, userId) => {
	const { stream, filename, mimetype, encoding } = await upload;
	const { id, path } = await storeUpload({ stream, filename, userId });
	return { id, filename, mimetype, encoding, path };
};

const Mutation = {
	async createUser(parent, args, { prisma }, info) {
		const emailTaken = await prisma.exists.User({ email: args.data.email });

		if (args.data.password.length < 8) {
			throw new Error("Password must be 8 characters or longer.");
		}

		if (emailTaken) {
			throw new Error("Email Already taken!");
		}

		const password = await bcrypt.hash(args.data.password, 10);

		const createdUser = await prisma.mutation.createUser({
			data: {
				...args.data,
				password
			}
		});

		return {
			user: createdUser,
			token: jwt.sign(
				{ userId: createdUser.id },
				process.env["REMODY_SECRET"]
			)
		};
	},
	async login(parent, args, { prisma }, info) {
		const loginUser = await prisma.query.user({
			where: {
				email: args.data.email
			}
		});

		if (!loginUser) {
			throw new Error("Unable to login");
		}

		const isMatch = await bcrypt.compare(
			args.data.password,
			loginUser.password
		);

		if (!isMatch) {
			throw new Error("Invalid Password");
		}

		return {
			user: loginUser,
			token: jwt.sign(
				{ userId: loginUser.id },
				process.env["REMODY_SECRET"]
			)
		};
	},
	async deleteUser(parent, args, { prisma, request }, info) {
		const header = request.headers.authorization;
		if (!header) {
			throw new Error("Authentication Needed");
		}
		const token = header.replace("Bearer ", "");
		const { userId } = jwt.decode(token, process.env["REMODY_SECRET"]);
		const idExist = await prisma.exists.User({ id: userId });
		if (!idExist) {
			throw new Error("User doesn't exists");
		}

		await prisma.mutation.deleteUser({ where: { id: userId } });

		return true;
	},
	async updateUser(parent, args, { prisma, request }, info) {
		const header = request.headers.authorization;
		if (!header) {
			throw new Error("Authentication Needed");
		}
		const token = header.replace("Bearer ", "");
		const { userId } = jwt.decode(token, process.env["REMODY_SECRET"]);
		const idExist = await prisma.exists.User({ id: userId });

		if (!idExist) {
			throw new Error("User doesn't exists");
		}

		const updatedUser = await prisma.mutation.updateUser(
			{
				where: { id: userId },
				data: args.data
			},
			info
		);

		return updatedUser;
	},
	async singleUpload(parent, { file, schemaId }, { prisma, request }, info) {
		console.log("singleUpload");
		const header = request.headers.authorization;
		if (!header) {
			throw new Error("Authentication Needed");
		}
		const token = header.replace("Bearer ", "");
		const { userId } = jwt.decode(token, process.env["REMODY_SECRET"]);

		const { path } = await processUpload(file, userId);

		let columns = await prisma.mutation.updateUserSchema(
			{ data: { created: true }, where: { id: schemaId } },
			"{ name rowCount columns { name } }"
		);

		const keywords = columns.columns.map(item => item.name);
		console.log(keywords);
		const uploadPath = "/home/ubuntu/app/remody-server" + "/" + path;
		const preprocResult = await pythonShell("preproc.py", [uploadPath]);
		console.log(preprocResult);
		const [compareResult] = await pythonShell("remody_compare.py", [
			preprocResult[0],
			...keywords
		]);
		console.log(compareResult);

		if (compareResult === "NO") {
			throw new Error("일치하는 키워드가 없습니다.");
		}

		const bulkData = fs.readFileSync(compareResult);
		fs.unlinkSync(compareResult);
		const json = JSON.parse(bulkData.toString());
		console.log(json);

		let attrs = [];
		let values = [];
		Object.entries(json).map(([attr, value]) => {
			attrs = [...attrs, attr];
			values = [...values, value];
		});
		const attstring = attrs.reduce((acc, string, index) => {
			if (index === attrs.length - 1) {
				return `${acc}${string}`;
			}
			return `${acc}${string},`;
		}, "");
		const valuestring = values.reduce((acc, string, index) => {
			if (index === values.length - 1) {
				return `${acc}"${string}"`;
			}
			return `${acc}"${string}",`;
		}, "");
		await query(
			`INSERT INTO ${userId}_${
				columns.name
			} (${attstring}) VALUES (${valuestring}); `
		);

		await prisma.mutation.updateUserSchema({
			data: { created: false, rowCount: columns.rowCount + 1 },
			where: { id: schemaId }
		});
		return true;
	},
	async multipleUpload(parent, { files }, { prisma }, info) {
		Promise.all(files.map(processUpload));
	},
	async createAuthAccessCode(parent, args, { prisma }, info) {
		const forgotUser = await prisma.exists.User({
			email: args.email
		});

		if (!forgotUser) {
			throw new Error("No User this email");
		}

		const data = await prisma.mutation.createAuthAccessCode(
			{
				data: {
					user: {
						connect: {
							email: args.email
						}
					}
				}
			},
			"{ id user { email } }"
		);

		const transporter = nodemailer.createTransport(
			smtpTransport({
				service: "gmail",
				host: "smtp.gmail.com",
				auth: {
					user: process.env["REMODY_EMAIL_USER"],
					pass: process.env["REMODY_EMAIL_PASSWORD"]
				}
			})
		);

		const mailOptions = {
			from: `Remody <${process.env["REMODY_EMAIL_USER"]}>`,
			to: data.user.email,
			subject: "Change Your Password",
			text: `Your code is "${data.id}"`
		};

		transporter.sendMail(mailOptions, function(error, info) {
			if (error) {
				throw new Error("Can't Send Email");
			} else {
				console.log("Email sent: " + info.response);
			}
		});

		return true;
	},
	async changeUserPassword(parent, args, { prisma }, info) {
		const AuthAccessCode = await prisma.exists.AuthAccessCode({
			id: args.data.accessCode,
			user: {
				email: args.data.email
			}
		});

		if (!AuthAccessCode) {
			throw new Error("No Match AccessCode");
		}

		const [_, password] = await Promise.all([
			prisma.mutation.deleteAuthAccessCode({
				where: {
					id: args.data.accessCode
				}
			}),
			bcrypt.hash(args.data.password, 10)
		]);

		return prisma.mutation.updateUser(
			{
				where: {
					email: args.data.email
				},
				data: {
					password
				}
			},
			info
		);
	},
	async createTable(parent, { data }, { request, prisma }, info) {
		const header = request.headers.authorization;
		const token = header.replace("Bearer ", "");
		if (!header) {
			throw new Error("Authentication Needed");
		}
		const { userId: id } = jwt.decode(token, process.env["REMODY_SECRET"]);
		if (data.rows.length < 1) {
			throw new Error("Rows Must be at least one");
		}

		const queryString = data.rows.reduce(
			(acc, { name, type, length }) =>
				acc + `${name} ${type}(${length ? length : 30}),\n`,
			""
		);
		try {
			await query(
				`CREATE TABLE ${id}_${data.name} (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					${queryString}PRIMARY KEY (id)
				);`
			);
		} catch (error) {
			throw new Error("MYSQL ERROR\n" + error);
		}
		try {
			return prisma.mutation.createUserSchema(
				{
					data: {
						name: data.name,
						user: {
							connect: {
								id
							}
						},
						rowCount: 0,
						columns: {
							create: data.rows
						}
					}
				},
				info
			);
		} catch (err) {
			throw new Error("Prisma Error\n" + err);
		}
	},
	async UpdateUserSchemaInfo(
		parent,
		{
			data: { schemaId, updateRows, deleteRows, createRows }
		},
		{ request, prisma },
		info
	) {
		const header = request.headers.authorization;
		const token = header.replace("Bearer ", "");
		if (!header) {
			throw new Error("Authentication Needed");
		}
		const { userId } = jwt.decode(token, process.env["REMODY_SECRET"]);
		const getSchema = await prisma.query.userSchema(
			{
				where: { id: schemaId }
			},
			"{ id name user { id } }"
		);
		if (!getSchema) {
			throw new Error("No UserSchema found");
		}
		if (getSchema.user.id !== userId) {
			throw new Error("You can't get Schema Info");
		}
		try {
			await Promise.all(
				createRows
					.map(id => {
						return `INSERT INTO ${userId}_${
							getSchema.name
						} (id) VALUES (${id}); `;
					})
					.map(queryString => query(queryString))
			);
		} catch (err) {
			throw new Error(`MySQL error:Input error\n${err}`);
		}
		try {
			await Promise.all(
				updateRows
					.map(item => {
						let Query = "";
						const { id, ...queryObject } = item;
						Object.entries(queryObject).map(([field, value]) => {
							Query += `${field}='${value}',`;
						});
						return `UPDATE ${userId}_${
							getSchema.name
						} SET ${Query.substr(
							0,
							Query.length - 1
						)} WHERE id=${id}; `;
					})
					.map(queryString => query(queryString))
			);
		} catch (err) {
			throw new Error(`MySQL error:Update error\n${err}`);
		}
		try {
			await Promise.all(
				deleteRows
					.map(id => {
						return `DELETE FROM ${userId}_${
							getSchema.name
						} WHERE id=${id}; `;
					})
					.map(queryString => query(queryString))
			);
		} catch (err) {
			throw new Error(`MySQL error:Delete error\n${err}`);
		}
		try {
			const [fieldQuery, rows, [firstItem]] = await Promise.all([
				query(`show full columns from ${userId}_${getSchema.name};`),
				query(`SELECT * FROM ${userId}_${getSchema.name};`),
				query(
					`SELECT id FROM ${userId}_${
						getSchema.name
					} ORDER BY id DESC LIMIT 1;`
				)
			]);
			const fields = fieldQuery.map(item => item.Field);
			let nextId = 1;
			if (firstItem) {
				nextId = firstItem.id;
			}
			prisma.mutation.updateUserSchema({
				data: {
					rowCount: rows.length
				},
				where: { id: schemaId }
			});
			return {
				fields,
				rows,
				nextId
			};
		} catch (err) {
			throw new Error(`MySQL error:Select error\n${err}`);
		}
	},
	async uploadForSearch(
		parent,
		{
			data: { title, author, belong, publishedyear, file }
		},
		{ prisma, request, elastic },
		info
	) {
		const header = request.headers.authorization;
		if (!header) {
			throw new Error("Authentication Needed");
		}
		const token = header.replace("Bearer ", "");
		const { userId } = jwt.decode(token, process.env["REMODY_SECRET"]);
		const { path } = await processUpload(file, userId);
		const copyPath = path.substr(0, path.indexOf(".pdf")) + "_copyed.pdf";
		fs.copyFileSync(path, copyPath);

		const uploadPath = "/home/ubuntu/app/remody-server" + "/" + copyPath;
		const pythonResult = await pythonShell("elastic.py", [
			uploadPath,
			title,
			author,
			belong,
			publishedyear
		]);

		if (pythonResult[0] === "NO") {
			throw new Error("File size is so big");
		}
		const jsonPath = pythonResult[0];
		let PaperId;
		try {
			const result = await prisma.mutation.createPaper(
				{
					data: {
						title,
						author,
						belong,
						publishedyear,
						url: path,
						owner: { connect: { id: userId } }
					}
				},
				"{ id }"
			);
			PaperId = result.id;
		} catch (err) {
			throw new Error(`PrismaError:\n${err}`);
		}

		const bulkData = fs.readFileSync(jsonPath);
		fs.unlinkSync(jsonPath);
		const json = JSON.parse(bulkData.toString());
		try {
			await elastic.create({
				index: "paper",
				type: "metadata",
				id: PaperId,
				body: json
			});
		} catch (err) {
			throw new Error(err);
		}

		return true;
	},
	async deleteUserSchema(
		parent,
		{ id: schemaId },
		{ prisma, request },
		info
	) {
		const header = request.headers.authorization;
		const token = header.replace("Bearer ", "");
		if (!header) {
			throw new Error("Authentication Needed");
		}
		const { userId } = jwt.decode(token, process.env["REMODY_SECRET"]);
		const getSchema = await prisma.query.userSchema(
			{
				where: { id: schemaId }
			},
			"{ id name user { id } }"
		);
		if (!getSchema) {
			throw new Error("No UserSchema found");
		}
		if (getSchema.user.id !== userId) {
			throw new Error("You can't get Schema Info");
		}
		await query(`DROP TABLE ${userId}_${getSchema.name};`);
		await prisma.mutation.deleteUserSchema({ where: { id: schemaId } });
		return true;
	},
	async deletePaper(
		parent,
		{ id: paperId },
		{ prisma, request, elastic },
		info
	) {
		const header = request.headers.authorization;
		const token = header.replace("Bearer ", "");
		if (!header) {
			throw new Error("Authentication Needed");
		}
		const { userId } = jwt.decode(token, process.env["REMODY_SECRET"]);
		const paper = await prisma.query.paper(
			{
				where: { id: paperId }
			},
			"{ id url owner { id } }"
		);
		if (!paper) {
			throw new Error("No Paper found");
		}
		if (paper.owner.id !== userId) {
			throw new Error("You can't get Paper Info");
		}
		try {
			fs.unlinkSync("/home/ubuntu/app/remody-server" + "/" + paper.url);
		} catch (err) {
			throw new Error(`file Error:\n${err}`);
		}
		try {
			await elastic.delete({
				index: "paper",
				type: "metadata",
				id: paper.id
			});
		} catch (err) {
			throw new Error(`elastic Error:\n${err}`);
		}
		try {
			await prisma.mutation.deletePaper({ where: { id: paperId } });
		} catch (err) {
			throw new Error(`Prisma Error:\n${err}`);
		}

		return true;
	}
};

export default Mutation;
