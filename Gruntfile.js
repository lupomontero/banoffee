/*global module:false*/

module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

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

    nodeunit: {
      files: [ 'test/*.spec.js' ]
    }

  });

  // Default task.
  grunt.registerTask('default', [ 'jshint', 'test' ]);
  grunt.registerTask('test', [ 'nodeunit' ]);

};
