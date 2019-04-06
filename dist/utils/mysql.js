"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
var query = exports.query = function query(pool, queryString) {
	return new Promise(function (resolve, reject) {
		pool.query(queryString, function (error, results, fields) {
			if (error) reject(error);
			resolve(results);
		});
	});
};