require.config({
  baseUrl: chrome.runtime.getURL('/'),
  paths: {
    jquery: 'lib/jquery-3.2.1.min',
    jqueryUi: 'lib/jquery-ui-1.12.1/jquery-ui.min',
    backbone: 'lib/backbone-min',
    underscore: 'lib/underscore-min',
    vis: 'lib/vis.min',
    text: 'lib/text',
  },
  shim: {
    'backbone': {
      deps: ['underscore', 'jquery', 'jqueryUi'],
      exports: 'Backbone',
    },
    'underscore': {
      exports: '_',
    },
  },
});

// create namespace used for globals
window.com = window.com || {};
window.com.jhickman = window.com.jhickman || {};

/**
 * Loads CSS into the document.
 *
 * @param {string} url is the url of the css to load.
 */
function loadCss(url) {
  var link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = url;
  document.getElementsByTagName('head')[0].appendChild(link);
}

require(
  ['app/App'],
  function(App) {
    loadCss(chrome.runtime.getURL('/lib/jquery-ui-1.12.1/jquery-ui.min.css'));
    loadCss(chrome.runtime.getURL('/app/app.css'));
    loadCss(chrome.runtime.getURL('/lib/vis.min.css'));
    new App().render();
  }
);
