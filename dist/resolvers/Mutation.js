"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _bcryptjs = require("bcryptjs");

var _bcryptjs2 = _interopRequireDefault(_bcryptjs);

var _jsonwebtoken = require("jsonwebtoken");

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require("mkdirp");

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _shortid = require("shortid");

var _shortid2 = _interopRequireDefault(_shortid);

var _nodemailer = require("nodemailer");

var _nodemailer2 = _interopRequireDefault(_nodemailer);

var _nodemailerSmtpTransport = require("nodemailer-smtp-transport");

var _nodemailerSmtpTransport2 = _interopRequireDefault(_nodemailerSmtpTransport);

var _mysql = require("../utils/mysql");

var _python = require("../utils/python");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var uploadDir = "uploads";

_mkdirp2.default.sync(uploadDir);

var storeUpload = function () {
	var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(_ref) {
		var stream = _ref.stream,
		    filename = _ref.filename,
		    userId = _ref.userId;
		var id, userPath, path;
		return _regenerator2.default.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						id = _shortid2.default.generate();
						userPath = uploadDir + "/" + userId;

						_mkdirp2.default.sync(userPath);
						path = userPath + "/" + id + "-" + filename;
						return _context.abrupt("return", new Promise(function (resolve, reject) {
							return stream.pipe((0, _fs.createWriteStream)(path)).on("finish", function () {
								return resolve({ id: id, path: path });
							}).on("error", reject);
						}));

					case 5:
					case "end":
						return _context.stop();
				}
			}
		}, _callee, undefined);
	}));

	return function storeUpload(_x) {
		return _ref2.apply(this, arguments);
	};
}();

var processUpload = function () {
	var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(upload, userId) {
		var _ref4, stream, filename, mimetype, encoding, _ref5, id, path;

		return _regenerator2.default.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						_context2.next = 2;
						return upload;

					case 2:
						_ref4 = _context2.sent;
						stream = _ref4.stream;
						filename = _ref4.filename;
						mimetype = _ref4.mimetype;
						encoding = _ref4.encoding;
						_context2.next = 9;
						return storeUpload({ stream: stream, filename: filename, userId: userId });

					case 9:
						_ref5 = _context2.sent;
						id = _ref5.id;
						path = _ref5.path;
						return _context2.abrupt("return", { id: id, filename: filename, mimetype: mimetype, encoding: encoding, path: path });

					case 13:
					case "end":
						return _context2.stop();
				}
			}
		}, _callee2, undefined);
	}));

	return function processUpload(_x2, _x3) {
		return _ref3.apply(this, arguments);
	};
}();

var Mutation = {
	createUser: function () {
		var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(parent, args, _ref6, info) {
			var prisma = _ref6.prisma;
			var emailTaken, password, createdUser;
			return _regenerator2.default.wrap(function _callee3$(_context3) {
				while (1) {
					switch (_context3.prev = _context3.next) {
						case 0:
							_context3.next = 2;
							return prisma.exists.User({ email: args.data.email });

						case 2:
							emailTaken = _context3.sent;

							if (!(args.data.password.length < 8)) {
								_context3.next = 5;
								break;
							}

							throw new Error("Password must be 8 characters or longer.");

						case 5:
							if (!emailTaken) {
								_context3.next = 7;
								break;
							}

							throw new Error("Email Already taken!");

						case 7:
							_context3.next = 9;
							return _bcryptjs2.default.hash(args.data.password, 10);

						case 9:
							password = _context3.sent;
							_context3.next = 12;
							return prisma.mutation.createUser({
								data: (0, _extends3.default)({}, args.data, {
									password: password
								})
							});

						case 12:
							createdUser = _context3.sent;
							return _context3.abrupt("return", {
								user: createdUser,
								token: _jsonwebtoken2.default.sign({ userId: createdUser.id }, process.env["REMODY_SECRET"])
							});

						case 14:
						case "end":
							return _context3.stop();
					}
				}
			}, _callee3, this);
		}));

		function createUser(_x4, _x5, _x6, _x7) {
			return _ref7.apply(this, arguments);
		}

		return createUser;
	}(),
	login: function () {
		var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(parent, args, _ref8, info) {
			var prisma = _ref8.prisma;
			var loginUser, isMatch;
			return _regenerator2.default.wrap(function _callee4$(_context4) {
				while (1) {
					switch (_context4.prev = _context4.next) {
						case 0:
							_context4.next = 2;
							return prisma.query.user({
								where: {
									email: args.data.email
								}
							});

						case 2:
							loginUser = _context4.sent;

							if (loginUser) {
								_context4.next = 5;
								break;
							}

							throw new Error("Unable to login");

						case 5:
							_context4.next = 7;
							return _bcryptjs2.default.compare(args.data.password, loginUser.password);

						case 7:
							isMatch = _context4.sent;

							if (isMatch) {
								_context4.next = 10;
								break;
							}

							throw new Error("Invalid Password");

						case 10:
							return _context4.abrupt("return", {
								user: loginUser,
								token: _jsonwebtoken2.default.sign({ userId: loginUser.id }, process.env["REMODY_SECRET"])
							});

						case 11:
						case "end":
							return _context4.stop();
					}
				}
			}, _callee4, this);
		}));

		function login(_x8, _x9, _x10, _x11) {
			return _ref9.apply(this, arguments);
		}

		return login;
	}(),
	deleteUser: function () {
		var _ref11 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(parent, args, _ref10, info) {
			var prisma = _ref10.prisma,
			    request = _ref10.request;

			var header, token, _jwt$decode, userId, idExist, deletedUser;

			return _regenerator2.default.wrap(function _callee5$(_context5) {
				while (1) {
					switch (_context5.prev = _context5.next) {
						case 0:
							header = request.headers.authorization;

							if (header) {
								_context5.next = 3;
								break;
							}

							throw new Error("Authentication Needed");

						case 3:
							token = header.replace("Bearer ", "");
							_jwt$decode = _jsonwebtoken2.default.decode(token, process.env["REMODY_SECRET"]), userId = _jwt$decode.userId;
							_context5.next = 7;
							return prisma.exists.User({ id: userId });

						case 7:
							idExist = _context5.sent;

							if (idExist) {
								_context5.next = 10;
								break;
							}

							throw new Error("User doesn't exists");

						case 10:
							_context5.next = 12;
							return prisma.mutation.deleteUser({ where: { id: args.id } }, info);

						case 12:
							deletedUser = _context5.sent;
							return _context5.abrupt("return", deletedUser);

						case 14:
						case "end":
							return _context5.stop();
					}
				}
			}, _callee5, this);
		}));

		function deleteUser(_x12, _x13, _x14, _x15) {
			return _ref11.apply(this, arguments);
		}

		return deleteUser;
	}(),
	updateUser: function () {
		var _ref13 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(parent, args, _ref12, info) {
			var prisma = _ref12.prisma,
			    request = _ref12.request;

			var header, token, _jwt$decode2, userId, idExist, updatedUser;

			return _regenerator2.default.wrap(function _callee6$(_context6) {
				while (1) {
					switch (_context6.prev = _context6.next) {
						case 0:
							header = request.headers.authorization;

							if (header) {
								_context6.next = 3;
								break;
							}

							throw new Error("Authentication Needed");

						case 3:
							token = header.replace("Bearer ", "");
							_jwt$decode2 = _jsonwebtoken2.default.decode(token, process.env["REMODY_SECRET"]), userId = _jwt$decode2.userId;
							_context6.next = 7;
							return prisma.exists.User({ id: userId });

						case 7:
							idExist = _context6.sent;

							if (idExist) {
								_context6.next = 10;
								break;
							}

							throw new Error("User doesn't exists");

						case 10:
							_context6.next = 12;
							return prisma.mutation.updateUser({
								where: { id: userId },
								data: args.data
							}, info);

						case 12:
							updatedUser = _context6.sent;
							return _context6.abrupt("return", updatedUser);

						case 14:
						case "end":
							return _context6.stop();
					}
				}
			}, _callee6, this);
		}));

		function updateUser(_x16, _x17, _x18, _x19) {
			return _ref13.apply(this, arguments);
		}

		return updateUser;
	}(),
	singleUpload: function () {
		var _ref16 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(parent, _ref14, _ref15, info) {
			var file = _ref14.file,
			    schemaId = _ref14.schemaId;
			var prisma = _ref15.prisma,
			    request = _ref15.request;

			var header, token, _jwt$decode3, userId, _ref17, path, columns, keywords, uploadPath, preprocResult, _ref18, _ref19, compareResult, bulkData, json, attrs, values, attstring, valuestring;

			return _regenerator2.default.wrap(function _callee7$(_context7) {
				while (1) {
					switch (_context7.prev = _context7.next) {
						case 0:
							console.log("singleUpload");
							header = request.headers.authorization;

							if (header) {
								_context7.next = 4;
								break;
							}

							throw new Error("Authentication Needed");

						case 4:
							token = header.replace("Bearer ", "");
							_jwt$decode3 = _jsonwebtoken2.default.decode(token, process.env["REMODY_SECRET"]), userId = _jwt$decode3.userId;
							_context7.next = 8;
							return processUpload(file, userId);

						case 8:
							_ref17 = _context7.sent;
							path = _ref17.path;
							_context7.next = 12;
							return prisma.mutation.updateUserSchema({ data: { created: true }, where: { id: schemaId } }, "{ name rowCount columns { name } }");

						case 12:
							columns = _context7.sent;
							keywords = columns.columns.map(function (item) {
								return item.name;
							});

							console.log(keywords);
							uploadPath = "/home/ubuntu/app/remody-server" + "/" + path;
							_context7.next = 18;
							return (0, _python.pythonShell)("preproc.py", [uploadPath]);

						case 18:
							preprocResult = _context7.sent;

							console.log(preprocResult);
							_context7.next = 22;
							return (0, _python.pythonShell)("remody_compare.py", [preprocResult[0]].concat((0, _toConsumableArray3.default)(keywords)));

						case 22:
							_ref18 = _context7.sent;
							_ref19 = (0, _slicedToArray3.default)(_ref18, 1);
							compareResult = _ref19[0];

							console.log(compareResult);

							if (!(compareResult === "NO")) {
								_context7.next = 28;
								break;
							}

							throw new Error("일치하는 키워드가 없습니다.");

						case 28:
							bulkData = _fs2.default.readFileSync(compareResult);

							_fs2.default.unlinkSync(compareResult);
							json = JSON.parse(bulkData.toString());

							console.log(json);

							attrs = [];
							values = [];

							Object.entries(json).map(function (_ref20) {
								var _ref21 = (0, _slicedToArray3.default)(_ref20, 2),
								    attr = _ref21[0],
								    value = _ref21[1];

								attrs = [].concat((0, _toConsumableArray3.default)(attrs), [attr]);
								values = [].concat((0, _toConsumableArray3.default)(values), [value]);
							});
							attstring = attrs.reduce(function (acc, string, index) {
								if (index === attrs.length - 1) {
									return "" + acc + string;
								}
								return "" + acc + string + ",";
							}, "");
							valuestring = values.reduce(function (acc, string, index) {
								if (index === values.length - 1) {
									return acc + "\"" + string + "\"";
								}
								return acc + "\"" + string + "\",";
							}, "");
							_context7.next = 39;
							return (0, _mysql.query)("INSERT INTO " + userId + "_" + columns.name + " (" + attstring + ") VALUES (" + valuestring + "); ");

						case 39:
							_context7.next = 41;
							return prisma.mutation.updateUserSchema({
								data: { created: false, rowCount: columns.rowCount + 1 },
								where: { id: schemaId }
							});

						case 41:
							return _context7.abrupt("return", true);

						case 42:
						case "end":
							return _context7.stop();
					}
				}
			}, _callee7, this);
		}));

		function singleUpload(_x20, _x21, _x22, _x23) {
			return _ref16.apply(this, arguments);
		}

		return singleUpload;
	}(),
	multipleUpload: function () {
		var _ref24 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(parent, _ref22, _ref23, info) {
			var files = _ref22.files;
			var prisma = _ref23.prisma;
			return _regenerator2.default.wrap(function _callee8$(_context8) {
				while (1) {
					switch (_context8.prev = _context8.next) {
						case 0:
							Promise.all(files.map(processUpload));

						case 1:
						case "end":
							return _context8.stop();
					}
				}
			}, _callee8, this);
		}));

		function multipleUpload(_x24, _x25, _x26, _x27) {
			return _ref24.apply(this, arguments);
		}

		return multipleUpload;
	}(),
	createAuthAccessCode: function () {
		var _ref26 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9(parent, args, _ref25, info) {
			var prisma = _ref25.prisma;
			var forgotUser, data, transporter, mailOptions;
			return _regenerator2.default.wrap(function _callee9$(_context9) {
				while (1) {
					switch (_context9.prev = _context9.next) {
						case 0:
							_context9.next = 2;
							return prisma.exists.User({
								email: args.email
							});

						case 2:
							forgotUser = _context9.sent;

							if (forgotUser) {
								_context9.next = 5;
								break;
							}

							throw new Error("No User this email");

						case 5:
							_context9.next = 7;
							return prisma.mutation.createAuthAccessCode({
								data: {
									user: {
										connect: {
											email: args.email
										}
									}
								}
							}, "{ id user { email } }");

						case 7:
							data = _context9.sent;
							transporter = _nodemailer2.default.createTransport((0, _nodemailerSmtpTransport2.default)({
								service: "gmail",
								host: "smtp.gmail.com",
								auth: {
									user: process.env["REMODY_EMAIL_USER"],
									pass: process.env["REMODY_EMAIL_PASSWORD"]
								}
							}));
							mailOptions = {
								from: "Remody <" + process.env["REMODY_EMAIL_USER"] + ">",
								to: data.user.email,
								subject: "Change Your Password",
								text: "Your code is \"" + data.id + "\""
							};


							transporter.sendMail(mailOptions, function (error, info) {
								if (error) {
									throw new Error("Can't Send Email");
								} else {
									console.log("Email sent: " + info.response);
								}
							});

							return _context9.abrupt("return", true);

						case 12:
						case "end":
							return _context9.stop();
					}
				}
			}, _callee9, this);
		}));

		function createAuthAccessCode(_x28, _x29, _x30, _x31) {
			return _ref26.apply(this, arguments);
		}

		return createAuthAccessCode;
	}(),
	changeUserPassword: function () {
		var _ref28 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee10(parent, args, _ref27, info) {
			var prisma = _ref27.prisma;

			var AuthAccessCode, _ref29, _ref30, _, password;

			return _regenerator2.default.wrap(function _callee10$(_context10) {
				while (1) {
					switch (_context10.prev = _context10.next) {
						case 0:
							_context10.next = 2;
							return prisma.exists.AuthAccessCode({
								id: args.data.accessCode,
								user: {
									email: args.data.email
								}
							});

						case 2:
							AuthAccessCode = _context10.sent;

							if (AuthAccessCode) {
								_context10.next = 5;
								break;
							}

							throw new Error("No Match AccessCode");

						case 5:
							_context10.next = 7;
							return Promise.all([prisma.mutation.deleteAuthAccessCode({
								where: {
									id: args.data.accessCode
								}
							}), _bcryptjs2.default.hash(args.data.password, 10)]);

						case 7:
							_ref29 = _context10.sent;
							_ref30 = (0, _slicedToArray3.default)(_ref29, 2);
							_ = _ref30[0];
							password = _ref30[1];
							return _context10.abrupt("return", prisma.mutation.updateUser({
								where: {
									email: args.data.email
								},
								data: {
									password: password
								}
							}, info));

						case 12:
						case "end":
							return _context10.stop();
					}
				}
			}, _callee10, this);
		}));

		function changeUserPassword(_x32, _x33, _x34, _x35) {
			return _ref28.apply(this, arguments);
		}

		return changeUserPassword;
	}(),
	createTable: function () {
		var _ref33 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee11(parent, _ref31, _ref32, info) {
			var data = _ref31.data;
			var request = _ref32.request,
			    prisma = _ref32.prisma;

			var header, token, _jwt$decode4, id, queryString;

			return _regenerator2.default.wrap(function _callee11$(_context11) {
				while (1) {
					switch (_context11.prev = _context11.next) {
						case 0:
							header = request.headers.authorization;
							token = header.replace("Bearer ", "");

							if (header) {
								_context11.next = 4;
								break;
							}

							throw new Error("Authentication Needed");

						case 4:
							_jwt$decode4 = _jsonwebtoken2.default.decode(token, process.env["REMODY_SECRET"]), id = _jwt$decode4.userId;

							if (!(data.rows.length < 1)) {
								_context11.next = 7;
								break;
							}

							throw new Error("Rows Must be at least one");

						case 7:
							queryString = data.rows.reduce(function (acc, _ref34) {
								var name = _ref34.name,
								    type = _ref34.type,
								    length = _ref34.length;
								return acc + (name + " " + type + "(" + (length ? length : 30) + "),\n");
							}, "");
							_context11.prev = 8;
							_context11.next = 11;
							return (0, _mysql.query)("CREATE TABLE " + id + "_" + data.name + " (\n\t\t\t\t\tid bigint(20) unsigned NOT NULL AUTO_INCREMENT,\n\t\t\t\t\t" + queryString + "PRIMARY KEY (id)\n\t\t\t\t);");

						case 11:
							_context11.next = 16;
							break;

						case 13:
							_context11.prev = 13;
							_context11.t0 = _context11["catch"](8);
							throw new Error("MYSQL ERROR\n" + _context11.t0);

						case 16:
							_context11.prev = 16;
							return _context11.abrupt("return", prisma.mutation.createUserSchema({
								data: {
									name: data.name,
									user: {
										connect: {
											id: id
										}
									},
									columns: {
										create: data.rows
									}
								}
							}, info));

						case 20:
							_context11.prev = 20;
							_context11.t1 = _context11["catch"](16);
							throw new Error("Prisma Error\n" + _context11.t1);

						case 23:
						case "end":
							return _context11.stop();
					}
				}
			}, _callee11, this, [[8, 13], [16, 20]]);
		}));

		function createTable(_x36, _x37, _x38, _x39) {
			return _ref33.apply(this, arguments);
		}

		return createTable;
	}(),
	UpdateUserSchemaInfo: function () {
		var _ref37 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee12(parent, _ref35, _ref36, info) {
			var _ref35$data = _ref35.data,
			    schemaId = _ref35$data.schemaId,
			    updateRows = _ref35$data.updateRows,
			    deleteRows = _ref35$data.deleteRows,
			    createRows = _ref35$data.createRows;
			var request = _ref36.request,
			    prisma = _ref36.prisma;

			var header, token, _jwt$decode5, userId, getSchema, _ref40, _ref41, fieldQuery, rows, _ref41$, firstItem, fields, nextId;

			return _regenerator2.default.wrap(function _callee12$(_context12) {
				while (1) {
					switch (_context12.prev = _context12.next) {
						case 0:
							header = request.headers.authorization;
							token = header.replace("Bearer ", "");

							if (header) {
								_context12.next = 4;
								break;
							}

							throw new Error("Authentication Needed");

						case 4:
							_jwt$decode5 = _jsonwebtoken2.default.decode(token, process.env["REMODY_SECRET"]), userId = _jwt$decode5.userId;
							_context12.next = 7;
							return prisma.query.userSchema({
								where: { id: schemaId }
							}, "{ id name user { id } }");

						case 7:
							getSchema = _context12.sent;

							if (getSchema) {
								_context12.next = 10;
								break;
							}

							throw new Error("No UserSchema found");

						case 10:
							if (!(getSchema.user.id !== userId)) {
								_context12.next = 12;
								break;
							}

							throw new Error("You can't get Schema Info");

						case 12:
							_context12.prev = 12;
							_context12.next = 15;
							return Promise.all(createRows.map(function (id) {
								return "INSERT INTO " + userId + "_" + getSchema.name + " (id) VALUES (" + id + "); ";
							}).map(function (queryString) {
								return (0, _mysql.query)(queryString);
							}));

						case 15:
							_context12.next = 20;
							break;

						case 17:
							_context12.prev = 17;
							_context12.t0 = _context12["catch"](12);
							throw new Error("MySQL error:Input error\n" + _context12.t0);

						case 20:
							_context12.prev = 20;
							_context12.next = 23;
							return Promise.all(updateRows.map(function (item) {
								var Query = "";
								var id = item.id,
								    queryObject = (0, _objectWithoutProperties3.default)(item, ["id"]);

								Object.entries(queryObject).map(function (_ref38) {
									var _ref39 = (0, _slicedToArray3.default)(_ref38, 2),
									    field = _ref39[0],
									    value = _ref39[1];

									Query += field + "='" + value + "',";
								});
								return "UPDATE " + userId + "_" + getSchema.name + " SET " + Query.substr(0, Query.length - 1) + " WHERE id=" + id + "; ";
							}).map(function (queryString) {
								return (0, _mysql.query)(queryString);
							}));

						case 23:
							_context12.next = 28;
							break;

						case 25:
							_context12.prev = 25;
							_context12.t1 = _context12["catch"](20);
							throw new Error("MySQL error:Update error\n" + _context12.t1);

						case 28:
							_context12.prev = 28;
							_context12.next = 31;
							return Promise.all(deleteRows.map(function (id) {
								return "DELETE FROM " + userId + "_" + getSchema.name + " WHERE id=" + id + "; ";
							}).map(function (queryString) {
								return (0, _mysql.query)(queryString);
							}));

						case 31:
							_context12.next = 36;
							break;

						case 33:
							_context12.prev = 33;
							_context12.t2 = _context12["catch"](28);
							throw new Error("MySQL error:Delete error\n" + _context12.t2);

						case 36:
							_context12.prev = 36;
							_context12.next = 39;
							return Promise.all([(0, _mysql.query)("show full columns from " + userId + "_" + getSchema.name + ";"), (0, _mysql.query)("SELECT * FROM " + userId + "_" + getSchema.name + ";"), (0, _mysql.query)("SELECT id FROM " + userId + "_" + getSchema.name + " ORDER BY id DESC LIMIT 1;")]);

						case 39:
							_ref40 = _context12.sent;
							_ref41 = (0, _slicedToArray3.default)(_ref40, 3);
							fieldQuery = _ref41[0];
							rows = _ref41[1];
							_ref41$ = (0, _slicedToArray3.default)(_ref41[2], 1);
							firstItem = _ref41$[0];
							fields = fieldQuery.map(function (item) {
								return item.Field;
							});
							nextId = 1;

							if (firstItem) {
								nextId = firstItem.id;
							}
							prisma.mutation.updateUserSchema({
								data: {
									rowCount: rows.length
								},
								where: { id: schemaId }
							});
							return _context12.abrupt("return", {
								fields: fields,
								rows: rows,
								nextId: nextId
							});

						case 52:
							_context12.prev = 52;
							_context12.t3 = _context12["catch"](36);
							throw new Error("MySQL error:Select error\n" + _context12.t3);

						case 55:
						case "end":
							return _context12.stop();
					}
				}
			}, _callee12, this, [[12, 17], [20, 25], [28, 33], [36, 52]]);
		}));

		function UpdateUserSchemaInfo(_x40, _x41, _x42, _x43) {
			return _ref37.apply(this, arguments);
		}

		return UpdateUserSchemaInfo;
	}(),
	uploadForSearch: function () {
		var _ref44 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee13(parent, _ref42, _ref43, info) {
			var _ref42$data = _ref42.data,
			    title = _ref42$data.title,
			    author = _ref42$data.author,
			    belong = _ref42$data.belong,
			    publishedyear = _ref42$data.publishedyear,
			    file = _ref42$data.file;
			var prisma = _ref43.prisma,
			    request = _ref43.request,
			    elastic = _ref43.elastic;

			var header, token, _jwt$decode6, userId, _ref45, path, copyPath, uploadPath, pythonResult, jsonPath, PaperId, result, bulkData, json;

			return _regenerator2.default.wrap(function _callee13$(_context13) {
				while (1) {
					switch (_context13.prev = _context13.next) {
						case 0:
							header = request.headers.authorization;

							if (header) {
								_context13.next = 3;
								break;
							}

							throw new Error("Authentication Needed");

						case 3:
							token = header.replace("Bearer ", "");
							_jwt$decode6 = _jsonwebtoken2.default.decode(token, process.env["REMODY_SECRET"]), userId = _jwt$decode6.userId;
							_context13.next = 7;
							return processUpload(file, userId);

						case 7:
							_ref45 = _context13.sent;
							path = _ref45.path;
							copyPath = path.substr(0, path.indexOf(".pdf")) + "_copyed.pdf";

							_fs2.default.copyFileSync(path, copyPath);

							uploadPath = "/home/ubuntu/app/remody-server" + "/" + copyPath;
							_context13.next = 14;
							return (0, _python.pythonShell)("elastic.py", [uploadPath, title, author, belong, publishedyear]);

						case 14:
							pythonResult = _context13.sent;

							if (!(pythonResult[0] === "NO")) {
								_context13.next = 17;
								break;
							}

							throw new Error("File size is so big");

						case 17:
							jsonPath = pythonResult[0];
							PaperId = void 0;
							_context13.prev = 19;
							_context13.next = 22;
							return prisma.mutation.createPaper({
								data: {
									title: title,
									author: author,
									belong: belong,
									publishedyear: publishedyear,
									url: path,
									owner: { connect: { id: userId } }
								}
							}, "{ id }");

						case 22:
							result = _context13.sent;

							PaperId = result.id;
							_context13.next = 29;
							break;

						case 26:
							_context13.prev = 26;
							_context13.t0 = _context13["catch"](19);
							throw new Error("PrismaError:\n" + _context13.t0);

						case 29:
							bulkData = _fs2.default.readFileSync(jsonPath);

							_fs2.default.unlinkSync(jsonPath);
							json = JSON.parse(bulkData.toString());
							_context13.prev = 32;
							_context13.next = 35;
							return elastic.create({
								index: "paper",
								type: "metadata",
								id: PaperId,
								body: json
							});

						case 35:
							_context13.next = 40;
							break;

						case 37:
							_context13.prev = 37;
							_context13.t1 = _context13["catch"](32);
							throw new Error(_context13.t1);

						case 40:
							return _context13.abrupt("return", true);

						case 41:
						case "end":
							return _context13.stop();
					}
				}
			}, _callee13, this, [[19, 26], [32, 37]]);
		}));

		function uploadForSearch(_x44, _x45, _x46, _x47) {
			return _ref44.apply(this, arguments);
		}

		return uploadForSearch;
	}(),
	deleteUserSchema: function () {
		var _ref48 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee14(parent, _ref46, _ref47, info) {
			var schemaId = _ref46.id;
			var prisma = _ref47.prisma,
			    request = _ref47.request;

			var header, token, _jwt$decode7, userId, getSchema;

			return _regenerator2.default.wrap(function _callee14$(_context14) {
				while (1) {
					switch (_context14.prev = _context14.next) {
						case 0:
							header = request.headers.authorization;
							token = header.replace("Bearer ", "");

							if (header) {
								_context14.next = 4;
								break;
							}

							throw new Error("Authentication Needed");

						case 4:
							_jwt$decode7 = _jsonwebtoken2.default.decode(token, process.env["REMODY_SECRET"]), userId = _jwt$decode7.userId;
							_context14.next = 7;
							return prisma.query.userSchema({
								where: { id: schemaId }
							}, "{ id name user { id } }");

						case 7:
							getSchema = _context14.sent;

							if (getSchema) {
								_context14.next = 10;
								break;
							}

							throw new Error("No UserSchema found");

						case 10:
							if (!(getSchema.user.id !== userId)) {
								_context14.next = 12;
								break;
							}

							throw new Error("You can't get Schema Info");

						case 12:
							_context14.next = 14;
							return (0, _mysql.query)("DROP TABLE " + userId + "_" + getSchema.name + ";");

						case 14:
							_context14.next = 16;
							return prisma.mutation.deleteUserSchema({ where: { id: schemaId } });

						case 16:
							return _context14.abrupt("return", true);

						case 17:
						case "end":
							return _context14.stop();
					}
				}
			}, _callee14, this);
		}));

		function deleteUserSchema(_x48, _x49, _x50, _x51) {
			return _ref48.apply(this, arguments);
		}

		return deleteUserSchema;
	}()
};

exports.default = Mutation;