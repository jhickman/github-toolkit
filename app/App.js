define(
  ["backbone", "app/model/GitHub", "app/General"],
  function(Backbone, GitHub, General) {
    var View = Backbone.View.extend({
      initialize: function() {},

      render: function() {
        chrome.storage.sync.get({
          issueTracking: "",
          taskTracking: {
            jira: {
              baseUrl: ''
            }
          },
          prFileCollapse: false
        }, function(items) {

          // general functionality that isn't toggled
          new General().render();

          if (items.issueTracking != "") {
            // initialize issue Tracking
            require(
              ["app/" + items.issueTracking],
              function(IssueModule) {
                var module = new IssueModule(items.taskTracking[items.issueTracking]);
                module.render();
              }
            );
          }
        });
        return this;
      }
    });

    return View;
  }
);
