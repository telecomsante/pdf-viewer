import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-fab/paper-fab.js';
import '@polymer/iron-icons/iron-icons.js';
import '../pdf-viewer.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
class XPdf extends PolymerElement {
  static get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        position: relative;
        flex: 1;
        touch-action: none;
      }

      [hidden] {
        display: none !important;
      }

      pdf-viewer {
        flex: 1;
      }

      footer {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
      }

      nav {
        position: absolute;
        bottom: 20px;
        right: 10px;
      }

      paper-fab {
        margin: 10px;
        color: dimgray;
      }

    </style>
    <pdf-viewer id="viewer" initial-zoom="fit" src="/data/20170220_PAR.pdf" mode="single" page="{{page}}" pages="{{pages}}"></pdf-viewer>
    <nav>
      <paper-fab mini="" icon="fullscreen" on-tap="fitWidth"></paper-fab>
      <paper-fab mini="" icon="fullscreen-exit" on-tap="fit"></paper-fab>
      <paper-fab mini="" icon="zoom-in" on-tap="zoomin"></paper-fab>
      <paper-fab mini="" icon="zoom-out" on-tap="zoomout"></paper-fab>
    </nav>
    <footer>
      <paper-fab mini="" icon="arrow-back" on-tap="previous"></paper-fab>
      <div>[[page]]/[[pages]]</div>
      <paper-fab mini="" icon="arrow-forward" on-tap="next"></paper-fab>
    </footer>
`;
  }

  static get is() {
    return 'x-pdf'
  }

  static get properties() {
    return {
      page: { type: Number },
    }
  }

  fitWidth() {
    this.$.viewer.fitWidth()
  }
  fit() {
    this.$.viewer.fit()
  }
  zoomin() {
    this.$.viewer.zoomin()
  }
  zoomout() {
    this.$.viewer.zoomout()
  }
  next() {
    this.$.viewer.next()
  }
  previous() {
    this.$.viewer.previous()
  }
}

window.customElements.define(XPdf.is, XPdf)
