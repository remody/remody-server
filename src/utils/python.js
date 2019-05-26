import { PythonShell } from "python-shell";

export const pythonShell = function(filename, args) {
	const options = {
		mode: "text",
		pythonPath: "",
		pythonOptions: ["-u"],
		scriptPath: `${__dirname}/../python`,
		args
	};
	return new Promise(function(resolve, reject) {
		PythonShell.run(filename, options, function(err, results) {
			if (err) reject(err);
			resolve(results);
		});
	});
};
