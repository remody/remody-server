export const query = function(pool, queryString) {
	return new Promise(function(resolve, reject) {
		pool.query(queryString, function(error, results, fields) {
			if (error) reject(error);
			resolve(results);
		});
	});
};
