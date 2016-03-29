module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			web: {
				options: {
					sourceMap: 'js/hw-web.min.js.map',
					maxLineLen: 500,
					screwIE8: true
				},
				files: {
					'js/hw-web.min.js': [
						'assets/js/libs/ruto.js',
						'assets/js/libs/amplify.store.js',
						'assets/js/libs/hogan.js',
						'assets/js/libs/hnapi.js',
						'assets/js/libs/ibento.js',
						'assets/js/templates.js',
						'assets/js/hw.js',
						'assets/js/hw-web.js'
					]
				}
			},
			ios: {
				options: {
					sourceMap: 'js/hw-ios.min.js.map',
					maxLineLen: 500,
					screwIE8: true
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
			},
			ios2: {
				options: {
					sourceMap: 'js/hw-ios-2.min.js.map',
					maxLineLen: 500,
					screwIE8: true
				},
				files: {
					'js/hw-ios-2.min.js': [
						'assets/js/libs/ruto.js',
						'assets/js/libs/amplify.store.js',
						'assets/js/libs/hogan.js',
						'assets/js/libs/hnapi.js',
						'assets/js/libs/tappable.js',
						'assets/js/libs/tween.js',
						'assets/js/libs/requestanimationframe.js',
						'assets/js/templates.js',
						'assets/js/hw.js',
						'assets/js/hw-ios-2.js'
					]
				}
			}
		},
		cssmin: {
			target: {
				files: [{
					expand: true,
					cwd: 'assets/css',
					src: ['*.css', '!*.min.css'],
					dest: 'assets/css',
					ext: '.min.css'
				}]
			}
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
					'assets/js/*.js',
					'Gruntfile.js'
				],
				tasks: ['uglify']
			},
			css: {
				files: [
					'assets/css/*.css',
					'!assets/css/*.min.css'
				],
				tasks: ['cssmin']
			},
			templates: {
				files: 'assets/templates/*.mustache',
				tasks: ['templates']
			}
		},
		embedImage: {
			all: [
				'assets/css/*.css'
			]
		},
		connect: {
			server: {
				options: {
					keepalive: true,
					hostname: '*',
					debug: true
				}
			}
		},
		concurrent: {
			server: {
				tasks: ['watch', 'connect'],
				options: {
					logConcurrentOutput: true
				}
			}
		}
	});

	grunt.loadTasks('tasks');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	// Configurable port number
	var port = grunt.option('port');
	if (port) grunt.config('connect.server.options.port', port);
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.registerTask('server', 'concurrent:server');
};
