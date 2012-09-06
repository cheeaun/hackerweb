#!/usr/bin/env node

var fs = require('fs');
var uglifyjs = require('uglify-js');
var parser = uglifyjs.parser;
var uglify = uglifyjs.uglify;

var minify = function(code){
	var ast = parser.parse(code);
	ast = uglify.ast_mangle(ast);
	ast = uglify.ast_squeeze(ast);
	return uglify.gen_code(ast);
}

fs.readdir('js', function(e, files){
	if (e) throw e;
	var codes = '';
	files.forEach(function(file){
		if (/\.js$/i.test(file)){
			var code = fs.readFileSync('js/' + file, 'ascii');
			codes += '// ' + file + '\n'
				+ minify(code) + ';\n';
		}
	});
	
	fs.writeFile('scripts.js', codes.replace(/\n$/, ''), function(){
		console.log('scripts.js created.');
	});
});