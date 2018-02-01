define(['backbone'], function(Backbone) {
  /**
   * A model representing a github page.
   */
  var PageModel = Backbone.Model.extend({
    initialize: function() {
      var _self = this;

      // listen for changes in URL from background
      chrome
        .runtime
        .onMessage
        .addListener(function(request, sender, sendResponse) {
          _self.set({
            url: request.url,
          });
        });

      this.on('change:url', this.updateUrl);

      // set initial value and kick off update
      this.set({
        url: window.location.href,
      });
    },

    updateUrl: function() {
      var url = this.get('url').replace(/#.*$/, '');
      var urlParts = url.match(
        /github\.com\/([^/]*)\/([^/]*)\/?(.*)$/);

      this.set({
        organization: urlParts[1],
        repository: urlParts[2],
      });

      if (urlParts[3]) {
        var actions = urlParts[3].split(/\//);
        // eslint-disable-next-line no-console
        var pageId = 0;
        switch (actions[0]) {
          case 'pulls':
            // pull request list
            pageId = PageModel.PAGE_PULL_REQUEST_LIST;
            break;
          case 'pull':
            // it's a pull request
            switch (actions[2] || 0) {
              case 'commits':
                pageId = PageModel.PAGE_PULL_REQUEST_COMMITS;
                break;
              case 'files':
                pageId = PageModel.PAGE_PULL_REQUEST_FILES;
                break;
              default:
                pageId = PageModel.PAGE_PULL_REQUEST_CONVERSATION;
            }
            this.set({
              pullRequestNumber: actions[1],
            });
            break;

          case 'project':
            pageId = PageModel.PAGE_PROJECTS;
            break;
          default:
        }

        this.set({
          id: pageId,
        });
      }
    },
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
   * The github api.
   */
  var GitHubApi = Backbone.Model.extend({
    initialize: function(options) {
      this.set({
        page: options.page,
        baseUrl: 'https://api.github.com/repos/',
        authToken: options.authToken,
      });
    },

    timeline: function(callback) {
      // https://api.github.com/repos/{{owner}}/{{repo}}/issues/3217/timeline
      var url = this._url(
        'issues',
        this.get('page').get('pullRequestNumber'),
        'timeline'
      );
      $.ajax({
        url: url,
        headers: {
          // for the experimental stuff
          Accept: 'application/vnd.github.mockingbird-preview',
          Authorization: 'token ' + this.get('authToken'),
        },
        dataType: 'json',
        success: callback,
      });
    },

    events: function(callback) {
      // https://api.github.com/repos/{{owner}}/{{repo}}/issues/3217/events
      var url = this._url(
        'issues',
        this.get('page').get('pullRequestNumber'),
        'events'
      );

      $.ajax({
        url: url,
        headers: {
          Authorization: 'token ' + this.get('authToken'),
        },
        dataType: 'json',
        success: callback,
      });
    },

    eventTimeline: function(callback) {
      var _self = this;
      this.timeline(function(timelineResult) {
        _self.events(function(eventsResult) {
          var timelines = new Backbone.Collection(
            timelineResult);

          var events = new Backbone.Collection(
            eventsResult);

          timelines.forEach(function(timeline) {
            // compare what's in events
            if (!events.get(timeline.id)) {
              // doesn't exist in events.  add it
              events.add(timeline);
            }
          });

          callback(events);
        });
      });
    },

    _url: function() {
      var pageModel = this.get('page');
      var url = this.get('baseUrl') + pageModel.get('organization') +
        '/' + pageModel.get('repository') + '/';
      var argsArray = Array.prototype.slice.call(arguments);
      if (argsArray) {
        url += argsArray.join('/');
      }
      return url;
    },
  });

  /**
   * The model that represents GitHub itself.
   *
   * <p>Provides API access as well as meta data.
   */
  var GitHubModel = Backbone.Model.extend({
    initialize: function(options) {
      var pageModel = new PageModel();
      this.set({
        page: pageModel,
        api: new GitHubApi({
          authToken: options.authToken,
          page: pageModel,
        }),
        authToken: options.authToken,
      });
    },

    getPage: function() {
      return this.get('page');
    },

    getApi: function() {
      return this.get('api');
    },
  });

  // FIXME remove
  window.com.jhickman.GitHubModel = GitHubModel;

  return GitHubModel;
});
