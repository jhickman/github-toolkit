require.config({
  baseUrl: chrome.extension.getURL("/"),
  paths: {
    jquery: 'lib/jquery-3.2.1.min',
    backbone: 'lib/backbone-min',
    underscore: 'lib/underscore-min',
    text: 'lib/text'
  },
  shim: {
    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    'underscore': {
      exports: '_'
    }
  }
});

require(
  ["app/App"],
  function(App) {
    new App().render();
  }
);
