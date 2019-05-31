"use strict";

var _graphqlYoga = require("graphql-yoga");

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _Query = require("./resolvers/Query");

var _Query2 = _interopRequireDefault(_Query);

var _Mutation = require("./resolvers/Mutation");

var _Mutation2 = _interopRequireDefault(_Mutation);

var _Subscription = require("./resolvers/Subscription");

var _Subscription2 = _interopRequireDefault(_Subscription);

var _User = require("./resolvers/User");

var _User2 = _interopRequireDefault(_User);

var _prisma = require("./prisma");

var _prisma2 = _interopRequireDefault(_prisma);

var _elastic = require("./elastic");

var _elastic2 = _interopRequireDefault(_elastic);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var server = new _graphqlYoga.GraphQLServer({
	typeDefs: "./src/schema.graphql",
	resolvers: {
		Query: _Query2.default,
		Mutation: _Mutation2.default,
		Subscription: _Subscription2.default,
		User: _User2.default
	},
	context: function context(_ref) {
		var request = _ref.request;

		return {
			prisma: _prisma2.default,
			elastic: _elastic2.default,
			request: request
		};
	}
});

server.express.use("/uploads", _express2.default.static("uploads"));

server.start(function () {
	console.log("The server is up!");
});