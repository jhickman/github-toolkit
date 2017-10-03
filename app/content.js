require.config({
  baseUrl: chrome.extension.getURL("/"),
  paths: {
    jquery: 'lib/jquery-3.2.1.min',
    jqueryUi: 'lib/jquery-ui-1.12.1/jquery-ui.min',
    backbone: 'lib/backbone-min',
    underscore: 'lib/underscore-min',
    text: 'lib/text'
  },
  shim: {
    'backbone': {
      deps: ['underscore', 'jquery', 'jqueryUi'],
      exports: 'Backbone'
    },
    'underscore': {
      exports: '_'
    }
  }
});

function loadCss(url) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.getElementsByTagName("head")[0].appendChild(link);
}

require(
  ["app/App"],
  function(App) {
    loadCss(chrome.extension.getURL("/lib/jquery-ui-1.12.1/jquery-ui.min.css"));
    loadCss(chrome.extension.getURL("/app/app.css"));
    new App().render();
  }
);
