'use strict';

module.exports = function(grunt){

	grunt.registerMultiTask('bumpAppCache', 'Bump the AppCache version', function(){

		var options = this.options();
		var rVersion = options.rVersion;
		var format = options.format;
		if (!rVersion || !format){
			grunt.log.warn('No options set.');
			return;
		}

		var customVersion = grunt.option('custom');

		this.filesSrc.forEach(function(f){
			var file = grunt.file.read(f);
			var content = '';
			if (customVersion){
				grunt.log.writeln('Writing AppCache with custom version: ' + customVersion);
				content = file.replace(rVersion, function(match, version){
					return match.replace(version, customVersion);
				});
			} else {
				grunt.log.writeln('Writing AppCache with new version.');
				content = file.replace(rVersion, format);
			}

			if (file != content){
				grunt.file.write(f, content);
				grunt.log.writeln('File "' + f + '" modified with new version.');
			} else {
				grunt.log.writeln('File "' + f + '" not modified.');
			}
		});

	});

};