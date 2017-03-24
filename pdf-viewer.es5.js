'use strict';

Polymer({

  is: 'pdf-viewer',

  properties: {
    /**
     * url of the pdf file to display
     * @type {String}
     */
    src: {
      type: String,
      observer: '_srcChanged'
    },

    /**
     * The pqge number to display
     *
     * The first page is 1
     * @type {Number}
     */
    page: {
      type: Number,
      value: 1,
      observer: '_pageChanged',
      reflectToAttribute: true,
      notify: true
    },

    /**
     * total number of pqges in the document
     * @type {Number}
     */
    pages: {
      type: Number,
      readOnly: true,
      reflectToAttribute: true,
      notify: true
    },

    /**
     * the initial zoom when opening a document and
     * when the mode change
     *
     * the available values are :
     *  - `fit` : whole page,
     *  - `fit-width` : full width
     *
     * @type {String}
     */
    initialZoom: {
      type: String,
      value: "fit"
    },

    /**
     * The zoom ratio used
     * @type {Numder}
     */
    zoomRatio: {
      type: Number,
      value: 1.25
    },

    /**
     * The view mode of the document
     *
     * the available values are :
     *  - single : single page
     *  - double : double page side by side
     *
     * @type {String}
     */
    mode: {
      type: String,
      value: "single",
      observer: '_modeChanged'
    },

    _views: {
      type: Number,
      value: 1
    },
    _PDF: {
      type: Object,
      value: function value() {
        return {};
      }
    },
    _pageRendering: {
      type: Boolean,
      value: false
    },
    _pageNumPending: {
      type: Number,
      value: null
    },
    _firstRender: {
      type: Boolean,
      value: false
    },
    _pos: {
      type: Object,
      value: function value() {
        return { x: 0, y: 0 };
      }
    },
    _zoom: {
      type: Number,
      value: 1
    }
  },

  attached: function attached() {
    var _this = this;

    this._ro = new ResizeObserver(function (entries, observer) {
      console.log('resize detect');
      if (_this._firstRender) _this._drawPage();
    });
    this._ro.observe(this);
  },
  detached: function detached() {
    delete this._ro;
  },
  _srcChanged: function _srcChanged() {
    var _this2 = this;

    this.firstRender = false;
    this.page = 1;
    PDFJS.getDocument(this.src).then(function (pdf) {
      _this2._setPages(pdf.numPages);
      _this2._PDF = pdf;
      switch (_this2.initialZoom) {
        case "fit-width":
          _this2.fitWidth();
          break;
        default:
          _this2.fit();
      }
    });
  },
  _pageChanged: function _pageChanged(newValue, oldValue) {
    if (!this.pages) {
      this.page = 1;
    }
    if (newValue > this.pages) this.page = this.pages;
    if (newValue < 1) this.page = 1;
    if (this._PDF) this._drawPage();
  },
  _modeChanged: function _modeChanged(newValue, oldValue) {
    switch (this.mode) {
      case 'double':
        this._views = 2;
        this.$.viewer2.hidden = false;
        break;
      default:
        this._views = 1;
        this.$.viewer2.hidden = true;
    }
    if (this._firstRender) {
      this._recenter();
      switch (this.initialZoom) {
        case "fit-width":
          this.fitWidth();
          break;
        default:
          this.fit();
      }
    }
  },


  /**
   * move to the next page
   */
  next: function next() {
    if (this.page < this.pages) this.page += this._views;
  },


  /**
   * move to the previous page
   */
  previous: function previous() {
    if (this.page > 1) this.page -= this._views;
  },


  /**
   * display the document full width
   */
  fitWidth: function fitWidth() {
    var _this3 = this;

    this._PDF.getPage(this.page).then(function (page) {
      var viewport = page.getViewport(1);
      var rect = _this3.$.container.getBoundingClientRect();
      _this3._zoom = (rect.width - 20) / (_this3._views * viewport.width);
      if (!_this3._firstRender) {
        viewport = page.getViewport(_this3._zoom);
        _this3._pos.x = (rect.width - _this3._views * viewport.width) / 2;
        _this3._pos.y = 10;
        _this3.$.viewer.style.transform = 'translate(' + _this3._pos.x + 'px,' + _this3._pos.y + 'px )';
      }
      _this3._drawPage();
    });
  },


  /**
   * display the whole page
   */
  fit: function fit() {
    var _this4 = this;

    this._PDF.getPage(this.page).then(function (page) {
      var viewport = page.getViewport(1);
      var rect = _this4.$.container.getBoundingClientRect();
      _this4._zoom = Math.min((rect.width - 20) / _this4._views * viewport.width, (rect.height - 20) / viewport.height);
      if (!_this4._firstRender) {
        viewport = page.getViewport(_this4._zoom);
        _this4._pos.x = (rect.width - _this4._views * viewport.width) / 2;
        _this4._pos.y = (rect.height - viewport.height) / 2;
        _this4.$.viewer.style.transform = 'translate(' + _this4._pos.x + 'px,' + _this4._pos.y + 'px )';
      }
      _this4._drawPage();
    });
  },


  /**
   * zoom in
   */
  zoomin: function zoomin() {
    this._zoom = this._zoom * this.zoomRatio;
    this._drawPage();
  },


  /**
   * zoom out
   */
  zoomout: function zoomout() {
    this._zoom = this._zoom / this.zoomRatio;
    this._drawPage();
  },
  _renderView: function _renderView(view, pg) {
    var _this5 = this;

    return new Promise(function (resolve, reject) {
      _this5._PDF.getPage(pg).then(function (page) {
        var viewport = page.getViewport(_this5._zoom);
        view.width = viewport.width;
        view.height = viewport.height;

        var context = view.getContext('2d');
        var renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        resolve(page.render(renderContext));
      }).catch(function (err) {
        _this5._PDF.getPage(1).then(function (page) {
          var viewport = page.getViewport(_this5._zoom);
          view.width = viewport.width;
          view.height = viewport.height;
        }).then(resolve);
      });
    });
  },
  _drawPage: function _drawPage(pg) {
    var _this6 = this;

    if (!pg) pg = this.page;
    if (this._pageRendering) {
      this._pageNumPending = pg;
      return;
    }
    this._pageRendering = true;
    this.$.spinner.active = true;
    var promises = [];
    if (this.mode === "single") {
      promises.push(this._renderView(this.$.viewer1, pg));
    } else {

      promises.push(this._renderView(this.$.viewer1, pg - pg % 2));
      promises.push(this._renderView(this.$.viewer2, pg - pg % 2 + 1));
    }
    Promise.all(promises).then(function () {
      _this6._firstRender = true;
      _this6._pageRendering = false;
      _this6.$.spinner.active = false;
      _this6._recenter();
      if (_this6._pageNumPending !== null) {
        // New page rendering is pending
        _this6._drawPage(_this6._pageNumPending);
        _this6._pageNumPending = null;
      }
    });
  },
  _handleTrack: function _handleTrack(evt) {
    var _this7 = this;

    var tmp = void 0;
    var getDiff = function getDiff(evt) {
      return {
        x: _this7._trackPos.x - evt.detail.x,
        y: _this7._trackPos.y - evt.detail.y
      };
    };
    switch (evt.detail.state) {
      case 'start':
        this._trackPos = { x: evt.detail.x, y: evt.detail.y };
        break;
      case 'track':
        tmp = getDiff(evt);
        this.$.viewer.style.transform = 'translate(' + (this._pos.x - tmp.x) + 'px,' + (this._pos.y - tmp.y) + 'px )';
        break;
      case 'end':
        tmp = getDiff(evt);
        this._pos.x = this._pos.x - tmp.x;
        this._pos.y = this._pos.y - tmp.y;
        this._recenter();
        break;
    }
  },
  _recenter: function _recenter() {
    var rect = this.$.container.getBoundingClientRect();
    var viewerRect = this.$.viewer.getBoundingClientRect();
    if (rect.width > viewerRect.width) {
      this._pos.x = (rect.width - viewerRect.width) / 2;
    }
    if (rect.height > viewerRect.height) {
      this._pos.y = (rect.height - viewerRect.height) / 2;
    }
    if (rect.width < viewerRect.width && rect.width > viewerRect.width + this._pos.x + 50) {
      this._pos.x = rect.width - 50 - viewerRect.width;
    }
    if (rect.width < viewerRect.width && this._pos.x > 50) {
      this._pos.x = 50;
    }
    if (rect.height < viewerRect.height && rect.height > viewerRect.height + this._pos.y + 50) {
      this._pos.y = rect.height - 50 - viewerRect.height;
    }
    if (rect.height < viewerRect.height && this._pos.y > 50) {
      this._pos.y = 50;
    }
    this.$.viewer.style.transform = 'translate(' + this._pos.x + 'px,' + this._pos.y + 'px )';
  }
});
