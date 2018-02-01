define(
  ['backbone',
    'vis',
    'text!app/timeline/timelineTab.html',
    'text!app/timeline/timelineTabView.html',
    'text!app/timeline/timelineItem.html',
  ],
  function(Backbone, vis, TimelineTabTemplate, TimelineTabView,
    TimelineItemTemplate) {
    var View = Backbone.View.extend({
      template: _.template(TimelineTabTemplate),

      initialize: function(options) {
        this.github = options.github;
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
        }
      },

      handlePrPage: function() {
        if ($('a[data-container-id="timeline_bucket"]').length > 0) {
          // already added tab.
          return;
        }

        var prUrl = window.location.href.replace(/(\/pull\/[0-9]*).*/,
          '$1');

        $('div.tabnav.tabnav-pr nav.tabnav-tabs')
          .append(_.template(TimelineTabTemplate)({
            tabUrl: prUrl + '#timeline',
          }));

        // add a place to add the view
        $('div.issues-listing').append(
          '<div id="timeline_bucket" ' +
          'class="timeline-bucket tab-content pull-request-tab-content"></div>'
        );


        if (window.location.hash.substring(1) == 'timeline') {
          this.displayTimelineTab();
        }

        var _self = this;
        $('a[data-tab="timeline"]').on('click', function() {
          _self.displayTimelineTab();
        });
      },

      displayTimelineTab: function() {
        $('nav.tabnav-tabs a').removeClass('selected');
        $('nav.tabnav-tabs a.timeline-tab').addClass('selected');
        $('div.pull-request-tab-content').removeClass('is-visible');
        $('div#timeline_bucket').addClass('is-visible');

        $('div#timeline_bucket').html(_.template(TimelineTabView)({}));

        var container = document.getElementById('ghtk-timeline');

        this.github.getApi().eventTimeline(function(events) {
          // callback
          var items = [];
          var counter = 0;
          events.forEach(function(item) {
            var group = '';
            switch (item.get('event')) {
              // ones to skip
              case 'mentioned':
                return;

              case 'commented':
                item.set('title', 'Commented');
                break;
              case 'reviewed':
                item.set({
                  title: 'Reviewed',
                  actor: item.get('user'),
                  created_at: item.get('submitted_at'),
                });

                if (item.get('state') === 'dismissed') {
                  // because it was approved, but dismissed later
                  item.set('state', 'approved');
                }

                break;
              case 'committed':
                item.set('title', 'Committed');
                item.set({
                  'actor': {
                    login: item.get('author').name,
                  },
                  'created_at': item.get('author').date,
                });
                break;

              case 'added_to_project':
                item.set('title', 'Added');
                break;
              case 'moved_columns_in_project':
                item.set('title', 'Moved Columns');
                break;
              case 'review_dismissed':
                item.set('title', 'Dismissed Review');
                break;
              case 'labeled':
                item.set('title', 'Labeled');
                break;
              case 'unlabeled':
                item.set('title', 'Unlabled');
                break;
              case 'merged':
                item.set('title', 'Merged');
                break;
              case 'closed':
                item.set('title', 'Closed');
                break;
              case 'head_ref_deleted':
                item.set('title', 'Branch deleted');
                break;
              case 'referenced':
                item.set('title', 'Referenced');
                break;
              default:
                // eslint-disable-next-line no-console
                console.warn('found unknown event: ' + item.get(
                  'event'));
            }
            try {
              var content = _.template(TimelineItemTemplate)({
                item: item,
              });
            } catch (e) {
              // eslint-disable-next-line no-console
              console.warn('error in template:', e, item);
            }
            var newItem = {
              id: counter++,
              content: content,
              start: item.get('created_at'),
              className: 'ghtk_' + item.get('event'),
            };
            if (item.get('event') === 'reviewed') {
              newItem.className += '_' + item.get('state');
            }
            if (item.get('event') === 'labeled' ||
              item.get('event') === 'unlabeled') {
              //                newItem.
            }
            if (group) {
              newItem.group = group;
            }
            items.push(newItem);
          });

          var options = {
            orientation: 'both',
          };
          var dataset = new vis.DataSet(items);

          this.timeline = new vis.Timeline(container, dataset,
            options);
        });
      },
    });
    return View;
  }
);
