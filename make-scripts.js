#!/usr/bin/env node

var fs = require('fs');
var uglifyjs = require('uglify-js');
var parser = uglifyjs.parser;
var uglify = uglifyjs.uglify;

fs.readdir('js', function(e, files){
	if (e) throw e;
	var code = '';
	files.forEach(function(file){
		if (/\.js$/i.test(file)){
			code += fs.readFileSync('js/' + file, 'ascii');
		}
	});
	
	var ast = parser.parse(code);
	ast = uglify.ast_mangle(ast);
	ast = uglify.ast_squeeze(ast);
	var finalCode = uglify.gen_code(ast);
	fs.writeFile('scripts.js', finalCode, function(){
		console.log('scripts.js created.');
	});
});