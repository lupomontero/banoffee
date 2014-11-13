/*global module:false*/

module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-shell');

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: [
        'Gruntfile.js',
        'index.js',
        'bin/**/*.js',
        'lib/**/*.js',
        'test/**/*.js'
      ]
    },

    shell: {
      test: {
        command: './node_modules/.bin/mocha test/*.spec.js'
      }
    }

  });

  // Default task.
  grunt.registerTask('default', [ 'jshint', 'test' ]);
  grunt.registerTask('test', [ 'shell:test' ]);

};
