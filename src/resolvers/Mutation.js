import bcrypt from "bcryptjs";

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

		const createdUser = await prisma.mutation.createUser(
			{
				data: {
					...args.data,
					password
				}
			},
			info
		);

		return createdUser;
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
	}
};

export { Mutation as default };
