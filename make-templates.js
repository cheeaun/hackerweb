#!/usr/bin/env node

var fs = require('fs');
var hogan = require('hogan.js');
var uglifyjs = require('uglify-js');
var parser = uglifyjs.parser;
var uglify = uglifyjs.uglify;

fs.readdir('templates', function(e, files){
	if (e) throw e;

	var code = '(function(t){'
		+ 'TEMPLATES={';

	files.forEach(function(file){
		if (/\.mustache$/i.test(file)){
			var mustache = fs.readFileSync('templates/' + file, 'ascii');
			var key = file.match(/^([^.]+)\./i)[1];
			// Clean up some spaces
			mustache = mustache.replace(/[\r\n\t]+/g, '');
			code += "'" + key + "':new t(" + hogan.compile(mustache, {asString: true}) + "),";
		}
	});

	code += '}'
		+ '})(Hogan.Template);';

	// Uglify to further shrink the file size
	var ast = parser.parse(code);
	ast = uglify.ast_mangle(ast);
	ast = uglify.ast_squeeze(ast, {
		make_seqs: false // it somehow f'ed up the sequence for this piece of code
	});
	var finalCode = uglify.gen_code(ast);
	fs.writeFile('templates.js', finalCode, function(){
		console.log('templates.js created.');
	});
});