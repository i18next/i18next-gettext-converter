module.exports = function (grunt) {

	grunt.loadNpmTasks('grunt-mocha-test');

	grunt.initConfig({
		mochaTest: {
			test: {
				options: {
					globals: ['chai'],
					timeout: 100,
					ignoreLeaks: false,
					ui: 'bdd',
					reporter: 'spec',
					bail: true
				},
				src: ['test/**/*.js']
			}
		}
	});
};