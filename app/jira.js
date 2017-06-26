define(
  ['jquery'],
  function($) {
    var JiraModule = {
      initialize: function(options) {
        this.options = options;

        if (options.baseUrl == "") {
          console.error("Jira URL not configured");
          return;
        }

        //Check login
        var loginResult = $.ajax(options.baseUrl + '/rest/auth/1/session', {
          async: false
        }).responseJSON;
        if (loginResult.name == undefined) {
          console.error('You are not logged in to Jira at ' + options.baseUrl + ' - Please login.');
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

      },

      checkPage: function() {
        var _self = this;
        var url = window.location.href;
        if (url.match(/github\.com\/(.*)\/(.*)\/pull\//) != null) {
          setTimeout(function() {
            _self.handlePrPage()
          }, 200);
        }
      },

      handlePrPage: function() {
        var _self = this;
        var title = $("h1 > span.js-issue-title").html();
        if (title == undefined || $('a[data-container-id="jira_bucket"]').length > 0) {
          //If we didn't find a ticket, or the data is already inserted, cancel.
          return false;
        }

        var ticketNumber = title.match(/([A-Z]+-[0-9]+)/)[0];
        var ticketUrl = this.options.baseUrl + '/browse/' + ticketNumber;

        //Replace title with clickable link to jira ticket
        $("h1 > span.js-issue-title").html(
          title.replace(
            /([A-Z]+-[0-9]+)/,
            '<a href="' + ticketUrl + '" target="_blank" alt="Ticket in Jira">' + ticketNumber + '</a>'
          )
        );


        //Add another tab for directly viewing the ticket information
        $('div.tabnav.tabnav-pr nav.tabnav-tabs').append(
          '<a href="' + ticketUrl + '" data-container-id="jira_bucket" data-tab="jira" class="tabnav-tab js-pull-request-tab">' +
          '<svg class="octicon octicon-credit-card" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M12 9H2V8h10v1zm4-6v9c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h14c.55 0 1 .45 1 1zm-1 3H1v6h14V6zm0-3H1v1h14V3zm-9 7H2v1h4v-1z"></path></svg> Jira ' +
          '<span id="files_tab_counter" class="counter">(' +
          ticketNumber +
          ')</span>' +
          '</a>'
        );


        $('div.issues-listing').append(
          '<div id="jira_bucket" class="jira-bucket tab-content pull-request-tab-content"></div>'
        );

        // Tab click handle
        $('a[data-tab="jira"]').on('click', function() {
          $('nav.tabnav-tabs a').removeClass('selected');
          $(this).addClass('selected');
          $('div.pull-request-tab-content').removeClass('is-visible');
          $('div#jira_bucket').addClass('is-visible');
          return false;
        });

        //Load up data from jira
        $.ajax({
          url: _self.options.baseUrl + "/rest/api/latest/issue/" + ticketNumber,
          dataType: "json",
          success: function(result) {

            var assignee = result.fields.assignee;
            var reporter = result.fields.reporter;
            var assigneeImage = $.ajax(assignee.self, {
              async: false
            }).responseJSON.avatarUrls['48x48'];
            var reporterImage = $.ajax(reporter.self, {
              async: false
            }).responseJSON.avatarUrls['48x48'];

            var summaryText = '' +
              '<div class="discussion-timeline comment previewable-edit js-comment js-task-list-container timeline-comment js-reorderable-task-lists reorderable-task-lists" style="margin-bottom: 30px;">' +
              '<div class="timeline-comment-header"><h3 class="timeline-comment-header-text f5 text-normal"><strong>Summary: </strong>' + result.fields.summary + '</h3></div>' +
              '</div>'

            var descriptionText = '' +
              '<div class="discussion-timeline comment previewable-edit js-comment js-task-list-container timeline-comment js-reorderable-task-lists reorderable-task-lists" style="margin-bottom: 30px;">' +
              '<div class="timeline-comment-header"><h3 class="timeline-comment-header-text f5 text-normal">Description</h3></div>' +
              '<div class="edit-comment-hide"><div class="comment-body">' + result.fields.description.replace(/\r?\n/g, '<br />') + '</div></div>' +
              '</div>'

            var commentsText = '';

            for (i in result.fields.comment.comments) {
              var comment = result.fields.comment.comments[i];

              var commentText =
                '<div class="discussion-timeline pull-discussion-timeline js-quote-selection-container ">' +
                '<div class="js-discussion js-socket-channel">' +
                '<div class="timeline-comment-wrapper js-comment-container">' +
                '<a href="#"><img alt="' + comment.author.displayName + '" class="timeline-comment-avatar" height="48" src="' + comment.author.avatarUrls['48x48'] + '" width="48"></a>' +
                '<div class="comment previewable-edit timeline-comment js-comment js-task-list-container">' +
                '<div class="timeline-comment-header ">' +
                '<div class="timeline-comment-header-text">' +
                '<strong><a href="#" class="author">' + comment.author.displayName + '</a></strong>' +
                ' added a comment - ' +
                '<a href="#" class="timestamp">' +
                '<time datetime="' + comment.created + '" is="relative-time" title="' + comment.created + '">' + comment.created + '</time>' +
                '</a>' +
                '</div>' +
                '</div>' +
                '<div class="edit-comment-hide"><table class="d-block">' +
                '<tbody class="d-block">' +
                '<tr class="d-block">' +
                '<td class="d-block comment-body markdown-body  js-comment-body">' +
                '<p>' + comment.body + '</p>' +
                '</td>' +
                '</tr>' +
                '</tbody>' +
                '</table>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';



              commentsText += commentText;
            }

            var jiraTabBody =
              '<div class="discussion-sidebar">' +
              '<div class="js-socket-channel js-updatable-content">' +
              '<div class="discussion-sidebar-item sidebar-assignee js-discussion-sidebar-item position-relative">' +
              '<div class="select-menu js-menu-container js-select-menu js-review-requests-menu" style="margin-bottom:10px;"><strong>Assignee<strong></div>' +
              '<span class="css-truncate">' +
              '<p>' +
              '<img alt="@' + assignee.name + '" class="avatar" height="20" src="' + assignee.avatarUrls["24x24"] + '" width="20">' +
              '<span style="margin-left:10px;" class="assignee css-truncate-target">' + assignee.displayName + '</span>' +
              '</p>' +
              '</span>' +
              '<div class="select-menu js-menu-container js-select-menu js-review-requests-menu" style="margin-bottom:10px;"><strong>Reporter<strong></div>' +
              '<span class="css-truncate">' +
              '<p>' +
              '<img alt="@' + reporter.name + '" class="avatar" height="20" src="' + reporter.avatarUrls["24x24"] + '" width="20">' +
              '<span style="margin-left:10px;" class="assignee css-truncate-target">' + reporter.displayName + '</span>' +
              '</p>' +
              '</span>' +
              '</div>' +
              '</div>' +
              '</div>' +
              '<div class="discussion-timeline comment previewable-edit js-comment js-task-list-container timeline-comment js-reorderable-task-lists reorderable-task-lists" style="margin-bottom: 30px;">' +
              '</div>' +
              summaryText + descriptionText + commentsText;


            $("div#jira_bucket").html(jiraTabBody);
            //summaryText + descriptionText + commentsText
            //);
          }
        });
      }
    };

    return JiraModule;
  }
);
