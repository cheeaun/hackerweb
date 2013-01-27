#!/usr/bin/env node

var fs = require('fs');
var hogan = require('hogan.js');
var uglifyjs = require('uglify-js');

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
	var finalCode = uglifyjs.minify(code, {
		fromString: true,
		compress: {
			sequences: false
		}
	}).code;
	fs.writeFile('js/templates.js', finalCode, function(){
		console.log('js/templates.js created.');
	});
});