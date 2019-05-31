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

var _python = require("../utils/python");

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
	elasticSearchConnection: function () {
		var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(parent, args, _ref6, info) {
			var elastic = _ref6.elastic;
			var result;
			return _regenerator2.default.wrap(function _callee2$(_context2) {
				while (1) {
					switch (_context2.prev = _context2.next) {
						case 0:
							_context2.prev = 0;
							_context2.next = 3;
							return elastic.search({
								index: "paper",
								body: {
									query: {
										bool: {
											must: [{
												query_string: {
													query: "논문"
												}
											}],
											must_not: [],
											should: []
										}
									},
									from: 0,
									size: 10,
									sort: [],
									aggs: {}
								}
							});

						case 3:
							result = _context2.sent;

							console.log(result.body);
							console.log(result.body.hits.hits.map(function (item) {
								return item._source;
							}));
							_context2.next = 11;
							break;

						case 8:
							_context2.prev = 8;
							_context2.t0 = _context2["catch"](0);
							throw new Error(_context2.t0);

						case 11:
							return _context2.abrupt("return", true);

						case 12:
						case "end":
							return _context2.stop();
					}
				}
			}, _callee2, this, [[0, 8]]);
		}));

		function elasticSearchConnection(_x4, _x5, _x6, _x7) {
			return _ref7.apply(this, arguments);
		}

		return elasticSearchConnection;
	}(),
	pythonExample: function () {
		var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(parent, args, ctx, info) {
			var result;
			return _regenerator2.default.wrap(function _callee3$(_context3) {
				while (1) {
					switch (_context3.prev = _context3.next) {
						case 0:
							_context3.next = 2;
							return (0, _python.pythonShell)("example.py");

						case 2:
							result = _context3.sent;

							console.log(result);

							return _context3.abrupt("return", true);

						case 5:
						case "end":
							return _context3.stop();
					}
				}
			}, _callee3, this);
		}));

		function pythonExample(_x8, _x9, _x10, _x11) {
			return _ref8.apply(this, arguments);
		}

		return pythonExample;
	}(),
	UserSchemaInfo: function () {
		var _ref11 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(parent, _ref9, _ref10, info) {
			var schemaId = _ref9.schemaId;
			var request = _ref10.request,
			    prisma = _ref10.prisma;

			var header, token, _jwt$decode4, id, rightUserCheck, _ref12, _ref13, fieldQuery, rows, fields, _ref14, _ref15, nextId;

			return _regenerator2.default.wrap(function _callee4$(_context4) {
				while (1) {
					switch (_context4.prev = _context4.next) {
						case 0:
							header = request.headers.authorization;
							token = header.replace("Bearer ", "");

							if (header) {
								_context4.next = 4;
								break;
							}

							throw new Error("Authentication Needed");

						case 4:
							_jwt$decode4 = _jsonwebtoken2.default.decode(token, process.env["REMODY_SECRET"]), id = _jwt$decode4.userId;
							_context4.next = 7;
							return prisma.query.userSchema({
								where: { id: schemaId }
							}, "{ id name user { id } }");

						case 7:
							rightUserCheck = _context4.sent;

							if (rightUserCheck) {
								_context4.next = 10;
								break;
							}

							throw new Error("No UserSchema found");

						case 10:
							if (!(rightUserCheck.user.id !== id)) {
								_context4.next = 12;
								break;
							}

							throw new Error("You can't get Schema Info");

						case 12:
							_context4.prev = 12;
							_context4.next = 15;
							return Promise.all([(0, _mysql.query)("show full columns from " + id + "_" + rightUserCheck.name + ";"), (0, _mysql.query)("SELECT * FROM " + id + "_" + rightUserCheck.name + ";")]);

						case 15:
							_ref12 = _context4.sent;
							_ref13 = (0, _slicedToArray3.default)(_ref12, 2);
							fieldQuery = _ref13[0];
							rows = _ref13[1];
							fields = fieldQuery.map(function (item) {
								return item.Field;
							});

							if (!(rows.length >= 1)) {
								_context4.next = 26;
								break;
							}

							_context4.next = 23;
							return (0, _mysql.query)("SELECT id FROM " + id + "_" + rightUserCheck.name + " ORDER BY id DESC LIMIT 1;");

						case 23:
							_context4.t0 = _context4.sent;
							_context4.next = 27;
							break;

						case 26:
							_context4.t0 = [{ id: 0 }];

						case 27:
							_ref14 = _context4.t0;
							_ref15 = (0, _slicedToArray3.default)(_ref14, 1);
							nextId = _ref15[0].id;
							return _context4.abrupt("return", {
								fields: fields,
								rows: rows,
								nextId: nextId
							});

						case 33:
							_context4.prev = 33;
							_context4.t1 = _context4["catch"](12);
							throw new Error("MySQL Error");

						case 36:
						case "end":
							return _context4.stop();
					}
				}
			}, _callee4, this, [[12, 33]]);
		}));

		function UserSchemaInfo(_x12, _x13, _x14, _x15) {
			return _ref11.apply(this, arguments);
		}

		return UserSchemaInfo;
	}(),
	papers: function () {
		var _ref18 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(parent, _ref16, _ref17, info) {
			var first = _ref16.first,
			    after = _ref16.after,
			    queryString = _ref16.queryString;
			var prisma = _ref17.prisma,
			    elastic = _ref17.elastic;
			var args, result, ids;
			return _regenerator2.default.wrap(function _callee5$(_context5) {
				while (1) {
					switch (_context5.prev = _context5.next) {
						case 0:
							args = { first: first };

							if (after) {
								args.after = after;
							}

							if (!queryString) {
								_context5.next = 14;
								break;
							}

							_context5.prev = 3;
							_context5.next = 6;
							return elastic.search({
								index: "paper",
								body: {
									query: {
										bool: {
											must: [{
												query_string: {
													query: queryString
												}
											}],
											must_not: [],
											should: []
										}
									},
									from: 0,
									size: 100,
									sort: [],
									aggs: {}
								}
							});

						case 6:
							result = _context5.sent;
							ids = result.body.hits.hits.map(function (item) {
								return item._id;
							});
							return _context5.abrupt("return", prisma.query.papers({ first: first, where: { id_in: ids } }, info));

						case 11:
							_context5.prev = 11;
							_context5.t0 = _context5["catch"](3);
							throw new Error(_context5.t0);

						case 14:
							return _context5.abrupt("return", prisma.query.papers({ first: first }, info));

						case 15:
						case "end":
							return _context5.stop();
					}
				}
			}, _callee5, this, [[3, 11]]);
		}));

		function papers(_x16, _x17, _x18, _x19) {
			return _ref18.apply(this, arguments);
		}

		return papers;
	}()
};

exports.default = Query;