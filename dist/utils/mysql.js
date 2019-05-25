"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.query = undefined;

var _mysql = require("mysql");

var _mysql2 = _interopRequireDefault(_mysql);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pool = _mysql2.default.createPool({
	host: process.env.RDS_HOSTNAME,
	user: process.env.RDS_USERNAME,
	password: process.env.RDS_PASSWORD,
	port: process.env.RDS_PORT,
	database: process.env.RDS_MAINDB
});

var query = exports.query = function query(queryString) {
	return new Promise(function (resolve, reject) {
		pool.query(queryString, function (error, results, fields) {
			if (error) reject(error);
			resolve(results);
		});
	});
};