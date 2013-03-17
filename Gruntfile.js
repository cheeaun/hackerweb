module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			web: {
				options: {
					sourceMap: 'js/scripts-web.js.map',
					sourceMappingURL: function(path){
						return path.replace(/^js\//i, '') + '.map';
					},
					sourceMapRoot: '../'
				},
				files: {
					'js/scripts-web.js': [
						'js/libs/ruto.js',
						'js/libs/amplify.store.js',
						'js/libs/hogan.js',
						'js/libs/hnapi.js',
						'js/libs/ibento.js',
						'js/libs/classList.js',
						'js/templates.js'
					]
				}
			},
			ios: {
				options: {
					sourceMap: 'js/scripts-ios.js.map',
					sourceMappingURL: function(path){
						return path.replace(/^js\//i, '') + '.map';
					},
					sourceMapRoot: '../'
				},
				files: {
					'js/scripts-ios.js': [
						'js/libs/ruto.js',
						'js/libs/amplify.store.js',
						'js/libs/hogan.js',
						'js/libs/hnapi.js',
						'js/libs/tappable.js',
						'js/libs/tween.js',
						'js/libs/requestanimationframe.js',
						'js/templates.js'
					]
				}
			}
		},
		jshint: {
			all: [
				'js/*.js',
				'js/libs/*.js'
			]
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');

};