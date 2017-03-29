Polymer({

  is: 'pdf-viewer',

  properties: {
    /**
     * url of the pdf file to display
     * @type {String}
     */
    src: {
      type: String,
      observer: '_srcChanged',
    },

    /**
     * The page number to display
     *
     * The first page is 1
     * @type {Number}
     */
    page: {
      type: Number,
      value: 1,
      observer: '_pageChanged',
      reflectToAttribute: true,
      notify: true,
    },

    /**
     * total number of pages in the document
     * @type {Number}
     */
    pages: {
      type: Number,
      readOnly: true,
      reflectToAttribute: true,
      notify: true,
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
      value: "fit",
    },

    /**
     * The zoom value
     * @type {Number}
     */
    zoom: {
      type: Number,
      value: 1,
      observer: '_zoomChanged'
    },

    /**
     * The zoom ratio used
     * @type {Numder}
     */
    zoomRatio: {
      type: Number,
      value: 1.25,
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
      observer: '_modeChanged',
    },

    _views: {
      type: Number,
      value: 1,
    },
    _PDF: {
      type: Object,
      value: () => { return {}; },
    },
    _pageRendering: {
      type: Boolean,
      value: false,
    },
    _pageNumPending: {
      type: Number,
      value: null,
    },
    _firstRender: {
      type: Boolean,
      value: false,
    },
    _pos: {
      type: Object,
      value: () => { return {x:0, y:0} },
    }
  },

  attached() {
    this._ro = new ResizeObserver((entries, observer) => {
      console.log('resize detect');
      if(this._firstRender) this._drawPage();
    });
    this._ro.observe(this);
  },

  detached() {
    delete this._ro;
  },

  _srcChanged() {
    this.firstRender = false;
    this.page = 1;
    PDFJS.getDocument(this.src)
     .then(pdf => {
       this._setPages(pdf.numPages);
       this._PDF = pdf;
       switch(this.initialZoom) {
         case "fit-width":
          this.fitWidth();
          break;
        default:
          this.fit();
       }
     });
  },

  _pageChanged(newValue, oldValue) {
    if(!this.pages) {
      this.page = 1;
    }
    if(newValue > this.pages ) this.page = this.pages;
    if(newValue < 1) this.page = 1;
    if(this._PDF) this._drawPage();
  },

  _zoomChanged: function _zoomChanged(newValue, oldValue) {
    if (!this.zoom) {this.zoom = 1;}
    this.zoom = newValue;
  },

  _modeChanged(newValue, oldValue) {
    switch (this.mode) {
      case 'double':
        this._views = 2;
        this.$.viewer2.hidden = false;
        break;
      default:
        this._views = 1;
        this.$.viewer2.hidden = true;
    }
    if(this._firstRender) {
      this._recenter();
      switch(this.initialZoom) {
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
  next() {
    if(this.page < this.pages) this.page += this._views;
  },

  /**
   * move to the previous page
   */
  previous() {
    if(this.page > 1) this.page -= this._views;
  },

  /**
   * display the document full width
   */
  fitWidth() {
    this._PDF.getPage(this.page)
    .then(page => {
      let viewport = page.getViewport(1);
      let rect = this.$.container.getBoundingClientRect();
      this.zoom = (rect.width-20)/(this._views * viewport.width);
      if(!this._firstRender) {
        viewport = page.getViewport(this.zoom);
        this._pos.x = (rect.width - this._views * viewport.width) / 2;
        this._pos.y = 10;
        this.$.viewer.style.transform = `translate(${this._pos.x}px,${this._pos.y}px )`;
      }
      this._drawPage();
    })
  },

  /**
   * display the whole page
   */
  fit() {
    this._PDF.getPage(this.page)
    .then(page => {
      let viewport = page.getViewport(1);
      let rect = this.$.container.getBoundingClientRect();
      this.zoom = Math.min((rect.width-20)/this._views * viewport.width, (rect.height-20)/viewport.height);
      if(!this._firstRender) {
        viewport = page.getViewport(this.zoom);
        this._pos.x = (rect.width - this._views * viewport.width) / 2;
        this._pos.y = (rect.height - viewport.height) / 2;
        this.$.viewer.style.transform = `translate(${this._pos.x}px,${this._pos.y}px )`;
      }
      this._drawPage();
    })
  },

  /**
   * zoom in
   */
  zoomin() {
    this.zoom = this.zoom * this.zoomRatio;
    this._drawPage();
  },

  /**
   * zoom out
   */
  zoomout() {
    this.zoom = this.zoom / this.zoomRatio;
    this._drawPage();
  },

  _renderView(view, pg) {
    return new Promise( (resolve, reject) => {
      this._PDF.getPage(pg)
      .then( page => {
        const viewport = page.getViewport(this.zoom);
        view.width = viewport.width;
        view.height = viewport.height;

        const context = view.getContext('2d');
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        resolve( page.render(renderContext));
      })
      .catch( (err) => {
        this._PDF.getPage(1)
          .then( page => {
            const viewport = page.getViewport(this.zoom);
            view.width = viewport.width;
            view.height = viewport.height
          })
          .then( resolve );
      });
    })
  },

  _drawPage(pg) {
    if(!pg) pg = this.page;
    if(this._pageRendering) {
      this._pageNumPending = pg
      return;
    }
    this._pageRendering = true;
    this.$.spinner.active = true;
    const promises = [];
    if( this.mode === "single" ) {
      promises.push(this._renderView(this.$.viewer1, pg))
    } else {

      promises.push(this._renderView(this.$.viewer1, pg - pg % 2));
      promises.push(this._renderView(this.$.viewer2, pg - pg % 2 +1));
    }
    Promise.all(promises)
      .then( () => {
        this._firstRender = true;
        this._pageRendering = false;
        this.$.spinner.active = false;
        this._recenter();
        if (this._pageNumPending !== null) {
          // New page rendering is pending
          this._drawPage(this._pageNumPending);
          this._pageNumPending = null;
        }
      })
  },

  _handleTrack(evt) {
    let tmp;
    let getDiff = (evt) => {
      return {
        x: this._trackPos.x - evt.detail.x,
        y: this._trackPos.y -  evt.detail.y,
      };
    };
    switch(evt.detail.state) {
      case 'start':
       this._trackPos = { x:evt.detail.x, y:evt.detail.y};
       break;
     case 'track':
       tmp = getDiff(evt);
       this.$.viewer.style.transform = `translate(${this._pos.x-tmp.x}px,${this._pos.y-tmp.y}px )`;
       break;
     case 'end':
       tmp = getDiff(evt);
       this._pos.x = this._pos.x-tmp.x;
       this._pos.y = this._pos.y-tmp.y;
       this._recenter();
       break;
   }
 },

  _recenter() {
    const rect = this.$.container.getBoundingClientRect();
    const viewerRect = this.$.viewer.getBoundingClientRect();
    if(rect.width > viewerRect.width) {
      this._pos.x = (rect.width - viewerRect.width) / 2;
    }
    if(rect.height > viewerRect.height) {
      this._pos.y = (rect.height - viewerRect.height) / 2;
    }
    if( rect.width < viewerRect.width && rect.width > viewerRect.width + this._pos.x + 50) {
      this._pos.x = rect.width - 50 - viewerRect.width;
    }
    if( rect.width < viewerRect.width && this._pos.x > 50 ) {
      this._pos.x = 50
    }
    if( rect.height < viewerRect.height && rect.height > viewerRect.height + this._pos.y + 50) {
      this._pos.y = rect.height - 50 - viewerRect.height;
    }
    if( rect.height < viewerRect.height && this._pos.y > 50 ) {
      this._pos.y = 50
    }
    this.$.viewer.style.transform = `translate(${this._pos.x}px,${this._pos.y}px )`;
  }

});
