module.exports = function(config) {
  'use strict';

  return {
    on_start: ['<%= destDir %>', '<%= tempDir %>', '<%= windowsDestDir %>'],
    windows: ['<%= windowsDestDir %>'],
    release: ['<%= destDir %>', '<%= tempDir %>', '<%= genDir %>', '<%= windowsDestDir %>'],
    build: ['<%= srcDir %>/build'],
    temp: ['<%= tempDir %>'],
    packaging: [
    ],
  };
};
