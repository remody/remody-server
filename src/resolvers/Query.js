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
	}
};

export { Query as default };
