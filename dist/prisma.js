"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _prismaBinding = require("prisma-binding");

var prisma = new _prismaBinding.Prisma({
	typeDefs: "src/generated/prisma.graphql",
	endpoint: "https://us1.prisma.sh/kyungminlee-5dfb92/remody-server/dev"
});

exports.default = prisma;