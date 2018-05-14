import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { GestureEventListeners } from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-item/paper-item.js';
import './exmg-paper-icons.js';
/**
`exmg-paper-paging` is the paging controll element that can be positioned at the footer of the table.

```html
<exmg-paper-paging total-items="[[rawItems.length]]" page-index="{{pageIndex}}" page-size="{{pageSize}}"></exmg-paper-paging>
```

### Styling
The following custom properties and mixins are also available for styling:

Custom property | Description | Default
----------------|-------------|----------
`--exmg-paper-paging-background-color` | Background color | `none`
`--exmg-paper-paging-text-color` | Text color | `87% black`
`--exmg-paper-paging` | Mixin applied to host element | `{}`
`--exmg-paper-paging-icon-color` | Text color of table| `54% black`
`--exmg-paper-paging-icon-disabled-color` | Mixin applied to the datatable | `36% black`
`--exmg-paper-paging-page-information` | Mixin applied to page information container | `{}`

@customElement
@polymer
@group Exmg Paper Elements
@element exmg-paper-datatable
@demo demo/index.html
*/
class ExmgPaperPagingElement extends GestureEventListeners(PolymerElement) {
  static get template() {
    return html`
    <style>
      :host {
        display: block;
        @apply --paper-font-common-base;
        background: var(--exmg-paper-paging-background-color, none);
        color: var(--exmg-paper-paging-text-color, rgba(0,0,0,.87));
        font-size: 12px;
        font-weight: 500;
        height:56px;
        padding:0px 6px;
        @apply --layout-horizontal;
        @apply --layout-end-justified;
        @apply --layout-center;
        @apply --exmg-paper-paging;

        --paper-dropdown-menu: {
          text-align: right;
          width: 68px;
        };
        --paper-dropdown-menu-icon: {
          color: var(--exmg-paper-paging-icon-color, rgba(0,0,0,.54));
        };
        --paper-icon-button: {
          color: var(--exmg-paper-paging-icon-color, rgba(0,0,0,.54));
        };
        --paper-icon-button-disabled: {
          color: var(--exmg-paper-paging-icon-disabled-color, rgba(0,0,0,.36));
        };
        --paper-input-container-underline-focus: { display: none; };
        --paper-input-container-underline-disabled: { display: none; };
        --paper-input-container-underline: { display: none; };
        --paper-input-container-input: {
          font-size: 14px;
          font-weight: 500;
        };
      }

      .page-information {
        margin: 0 20px 0 32px;
        @apply --exm-paging-page-information;
      }
    </style>

    <span>Rows per page:</span>
    <paper-dropdown-menu no-label-float="" no-animations="">
      <paper-listbox slot="dropdown-content" selected="{{_pageSize}}" attr-for-selected="value">
        <paper-item value="5">5</paper-item>
        <paper-item value="10">10</paper-item>
        <paper-item value="25">25</paper-item>
        <paper-item value="50">50</paper-item>
        <paper-item value="100">100</paper-item>
      </paper-listbox>
    </paper-dropdown-menu>
    <span class="page-information">
      [[_pageInfoStart(pageIndex, pageSize)]]
      -
      [[_pageInfoEnd(pageIndex,pageSize,totalItems)]] of [[totalItems]]
    </span>
    <paper-icon-button icon="exmg-paper-icons:chevron-left" on-tap="previousPage" disabled="[[_isFirstPage(pageIndex)]]"></paper-icon-button>
    <paper-icon-button icon="exmg-paper-icons:chevron-right" on-tap="nextPage" disabled="[[_isLastPage(pageIndex, pageSize, totalItems)]]"></paper-icon-button>
`;
  }

  static get is() {
    return 'exmg-paper-paging';
  }
  static get properties() {
    return {
      /**
      * Total items
      */
      totalItems: {
        type: Number,
        value: 0,
      },

      /**
      * This property can be used to change the current visible page
      */
      pageIndex: {
        type: Number,
        notify: true,
        value: 0,
      },

      /**
      * Set the page size of the table. Valid options are 5/10/25/50/100
      */
      pageSize: {
        type: Number,
        notify: true,
        value: 10,
      },

      _pageSize: {
        type: Number,
      },
    };
  }

  static get observers() {
    return [
      '_observePageSizeList(_pageSize)',
      '_observePageSize(pageSize)',
    ];
  }

  _observePageSizeList(ps) {
    this.pageSize = Number(ps);
  }

  _observePageSize(ps) {
    this._pageSize = Number(ps);
  }

  _pageInfoStart(pageIndex, pageSize) {
    return pageIndex * pageSize;
  }

  _pageInfoEnd(pageIndex, pageSize, totalItems) {
    const end = (pageIndex + 1) * pageSize;
    return end < totalItems ? end : totalItems;
  }

  _isFirstPage() {
    return this.pageIndex < 1;
  }

  _isLastPage() {
    return ((this.pageIndex + 1) * this.pageSize) > this.totalItems;
  }

  nextPage() {
    this.pageIndex++;
  }

  previousPage() {
    this.pageIndex--;
  }
}

window.customElements.define(ExmgPaperPagingElement.is, ExmgPaperPagingElement);

Exmg.ExmgPaperPagingElement = ExmgPaperPagingElement;
