"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _jsonwebtoken = require("jsonwebtoken");

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _pythonShell = require("python-shell");

var _mysql = require("../utils/mysql");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Query = {
	users: function users(parent, args, _ref, info) {
		var prisma = _ref.prisma;

		var onArgs = {};
		if (args.query) {
			onArgs.where = {
				OR: [{ name_contains: args.query }, { email_contains: args.query }]
			};
		}
		return prisma.query.users(onArgs, info);
	},
	me: function me(parent, args, _ref2, info) {
		var prisma = _ref2.prisma,
		    request = _ref2.request;

		var header = request.headers.authorization;
		var token = header ? header.replace("Bearer ", "") : args.token;
		if (!token) {
			throw new Error("Authentication Needed");
		}

		var _jwt$decode = _jsonwebtoken2.default.decode(token, process.env["REMODY_SECRET"]),
		    userId = _jwt$decode.userId;

		return prisma.query.user({ where: { id: userId } }, info);
	},
	files: function files(parent, args, _ref3, info) {
		var prisma = _ref3.prisma;

		var _jwt$decode2 = _jsonwebtoken2.default.decode(args.token, process.env["REMODY_SECRET"]),
		    userId = _jwt$decode2.userId;

		console.log(userId);
		return prisma.query.files({
			where: {
				owner: {
					id: userId
				}
			}
		}, info);
	},
	userSchemas: function userSchemas(parent, args, _ref4, info) {
		var prisma = _ref4.prisma,
		    request = _ref4.request;

		var header = request.headers.authorization;
		var token = header.replace("Bearer ", "");
		if (!token) {
			throw new Error("Authentication Needed");
		}

		var _jwt$decode3 = _jsonwebtoken2.default.decode(token, process.env["REMODY_SECRET"]),
		    userId = _jwt$decode3.userId;

		return prisma.query.userSchemas({
			where: {
				user: {
					id: userId
				}
			}
		}, info);
	},
	mysqlConnection: function () {
		var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(parent, args, _ref5, info) {
			var mysql = _ref5.mysql;
			var result;
			return _regenerator2.default.wrap(function _callee$(_context) {
				while (1) {
					switch (_context.prev = _context.next) {
						case 0:
							_context.prev = 0;
							_context.next = 3;
							return (0, _mysql.query)(mysql, "SELECT * FROM professor");

						case 3:
							result = _context.sent;

							console.table(result);
							_context.next = 10;
							break;

						case 7:
							_context.prev = 7;
							_context.t0 = _context["catch"](0);
							throw new Error(_context.t0);

						case 10:
							return _context.abrupt("return", true);

						case 11:
						case "end":
							return _context.stop();
					}
				}
			}, _callee, this, [[0, 7]]);
		}));

		function mysqlConnection(_x, _x2, _x3, _x4) {
			return _ref6.apply(this, arguments);
		}

		return mysqlConnection;
	}(),
	pythonExample: function pythonExample(parent, args, _ref7, info) {
		var prisma = _ref7.prisma;

		var options = {
			mode: "text",

			pythonPath: "",

			pythonOptions: ["-u"],

			scriptPath: __dirname + "/../python",

			args: ["value1", "value2", "value3"]
		};

		_pythonShell.PythonShell.run("example.py", options, function (err, results) {
			if (err) throw err;

			console.log("results: %j", results);
		});

		return true;
	}
};

exports.default = Query;