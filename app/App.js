define(
  [ "jquery" ],
  function($) {
    var App = {



      run: function() {
        chrome.storage.sync.get({
          issueTracking : "",
          taskTracking : {
            jira : {
              baseUrl : ''
            }
          },
          prFileCollapse : false
        }, function(items) {

          if (items.issueTracking != "") {
            // initialize issue Tracking
            require(
              ["app/" + items.issueTracking],
              function(issueModule) {
                issueModule.initialize(items.taskTracking[items.issueTracking]);
              }
            );
          }
        });
      }

    };
    return App;
  }
);
