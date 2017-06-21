
require.config({
  baseUrl: chrome.extension.getURL("/"),
  paths: {
    jquery : 'lib/jquery-3.2.1.min'
  }
});

require(
  ["app/App"],
  function (App) {
    App.run();
  }
);
