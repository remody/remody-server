import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createWriteStream } from "fs";
import mkdirp from "mkdirp";
import shortid from "shortid";
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import { query } from "../utils/mysql";
import { pythonShell } from "../utils/python";
import fs from "fs";

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
	async deleteUser(parent, args, { prisma }, info) {
		const idExist = await prisma.exists.User({ id: args.id });
		if (!idExist) {
			throw new Error("User doesn't exists");
		}

		const deletedUser = await prisma.mutation.deleteUser(
			{ where: { id: args.id } },
			info
		);

		return deletedUser;
	},
	async updateUser(parent, args, { prisma }, info) {
		const idExist = await prisma.exists.User({ id: args.id });

		if (!idExist) {
			throw new Error("User doesn't exists");
		}

		const updatedUser = await prisma.mutation.updateUser(
			{
				where: { id: args.id },
				data: args.data
			},
			info
		);

		return updatedUser;
	},
	async singleUpload(parent, { file }, { prisma, request }, info) {
		const header = request.headers.authorization;
		if (!header) {
			throw new Error("Authentication Needed");
		}
		const token = header.replace("Bearer ", "");

		const { userId } = jwt.decode(token, process.env["REMODY_SECRET"]);
		const { filename, mimetype, encoding, path } = await processUpload(
			file,
			userId
		);
		return prisma.mutation.createFile({
			data: {
				filename,
				mimetype,
				encoding,
				path,
				owner: {
					connect: {
						id: userId
					}
				}
			}
		});
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
		{ prisma, request },
		info
	) {
		const header = request.headers.authorization;
		if (!header) {
			throw new Error("Authentication Needed");
		}
		const token = header.replace("Bearer ", "");
		const { userId } = jwt.decode(token, process.env["REMODY_SECRET"]);
		const { filename, mimetype, encoding, path } = await processUpload(
			file,
			userId
		);

		const uploadPath =
			__dirname.substr(0, __dirname.indexOf("/src")) + "/" + path;
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
		const bulkData = fs.readFileSync(jsonPath);
		const json = JSON.parse(bulkData.toString());
		console.log(json);
		//파일을 파이썬으로 해석
		//프리즈마에 새파일 생성
		//엘라스틱 서치에 저장
		//다운로드를 하게 하려면 S3에 저장하고 그 주소를 Paper객체에 전달
		let PaperId;
		try {
			const result = await prisma.mutation.createPaper(
				{
					data: {
						title,
						author,
						belong,
						publishedyear,
						owner: { connect: { id: userId } }
					}
				},
				"{ id }"
			);
			console.log(result);
			return true;
		} catch (err) {
			throw new Error(`PrismaError:\n${err}`);
		}
	}
};

export default Mutation;
