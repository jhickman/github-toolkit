define(
  ['backbone',
    'text!app/jira/jiraTab.html',
    'text!app/jira/jiraTabView.html',
    'text!app/jira/jiraTabSummary.html',
  ],
  function(Backbone, JiraTabTemplate, JiraTabView, JiraTabSummary) {
    var View = Backbone.View.extend({

      template: _.template(JiraTabTemplate),

      initialize: function(options) {
        this.options = options;

        if (options.baseUrl == '') {
          // eslint-disable-next-line no-console
          console.error('Jira URL not configured');
          return;
        }

        // Check login
        var loginResult = $.ajax(options.baseUrl +
          '/rest/auth/1/session', {
            async: false,
          }).responseJSON;
        if (loginResult.name == undefined) {
          // eslint-disable-next-line no-console
          console.error('You are not logged in to Jira at ' + options.baseUrl +
            ' - Please login.');
          return;
        }

        // Check page if content changed (for AJAX pages)
        this.lastRefresh = (new Date()).getTime();
        var _self = this;
        $(document).on('DOMNodeInserted', function() {
          if ((new Date()).getTime() - _self.lastRefresh >= 250) {
            _self.lastRefresh = (new Date()).getTime();
            _self.checkPage();
          }
        });

        this.checkPage();

        this.initialized = true;
      },

      checkPage: function() {
        var _self = this;
        var url = window.location.href;
        if (url.match(/github\.com\/(.*)\/(.*)\/pull\//) != null) {
          setTimeout(function() {
            _self.handlePrPage();
          }, 200);
        } else if (url.match(/github\.com\/(.*)\/(.*)\/projects\//) !=
          null) {
          _self.handleProjectsPage();
        }
      },

      handlePrPage: function() {
        var _self = this;
        var title = $('h1 > span.js-issue-title').html();
        if (title == undefined ||
          $('a[data-container-id="jira_bucket"]').length > 0) {
          // If we didn't find a ticket, 
          // or the data is already inserted, cancel.
          return false;
        }

        var ticketNumber = title.match(/([A-Z]+-[0-9]+)/)[0];
        var ticketUrl = this.options.baseUrl + '/browse/' +
          ticketNumber;
        var prUrl = window.location.href.replace(/(\/pull\/[0-9]*).*/,
          '$1');
        /*
        var prNumber = $('meta[property=\'og:url\']')[0].content.replace(
          /^.*\/pull\/([0-9]+.*)/, '$1');
          */

        // Replace title with clickable link to jira ticket
        $('h1 > span.js-issue-title').html(
          title.replace(
            /([A-Z]+-[0-9]+)/,
            '<a href="' + ticketUrl +
            '" target="_blank" alt="Ticket in Jira">' + ticketNumber +
            '</a>'
          )
        );

        // let's go ahead and fetch the data asynchronously
        this._fetchData(ticketNumber);

        // Add another tab for directly viewing the ticket information
        $('div.tabnav.tabnav-pr nav.tabnav-tabs').append(_.template(
          JiraTabTemplate)({
          ticketNumber: ticketNumber,
          tabUrl: prUrl + '#jira',
        }));

        $('nav.tabnav-tabs a[class~="jira-tab"]').tooltip({
          items: '[class~="jira-tab"]',
          content: function() {
            return _self._getSummaryContent();
          },
        });


        // add a place to add the view
        $('div.issues-listing').append(
          '<div id="jira_bucket" ' +
          'class="jira-bucket tab-content pull-request-tab-content"></div>'
        );

        // if the URL has the #jira hash/bookmark, then display the tab
        if (window.location.hash.substring(1) == 'jira') {
          _self.displayJiraTab(ticketNumber);
        }

        // Tab click handle
        $('a[data-tab="jira"]').on('click', function() {
          _self.displayJiraTab(ticketNumber);
        });
      },

      /*
         for the projects page, let's create tooltips
         for cards.
       */
      handleProjectsPage: function() {
        var _self = this;
        //
        $('.project-columns-container').tooltip({
          items: '.issue-card a[class~="d-block"]',
          show: {
            delay: 1000,
          },
          content: function(callback) {
            var ticketNumber = this.text.match(/([A-Z]+-[0-9]+)/)[
              0];
            if (!ticketNumber) {
              // no ticket number.  no tooltip
              return;
            }

            var cacheName = 'fetchData_' + ticketNumber;

            if (_self[cacheName]) {
              callback(_self._getSummaryContent(cacheName));
            } else {
              _self._fetchData(ticketNumber, function(data) {
                callback(_self._getSummaryContent(cacheName));
              }, 'fetchData_' + ticketNumber);
            }
          },
        });
      },

      displayJiraTab: function(ticketNumber) {
        var _self = this;

        $('nav.tabnav-tabs a').removeClass('selected');
        $('nav.tabnav-tabs a.jira-tab').addClass('selected');
        $('div.pull-request-tab-content').removeClass('is-visible');
        $('div#jira_bucket').addClass('is-visible');


        if (this.fetchData) {
          this._showJira();
          return;
        }

        // Load up data from jira
        this._fetchData(ticketNumber, function() {
          _self._showJira();
        });
      },

      _fetchData: function(ticketNumber, callback, cacheName) {
        var _self = this;
        $.ajax({
          url: _self.options.baseUrl + '/rest/api/latest/issue/' +
            ticketNumber,
          dataType: 'json',
          success: function(result) {
            if (!cacheName) {
              cacheName = 'fetchData';
            }
            _self[cacheName] = result;
            if (callback) {
              callback(result);
            }
          },
        });
      },

      /**
       * Used to show the actual data.
       */
      _showJira: function() {
        var assignee = this.fetchData.fields.assignee;
        var reporter = this.fetchData.fields.reporter;
        var assigneeImage = $.ajax(assignee.self, {
          async: false,
        }).responseJSON.avatarUrls['48x48'];
        var reporterImage = $.ajax(reporter.self, {
          async: false,
        }).responseJSON.avatarUrls['48x48'];

        $('div#jira_bucket').html(_.template(JiraTabView)({
          result: this.fetchData,
          assigneeImage: assigneeImage,
          reporterImage: reporterImage,
        }));
      },

      _getSummaryContent: function(cacheName) {
        var _self = this;
        if (!cacheName) {
          cacheName = 'fetchData';
        }

        if (!this[cacheName]) {
          // eslint-disable-next-line no-console
          console.log('Ticket info not fetched');
          return;
        }
        return _.template(JiraTabSummary)({
          data: _self[cacheName],
        });
      },
    });

    return View;
  }
);
