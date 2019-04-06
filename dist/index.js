"use strict";

var _graphqlYoga = require("graphql-yoga");

var _mysql = require("mysql");

var _mysql2 = _interopRequireDefault(_mysql);

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

		var pool = _mysql2.default.createPool({
			host: process.env.RDS_HOSTNAME,
			user: process.env.RDS_USERNAME,
			password: process.env.RDS_PASSWORD,
			port: process.env.RDS_PORT,
			database: process.env.RDS_MAINDB
		});
		return {
			prisma: _prisma2.default,
			request: request,
			mysql: pool
		};
	}
});

server.start(function () {
	console.log("The server is up!");
});