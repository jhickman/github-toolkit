// general functionality that isn't toggled via configuration
define(
  ['backbone'],
  function(Backbone) {
    var View = Backbone.View.extend({

      /**
       *  Initializes the General functionality
       */
      initialize: function() {
        var _self = this;

        // all of the below needs work

        this.localStoragePrefix = 'ghtk';
        this.useLocalStorage = true;
        this.defaultDuration = 200;
        this.collectUniquePageInfo();

        // add listener for extension button menu (popup)
        chrome.runtime.onConnect.addListener(function(adapter) {
          adapter.onMessage.addListener(function(msg) {
            if (msg.collapse !== undefined) {
              _self.toggleDiffs(msg.collapse, 'collapse');
            }
            if (msg.expand !== undefined) {
              _self.toggleDiffs(msg.expand, 'expand');
            }
            if (msg.goto !== undefined) {
              _self.getDiffElements(msg.goto)[0].scrollIntoViewIfNeeded();
            }
          });
        });
      },


      /*
       * Gets github information out of the page
       */
      collectUniquePageInfo: function() {
        this.repositoryAuthor = $('[itemprop="author"]').find('a').text();
        this.repositoryName = $('strong[itemprop="name"]').find('a').text();
        this.pullRequestNumber = $('.gh-header-number').text();
        this.commitHash = $('.sha.user-select-contain').text();
      },

      /*
       *  Toggles an individual diff for provided id
       */
      toggleDiff: function(id, duration, display) {
        var $a = $('a[name^=' + id + ']');
        duration = !isNaN(duration) ? duration : 200;
        if ($.inArray(display, ['expand', 'collapse', 'toggle']) < 0) {
          if (!this.useLocalStorage) {
            display = 'toggle';
          } else {
            display = (localStorage.getItem(this.getUniqueStorageId(id)) ===
              'collapse') ? 'expand' : 'collapse';
          }
        }

        if ($a) {
          var $span = $a.next('div[id^=diff-]');
          var $data = $span.children('.js-file-content');
          switch (display) {
            case 'toggle':
              $data.toggle(duration);
              return true;
            case 'expand':
              $data.slideDown(duration);
              return this.useLocalStorage ? localStorage.removeItem(
                this.getUniqueStorageId(id)) : true;
            default:
              $data.slideUp(duration);
              return this.useLocalStorage ?
                localStorage.setItem(this.getUniqueStorageId(id),
                  display) : true;
          }
        }
        return false;
      },

      /*
       * toggles all diffs for the provided path
       */
      toggleDiffs: function(path, display) {
        var _self = this;
        var ids = this.getIds(path);

        ids.each(function(index, id) {
          _self.toggleDiff(id, _self.defaultDuration, display);
        });
      },

      /*
       * Finds all elements holding diffs for given path
       */
      getDiffElements: function(path) {
        return $('.file-info .link-gray-dark').filter(function() {
          return this.innerHTML.trim().match(path);
        });
      },

      /*
       * Get IDs for path
       */
      getIds: function(path) {
        var $spans = this.getDiffElements(path).closest('[id^=diff-]');
        var $as = $spans.prev('a[name^=diff-]');
        var $ids = $as.map(function(index, a) {
          return $(a).attr('name');
        });

        return $ids;
      },

      /*
       * creates a unique ID for the provided ID intended for local storage ID
       */
      getUniqueStorageId: function(diffId) {
        var diffViewId = this.pullRequestNumber || this.commitHash;
        return this.localStoragePrefix + '|' + this.repositoryAuthor +
          '|' + this.repositoryName + '|' + diffViewId + '|' + diffId;
      },
    });
    return View;
  }
);
