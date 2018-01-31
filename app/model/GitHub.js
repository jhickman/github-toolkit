define(
  ['backbone'],
  function(Backbone) {

    /**
     * A model representing a github page.
     */
    var PageModel = Backbone.Model.extend({
      initialize: function() {
        var _self = this;

        // listen for changes in URL from background
        chrome.runtime.onMessage.addListener(
          function(request, sender, sendResponse) {
            _self.set({
              url: request.url
            });
          }
        );

        this.on("change:url", this.updateUrl);

        // set initial value and kick off update
        this.set({
          url: window.location.href
        });
      },

      updateUrl: function() {
        var url = this.get("url");
        var urlParts = url.match(/github\.com\/([^/]*)\/([^/]*)\/?(.*)$/);

        this.set({
          organization: urlParts[1],
          repository: urlParts[2]
        });

        if (urlParts[3]) {
          var actions = urlParts[3].split(/\//);
          console.log("actions", actions);
          var pageId = 0;

          switch (actions[0]) {
            case "pulls":
              // pull request list
              pageId = PageModel.PAGE_PULL_REQUEST_LIST;
              break;
            case "pull":
              // it's a pull request
              switch (actions[3] || 0) {
                case "commits":
                  pageId = PageModel.PAGE_PULL_REQUEST_COMMITS;
                  break;
                case "files":
                  pageId = PageModel.PAGE_PULL_REQUEST_FILES;
                  break;
                default:
                  pageId = PageModel.PAGE_PULL_REQUEST_CONVERSATION;
              }
              this.set({
                pullRequestNumber: actions[2]
              });
              break;

            case "project":
              pageId = PageModel.PAGE_PROJECTS;
              break;
            default:
          }

          this.set({
            id: pageId
          });
        }
      }
    });

    // statics
    var index = 1;
    PageModel.PAGE_PULL_REQUEST_LIST = index++;
    PageModel.PAGE_PULL_REQUEST_CONVERSATION = index++;
    PageModel.PAGE_PULL_REQUEST_COMMITS = index++;
    PageModel.PAGE_PULL_REQUEST_FILES = index++;
    PageModel.PAGE_PROJECTS = index++;


    // add global reference
    window.com.jhickman.PageModel = PageModel;

    /**
     * The model that represents GitHub itself.
     *
     * <p>Provides API access as well as meta data.
     */
    var GitHubModel = Backbone.Model.extend({
      initialize: function() {
        this.set({
          page: new PageModel()
        });

        console.log("page data", this.getPage().toJSON());
      },

      getPage: function() {
        return this.get("page");
      }
    });

    return GitHubModel;
  }
);
