import mysql from "mysql";

const pool = mysql.createPool({
	host: process.env.RDS_HOSTNAME,
	user: process.env.RDS_USERNAME,
	password: process.env.RDS_PASSWORD,
	port: process.env.RDS_PORT,
	database: process.env.RDS_MAINDB
});

export const query = function(queryString) {
	return new Promise(function(resolve, reject) {
		pool.query(queryString, function(error, results, fields) {
			if (error) reject(error);
			resolve(results);
		});
	});
};
