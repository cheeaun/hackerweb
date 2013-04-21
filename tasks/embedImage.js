'use strict';

var path = require('path');
var mime = require('mime');

module.exports = function(grunt){

	grunt.registerMultiTask('embedImage', 'Embed images into CSS files', function(){

		var cache = {};

		this.filesSrc.forEach(function(f){
			var file = grunt.file.read(f);
			var filePath = path.dirname(f);
			var matched = false;

			var newFile = file.replace(/(url\()[^()]+(\)[^\/]+\/\*\s*embedImage:url\()([^()]+)/igm, function(match, s1, s2, image){
				matched = true;
				var data = cache[image];
				if (!data){
					var p = path.join(filePath, image);
					var f = grunt.file.read(p, {encoding: null});
					var type = mime.lookup(image);
					var data = 'data:' + type + ';base64,' + f.toString('base64');
					cache[image] = data;
					grunt.log.writeln('File "' + image + '" converted into data URI.');
				}
				return s1 + data + s2 + image;
			});

			if (matched){
				grunt.file.write(f, newFile);
				grunt.log.writeln('File "' + f + '" modified with embedded images.');
			} else {
				grunt.log.writeln('File "' + f + '" not modified.');
			}
		});

	});

};