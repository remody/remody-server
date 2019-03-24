import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createWriteStream } from "fs";
import mkdirp from "mkdirp";
import shortid from "shortid";
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";

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
		const token = header.replace("Bearer ", "");
		if (!header) {
			throw new Error("Authentication Needed");
		}
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
	}
};

export default Mutation;
