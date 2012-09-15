#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var uglifyjs = require('uglify-js');
var parser = uglifyjs.parser;
var uglify = uglifyjs.uglify;

var minify = function(code){
	var ast = parser.parse(code);
	ast = uglify.ast_mangle(ast);
	ast = uglify.ast_squeeze(ast);
	return uglify.gen_code(ast);
}

fs.readFile('scripts.json', function(e, data){
	if (e) throw e;
	data = JSON.parse(data);
	for (var k in data){
		var d = data[k],
			input = d.input,
			output = d.output;
		var codes = '';
		if (typeof input == 'string'){
			var code = fs.readFileSync(input, 'ascii');
			codes = minify(code);
		} else {
			d.input.forEach(function(file){
				var code = fs.readFileSync(file, 'ascii');
				codes += '// ' + path.basename(file) + '\n'
					+ minify(code) + ';\n';
			});
		}
		fs.writeFileSync(output, codes.replace(/\n$/, ''));
		console.log(output + ' created.');
	}
});