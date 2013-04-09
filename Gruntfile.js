module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				report: 'min'
			},
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
						'assets/js/hw-ios.js'
					]
				}
			}
		},
		jshint: {
			all: [
				'assets/js/libs/*.js',
				'assets/js/*.js'
			]
		},
		templates: {
			all: {
				files: {
					'assets/js/templates.js': [
						'assets/templates/*.mustache'
					]
				}
			}
		},
		watch: {
			scripts: {
				files: [
					'assets/js/libs/*.js',
					'assets/js/*.js'
				],
				tasks: ['uglify']
			},
			templates: {
				files: 'assets/templates/*.mustache',
				tasks: ['templates']
			}
		},
		connect: {
			server: {
				options: {
					port: 80,
					keepalive: true,
					hostname: null,
					middleware: function(connect, options){
						var appcache = grunt.option('appcache');
						return [
							function(req, res, next){
								if (req.url == '/manifest.appcache' && !appcache){
									res.writeHead(404);
									res.end();
								} else {
									next();
								}
							},
							connect.static(options.base),
							connect.directory(options.base)
						];
					}
				}
			}
		},
		concurrent: {
			server: ['watch', 'connect']
		}
	});

	grunt.loadTasks('tasks');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-concurrent');

	// Configurable port number
	var port = grunt.option('port');
	if (port) grunt.config('connect.server.options.port', port);
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.registerTask('server', 'concurrent:server');

};