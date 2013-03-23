module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			web: {
				options: {
					sourceMap: 'js/hw-web.min.js.map',
					sourceMappingURL: function(path){
						return path.replace(/^js\//i, '') + '.map';
					},
					sourceMapRoot: '../'
				},
				files: {
					'js/hw-web.min.js': [
						'assets/js/libs/ruto.js',
						'assets/js/libs/amplify.store.js',
						'assets/js/libs/hogan.js',
						'assets/js/libs/hnapi.js',
						'assets/js/libs/ibento.js',
						'assets/js/libs/classList.js',
						'assets/js/templates.js',
						'assets/js/hw.js',
						'assets/js/hw-web.js'
					]
				}
			},
			ios: {
				options: {
					sourceMap: 'js/hw-ios.min.js.map',
					sourceMappingURL: function(path){
						return path.replace(/^js\//i, '') + '.map';
					},
					sourceMapRoot: '../'
				},
				files: {
					'js/hw-ios.min.js': [
						'assets/js/libs/ruto.js',
						'assets/js/libs/amplify.store.js',
						'assets/js/libs/hogan.js',
						'assets/js/libs/hnapi.js',
						'assets/js/libs/tappable.js',
						'assets/js/libs/tween.js',
						'assets/js/libs/requestanimationframe.js',
						'assets/js/templates.js',
						'assets/js/hw.js',
						'assets/js/hw-web.js'
					]
				}
			}
		},
		jshint: {
			all: [
				'assets/js/libs/*.js',
				'assets/js/*.js'
			]
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');

};