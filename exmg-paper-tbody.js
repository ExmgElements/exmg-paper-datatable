import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/polymer/lib/elements/array-selector.js';
import {addListener, removeListener} from '@polymer/polymer/lib/utils/gestures.js';
import {dom} from '@polymer/polymer/lib/legacy/polymer.dom.js';
import {Debouncer} from '@polymer/polymer/lib/utils/debounce.js';
import {animationFrame} from '@polymer/polymer/lib/utils/async.js';
import {enqueueDebouncer} from '@polymer/polymer/lib/utils/flush.js';
import {matches, translate} from '@polymer/polymer/lib/utils/path.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {Templatizer} from '@polymer/polymer/lib/legacy/templatizer-behavior.js';

/**
* @namespace Exmg
*/
window.Exmg = window.Exmg || {};

const SECRET_TABINDEX = -100;

export class ExmgPaperTbodyElement extends mixinBehaviors([Templatizer], PolymerElement) {
  static get template() {
    return html`
    <style>
      :host {
       width: 100%;
      }

      .tr {
        @apply --layout;
        box-sizing: border-box;
        border-bottom: 1px solid var(--divider-color);
        @apply --exmg-paper-tbody-tr;
      }

      .tr.selected {
        background: #fff;
        position: relative;
        z-index: 20;
        @apply --exmg-paper-tbody-tr-selected;
      }

      .tr.selected:hover .td {
        background: none;
      }

      .tr[hidden] {
        display: none;
      }

      .tr .td.hover > span > * {
        display: none;
      }

      .tr.selected .td.hover > * {
        display: none;
      }

      .tr:hover .td {
        background-color: #f5f5f5;
        @apply --exmg-paper-tbody-td-hover;
      }

      .tr:hover .td.hover > span > * {
        display: inline-block;
        @apply --exmg-paper-tbody-td-hover-content;
      }

      .tr.expandable {
        @apply --layout-vertical;
        display: none;
        padding: 72px 36px 24px;
        position: relative;
        margin-left: -12px;
        margin-top: -50px;
        z-index: 10;
        width: calc(100% + 24px);
        height: calc(100% + 48px);
        background: #fff;
        border: 1px solid var(--divider-color);
        box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
            0 1px 5px 0 rgba(0, 0, 0, 0.12),
            0 3px 1px -2px rgba(0, 0, 0, 0.2);
        @apply --exmg-paper-tbody-tr-expandable;
      }

      .tr.expandable[aria-expanded] {
        @apply --layout;
      }

      .tr.expandable > span {
        @apply --layout;
        @apply --layout-center;
        @apply --exmg-paper-tbody-tr-expandable-expanded;
      }

      .tr.expandable > span > * {
        padding: 0 24px 0 0;
      }

      .td {
        @apply --layout;
        @apply --layout-center;
        height: 48px;
        box-sizing: border-box;
        overflow: hidden;
        padding: 0 6px;
        @apply --exmg-paper-tbody-td;
      }

      .td > span {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .td:first-child {
        padding-left: 24px;
      }

      .td:last-child {
        padding-right: 24px;
      }

      .flex {
        @apply --layout-flex;
      }

      .flex-auto {
        /* stretch and squish */
        @apply --layout-flex-auto;
      }

      .flex-none {
        /* fixed width */
        @apply --layout-flex-none;
      }

      .flex-right {
        @apply --layout;
        @apply --layout-end-justified;
        padding-right: 24px;
        padding-left: 6px !important;
      }

      .collapsable {
        display: none;
      }

      @media(min-width: 600px) {
        .collapsable {
          @apply --layout;
        }
      }

      /* Should this be here or elsewhere? */
      paper-button {
        @apply --layout-self-end;
        transition: all .2s linear;
        font-size: 14px;
        font-weight: 500;
        opacity: .6;
      }

      paper-button:hover {
        background: #ddd;
        opacity: 1;
      }

    </style>
    <slot></slot>
    <!-- Array helper -->
    <array-selector id="selector" items="{{items}}" selected="{{selectedItems}}" selected-item="{{selectedItem}}"></array-selector>
`;
  }

  static get is() {
    return 'exmg-paper-tbody';
  }
  static get properties() {
    return {
      /**
      * An array containing items determining how many instances of the template
      * to stamp and that that each template instance should bind to.
      */
      items: {
        type: Array,
      },
      /**
      * The name of the variable to add to the binding scope for the array
      * element associated with a given template instance.
      */
      as: {
        type: String,
        value: 'item',
      },
      /**
      * The name of the variable to add to the binding scope to indicate
      * if the row is selected.
      */
      selectedAs: {
        type: String,
        value: 'selected',
      },
      /**
      * The name of the variable to add to the binding scope with the index
      * for the row.
      */
      indexAs: {
        type: String,
        value: 'index',
      },
      /**
      * When true, tapping a row will select the item, placing its data model
      * in the set of selected items retrievable via the selection property.
      *
      * Note that tapping focusable elements within the list item will not
      * result in selection, since they are presumed to have their * own action.
      */
      selectionEnabled: {
        type: Boolean,
        value: false,
      },
      /**
      * When `multiSelection` is false, this is the currently selected item, or `null`
      * if no item is selected.
      */
      selectedItem: {
        type: Object,
        notify: true,
      },
      /**
      * When `multiSelection` is true, this is an array that contains the selected items.
      */
      selectedItems: {
        type: Object,
        notify: true,
      },
      /**
      * When `true`, multiple items may be selected at once (in this case,
      * `selected` is an array of currently selected items).  When `false`,
      * only one item may be selected at a time.
      */
      multiSelection: {
        type: Boolean,
        value: false,
      },

      /**
      * When `true`, extra style information is set on the first column for correct display.
      */
      checkboxUsed: {
        type: Boolean,
        value: false,
      },
    };
  }

  static get observers() {
    return [
      '_itemsChanged(items.*)',
      '_multiSelectionChanged(multiSelection)',
      '_selectionEnabledChanged(selectionEnabled)',
    ];
  }

  _multiSelectionChanged(multiSelection) {
    this.clearSelection();
    this.$.selector.multi = multiSelection;
  }

  /**
  * Add an event listener to `tap` if `selectionEnabled` is true,
  * it will remove the listener otherwise.
  */
  _selectionEnabledChanged(selectionEnabled) {
    if (selectionEnabled) {
      this._addTapListener();
    } else {
      this._removeTapListener();
    }
  }

  _addTapListener() {
    addListener(this, 'tap', this._selectionHandler);
  }

  _removeTapListener() {
    removeListener(this, 'tap', this._selectionHandler);
  }

  /**
  * Select an item from an event object.
  */
  _selectionHandler(e) {
    const m = e.path.find((entry) => {
      return entry.classList && entry.classList.contains('tr');
    });
    const model = this.modelForElement(m);
    if (!model) {
      return;
    }
    const target = dom(e).path[0];
    const activeEl = dom(this.domHost ? this.domHost.root : document).activeElement;
    const physicalItem = this._physicalItems[model[this.indexAs]];
    // Safari does not focus certain form controls via mouse
    // https://bugs.webkit.org/show_bug.cgi?id=118043
    if (target.localName === 'input' ||
        target.localName === 'button' ||
        target.localName === 'select') {
      return;
    }
    // Set a temporary tabindex
    const modelTabIndex = model.tabIndex;
    model.tabIndex = -100;
    const activeElTabIndex = activeEl ? activeEl.tabIndex : -1;
    model.tabIndex = modelTabIndex;
    // Only select the item if the tap wasn't on a focusable child
    // or the element bound to `tabIndex`
    if (activeEl && physicalItem !== activeEl &&
      physicalItem.contains(activeEl) && activeElTabIndex !== SECRET_TABINDEX) {
      return;
    }
    this.toggleSelectionForItem(model[this.as]);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._removeTapListener();
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._physicalCount === 0) {
      this._debounceRender(this._render);
    }
  }

  _debounceRender(cb) {
    this._renderDebouncer = Debouncer.debounce(
      this._renderDebouncer,
      animationFrame,
      cb.bind(this));
    enqueueDebouncer(this._renderDebouncer);
  }

  /**
  * Renders the a new list.
  */
  _render() {
    if (!this.isAttached) {
      return;
    }
    if (this._physicalCount === 0) {
      this._increasePool(this.items.length);
    } else {
      if (this.items.length > this._physicalCount) {
        this._increasePool(this.items.length - this._physicalCount);
      } else {
        this._update();
      }
    }
  }

  /**
  * Called when the items have changed. That is, ressignments
  * to `items`, splices or updates to a single item.
  */
  _itemsChanged(change) {
    if (change.path === 'items') {
      this.items = this.items || [];
      this._physicalCount = this._physicalCount || 0;
      this._physicalItems = this._physicalItems || [];
      this._debounceRender(this._render);
    } else if (change.path === 'items.splices') {
      change.value.indexSplices.forEach(function(splice) {
        // deselect removed items
        splice.removed.forEach(this._removeItem, this);
      }, this);
      this._debounceRender(this._render);
    } else {
      if (change.path !== 'items.length') {
        this._forwardItemPath(change.path, change.value);
      }
    }
  }

  _removeItem(item) {
    this.$.selector.deselect(item);
  }

  _forwardItemPath(path, value) {
    path = path.slice(6); // 'items.'.length == 6
    let dot = path.indexOf('.') + 1;
    if (dot === 0) {
      dot = path.length;
    }
    const idx = parseInt(path.substring(0, dot), 10);
    const inst = this.modelForElement(this._physicalItems[idx]);
    if (!inst || inst[this.indexAs] !== idx) {
      return;
    }
    path = path.substring(dot);
    path = this.as + (path ? '.' + path : '');
    inst._setPendingPropertyOrPath(path, value, false, true);
    inst._flushProperties && inst._flushProperties(true);
  }

  /**
  * Creates a pool of DOM elements and attaches them to the local dom.
  *
  * @param {number} size Size of the pool
  */
  _createPool(size) {
    const physicalItems = new Array(size);
    this._ensureTemplatized();
    for (let i = 0; i < size; i++) {
      const inst = this.stamp(null);
      // First element child is item; Safari doesn't support children[0]
      // on a doc fragment.
      physicalItems[i] = inst.root.querySelector('*');
      this.shadowRoot.appendChild(inst.root);
    }
    return physicalItems;
  }

  /**
  * Increases the pool size.
  */
  _increasePool(poolSize) {
    // Concat arrays in place.
    [].push.apply(this._physicalItems, this._createPool(poolSize));
    this._physicalCount = this._physicalItems.length;
    this._update();
  }

  /**
  * Templetizes the user template.
  */
  _ensureTemplatized() {
    // Check if already templatized
    if (!this.ctor) {
      // Template instance props that should be excluded from forwarding
      const props = {};
      props.__key__ = true;
      props[this.as] = true;
      props[this.indexAs] = true;
      props[this.selectedAs] = true;
      props.tabIndex = true;
      this._instanceProps = props;
      this._userTemplate = this.querySelector('template');
      if (this._userTemplate) {
        this.templatize(this._userTemplate);
      } else {
        console.warn('exm-tbody requires a template to be provided in light-dom');
      }
    }
  }

  /**
  * Update the list of items, starting from the `_virtualStart` item.
  * @param {!Array<number>=} itemSet
  */
  _update(itemSet) {
    if ((itemSet && itemSet.length === 0) || this._physicalCount === 0) {
      return;
    }
    this._assignModels();
  }

  /**
  * Assigns the data models to a given set of items.
  * @param {!Array<number>=} itemSet
  */
  _assignModels() {
    let count = 0;
    this._physicalItems.forEach((el) => {
      const inst = this.modelForElement(el);
      const item = this.items[count];
      if (item != null && item !== undefined) {
        this._forwardProperty(inst, this.as, item);
        this._forwardProperty(inst, this.selectedAs, this.$.selector.isSelected(item));
        this._forwardProperty(inst, this.indexAs, count);
        this._forwardProperty(inst, 'tabIndex', -1);
        inst._flushProperties && inst._flushProperties(true);
        el.removeAttribute('hidden');
      } else {
        el.setAttribute('hidden', '');
      }
      count++;
    });
  }

  _forwardProperty(inst, name, value) {
    inst._setPendingProperty(name, value);
  }

  /* Templatizer bindings for v2 */
  _forwardHostPropV2(prop, value) {
    (this._physicalItems || [])
      .concat([this._offscreenFocusedItem, this._focusBackfillItem])
      .forEach(function(item) {
        if (item) {
          this.modelForElement(item).forwardHostProp(prop, value);
        }
      }, this);
  }

  _notifyInstancePropV2(inst, prop, value) {
    if (matches(this.as, prop)) {
      const idx = inst[this.indexAs];
      if (prop == this.as) {
        this.items[idx] = value;
      }
      this.notifyPath(translate(this.as, 'items.' + idx, prop), value);
    }
  }

  /**
  * Selects the given item.
  *
  * @method selectItem
  * @param {Object} item The item instance.
  */
  selectItem(item) {
    return this.selectIndex(this.items.indexOf(item));
  }

  /**
  * Selects the item at the given index in the items array.
  *
  * @method selectIndex
  * @param {Object} index The item instance.
  */
  selectIndex(index) {
    if (index < 0 || index >= this.items) {
      return;
    }
    if (!this.multiSelection && this.selectedItem) {
      this.clearSelection();
    }

    const model = this.modelForElement(this._physicalItems[index]);
    if (model) {
      model[this.selectedAs] = true;
    }

    this.$.selector.selectIndex(index);
  }

  /**
   * Clears the current selection in the list.
   *
   * @method clearSelection
   */
  clearSelection() {
    if (this._physicalItems) {
      this._physicalItems.map((el) => {
        this.modelForElement(el)[this.selectedAs] = false;
      });
    }
    this.$.selector.clearSelection();
  }

  /**
  * Deselects the given item.
  *
  * @method deselect
  * @param {Object} item The item instance.
  */
  deselectItem(item) {
    return this.deselectIndex(this.items.indexOf(item));
  }

  /**
   * Deselects the item at the given index in the items array.
   *
   * @method deselectIndex
   * @param {number} index The index of the item in the items array.
   */
  deselectIndex(index) {
    if (index < 0 || index >= this.items) {
      return;
    }

    const model = this.modelForElement(this._physicalItems[index]);
    model[this.selectedAs] = false;

    this.$.selector.deselectIndex(index);
  }

  /**
  * Selects or deselects a given item depending on whether the item
  * has already been selected.
  *
  * @method toggleSelectionForItem
  * @param {Object} item The item object.
  */
  toggleSelectionForItem(item) {
    return this.toggleSelectionForIndex(this.items.indexOf(item));
  }

  /**
   * Selects or deselects the item at the given index in the items array
   * depending on whether the item has already been selected.
   *
   * @method toggleSelectionForIndex
   * @param {Object} index The index of the item in the items array.
   */
  toggleSelectionForIndex(index) {
    const isSelected = this.$.selector.isIndexSelected
      ? this.$.selector.isIndexSelected(index) : this.$.selector.isSelected(this.items[index]);
    isSelected ? this.deselectIndex(index) : this.selectIndex(index);
  }
}

window.customElements.define(ExmgPaperTbodyElement.is, ExmgPaperTbodyElement);

Exmg.ExmgPaperTbodyElement = ExmgPaperTbodyElement;
