#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var uglifyjs = require('uglify-js');

fs.readFile('scripts.json', function(e, data){
	if (e) throw e;
	data = JSON.parse(data);
	for (var k in data){
		var d = data[k],
			input = d.input,
			output = d.output;
		var codes = '';
		if (typeof input == 'string'){
			var code = uglifyjs.minify(input).code;
		} else {
			d.input.forEach(function(file){
				var code = uglifyjs.minify(file).code;
				if (!/;$/.test(code)) code += ';';
				codes += '// ' + path.basename(file) + '\n'
					+ code + '\n';
			});
		}
		fs.writeFileSync(output, codes.replace(/\n$/, ''));
		console.log(output + ' created.');
	}
});