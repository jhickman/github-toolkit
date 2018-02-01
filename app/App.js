define(
  ['backbone', 'app/model/GitHub', 'app/General', 'app/timeline/Timeline'],
  function(Backbone, GitHubModel, General, Timeline) {
    var View = Backbone.View.extend({
      initialize: function() {},

      render: function() {
        var _self = this;
        chrome.storage.sync.get({
          authToken: '',
          issueTracking: '',
          taskTracking: {
            jira: {
              baseUrl: '',
            },
          },
          prFileCollapse: false,
        }, function(items) {
          _self.github = new GitHubModel({
            authToken: items.authToken,
          });

          // general functionality that isn't toggled
          new General().render();
          new Timeline({
            github: _self.github,
          }).render();

          if (items.issueTracking != '') {
            // initialize issue Tracking
            require(
              ['app/' + items.issueTracking],
              function(IssueModule) {
                var module = new IssueModule(items.taskTracking[
                  items.issueTracking]);
                module.render();
              }
            );
          }
        });
        return this;
      },
    });

    return View;
  }
);
