/*
 * Tiled Content Container ##VERSION##
 *
 * Date: ##DATE##
 */

(function ($, undefined) {

  $.widget('neo.tiled', {
    options: {
      columns: {},
      colWidth: 228,
      template: '<div></div>'
    },
    // whether the containing element was
    // position: relative in the first place
    rel: false,

    elements: [],

    width: 0,

    heights: [],

    margin: 0,

    _create: function () {
      var self = this,
        o_elem = self.element,
        o_opt = self.options,
        position = o_elem.css('position');
      self.width = o_elem.width();
      // save the previous state of position to be
      // able to restore it to its initial value
      self.rel = 'relative' == position ? true : position;
      // ensure relative positioning
      if (true !== self.rel) {
        o_elem.css('position', 'relative');
      }
      // data object passed
      if (typeof o_opt.src == 'object') {
        $.each(o_opt.src, function (index, elem) {
          elem['key'] = index;
          self.elements.push(elem);
        });

        self._init();
      }
      // url passed
      else if (typeof o_opt.src == 'string') {
        $.ajax({
          url: o_opt.src,
          success: function (data) {
            $.each(data, function (index, elem) {
              elem['key'] = index;
              self.elements.push(elem);
            });

            self._init();
          }
        });
      }
      // other data source implementations go here…
      else {
        self.destroy();
      }
    },

    _init: function () {
      var self = this,
        o_elem = this.element;

      self._render();

      // bind to window resize
      $(window).bind('resize.tiled', function () {
        var containerWidth = o_elem.width();
        if (self.width != containerWidth) {
          self.width = containerWidth;

          self.reflow();
        }
      });
    },

    _calcColumns: function () {
      var self = this,
        columnCount = (function (context) {
          var count = 0,
            map = context.options.columns;

          for (var width in map) {
            if (width <= context.width && count < map[width]) {
              count = map[width];
            }
          }

          return count;
        })(self);

      self.margin = Math.floor((self.width - (columnCount * self.options.colWidth)) / (columnCount - 1));
      self.colHeights = [];

      for (var i = 0; i < columnCount; i++) {
        self.colHeights[i] = 0;
      }
    },

    _render: function () {
      var self = this,
        o_elem = self.element,
        o_pool = $('<div>').css({
          visibility: 'hidden'
        }).appendTo(o_elem);

      self._calcColumns();

      $.each(self.elements, function (i, elem) {
        var templating = self.options.template,
          column = i % self.colHeights.length,
          rendering,
          height,
          renderingImage;

        for (var key in elem) {
          templating = templating.replace(new RegExp('{' + key + '}', 'gi'), elem[key]);
        }
        // convert template to jQuery object
        rendering = $(templating);
        // find any images within
        renderingImage = rendering.find('img');
        // if there are images render content async
        if (renderingImage.length) {
          renderingImage.load(function () {
            var renderingHeight = rendering.outerHeight();
            rendering.detach();

            rendering.css({
              position: 'absolute',
              top: self.colHeights[column] + self.margin,
              left: (column * self.options.colWidth) + (column * self.margin)
            });

            self.colHeights[column] = self.colHeights[column] + self.margin + renderingHeight;

            o_elem.append(rendering);

            self._fixHeight();
          });

          rendering.appendTo(o_pool);
        }
      });
    },

    _fixHeight: function () {
      var max = Math.max.apply(Math, this.colHeights);
      this.element.height(max);
    },

    reflow: function () {
      this.element.empty();
      this._render();
    },

    destroy: function () {
      var self = this;
      self.element.empty();

      if (true !== self.rel) {
        self.element.css('position', self.rel);
      }

      $(window).unbind('resize.tiled');

      $.Widget.prototype.destroy.call(this);
    }

  });
})(jQuery);
