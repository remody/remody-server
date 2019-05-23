"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

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
		var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(parent, args, info) {
			var result;
			return _regenerator2.default.wrap(function _callee$(_context) {
				while (1) {
					switch (_context.prev = _context.next) {
						case 0:
							_context.prev = 0;
							_context.next = 3;
							return (0, _mysql.query)("SELECT * FROM professor");

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

		function mysqlConnection(_x, _x2, _x3) {
			return _ref5.apply(this, arguments);
		}

		return mysqlConnection;
	}(),
	pythonExample: function pythonExample(parent, args, _ref6, info) {
		var prisma = _ref6.prisma;

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
	},
	UserSchemaInfo: function () {
		var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(parent, _ref7, _ref8, info) {
			var schemaId = _ref7.schemaId;
			var request = _ref8.request,
			    prisma = _ref8.prisma;

			var header, token, _jwt$decode4, id, rightUserCheck, _ref10, _ref11, fieldQuery, rows, fields, _ref12, _ref13, nextId;

			return _regenerator2.default.wrap(function _callee2$(_context2) {
				while (1) {
					switch (_context2.prev = _context2.next) {
						case 0:
							header = request.headers.authorization;
							token = header.replace("Bearer ", "");

							if (header) {
								_context2.next = 4;
								break;
							}

							throw new Error("Authentication Needed");

						case 4:
							_jwt$decode4 = _jsonwebtoken2.default.decode(token, process.env["REMODY_SECRET"]), id = _jwt$decode4.userId;
							_context2.next = 7;
							return prisma.query.userSchema({
								where: { id: schemaId }
							}, "{ id name user { id } }");

						case 7:
							rightUserCheck = _context2.sent;

							if (rightUserCheck) {
								_context2.next = 10;
								break;
							}

							throw new Error("No UserSchema found");

						case 10:
							if (!(rightUserCheck.user.id !== id)) {
								_context2.next = 12;
								break;
							}

							throw new Error("You can't get Schema Info");

						case 12:
							_context2.prev = 12;
							_context2.next = 15;
							return Promise.all([(0, _mysql.query)("show full columns from " + id + "_" + rightUserCheck.name + ";"), (0, _mysql.query)("SELECT * FROM " + id + "_" + rightUserCheck.name + ";")]);

						case 15:
							_ref10 = _context2.sent;
							_ref11 = (0, _slicedToArray3.default)(_ref10, 2);
							fieldQuery = _ref11[0];
							rows = _ref11[1];
							fields = fieldQuery.map(function (item) {
								return item.Field;
							});

							if (!(rows.length >= 1)) {
								_context2.next = 26;
								break;
							}

							_context2.next = 23;
							return (0, _mysql.query)("SELECT id FROM " + id + "_" + rightUserCheck.name + " ORDER BY id DESC LIMIT 1;");

						case 23:
							_context2.t0 = _context2.sent;
							_context2.next = 27;
							break;

						case 26:
							_context2.t0 = [{ id: 0 }];

						case 27:
							_ref12 = _context2.t0;
							_ref13 = (0, _slicedToArray3.default)(_ref12, 1);
							nextId = _ref13[0].id;
							return _context2.abrupt("return", {
								fields: fields,
								rows: rows,
								nextId: nextId
							});

						case 33:
							_context2.prev = 33;
							_context2.t1 = _context2["catch"](12);
							throw new Error("MySQL Error");

						case 36:
						case "end":
							return _context2.stop();
					}
				}
			}, _callee2, this, [[12, 33]]);
		}));

		function UserSchemaInfo(_x4, _x5, _x6, _x7) {
			return _ref9.apply(this, arguments);
		}

		return UserSchemaInfo;
	}()
};

exports.default = Query;