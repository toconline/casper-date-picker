/*
  - Copyright (c) 2018-2021 Cloudware S.A. All rights reserved.
  -
  - This file is part of casper-date-picker.
  -
  - casper-date-picker is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - casper-date-picker  is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with casper-date-picker.  If not, see <http://www.gnu.org/licenses/>.
  -
 */


import moment from 'moment/src/moment.js';
import '@polymer/paper-input/paper-input.js';
import '@toconline/casper-icons/casper-icon.js';
import '@vaadin/vaadin-date-picker/theme/material/vaadin-date-picker-light.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import { CasperOverlay } from '@toconline/casper-overlay-behavior/casper-overlay.js';

class CasperDatePicker extends PolymerElement {

  static get template () {
    return html`
      <style>
        vaadin-date-picker-light {
          width: 100%;
        }

        .icon-container {
          display: flex;
        }

        casper-icon {
          width: 15px;
          height: 15px;
          cursor: pointer;
          transition: color 250ms linear;
        }

        #clear-icon {
          color: #525252;
          margin-right: 5px;
        }

        #clear-icon:hover {
          color: black;
        }

        #calendar-icon {
          color: var(--primary-color);
        }

        #calendar-icon:hover {
          color: var(--dark-primary-color);
        }

        :host([disabled]) casper-icon {
          color: var(--disabled-background-color) !important;
        }
      </style>

      <vaadin-date-picker-light
        id="picker"
        opened="{{opened}}"
        min="[[minimumDate]]"
        max="[[maximumDate]]"
        attr-for-value="value"
        readonly="[[readonly]]"

        disabled="[[disabled]]"
        value="{{__internalValue}}">
        <paper-input
          tooltip="[[tooltip]]"
          tooltip-position="[[tooltipPosition]]"
          readonly="[[readonly]]"
          disabled="[[disabled]]"
          invalid="{{invalid}}"
          label="[[inputPlaceholder]]"
          error-message="[[__errorMessage]]">

          <div slot="suffix" class="icon-container">
          <!--Only display the clear icon if the date picker has a value-->
            <template is="dom-if" if="[[__pickerHasValue]]">
              <casper-icon icon="fa-light:times" slot="suffix" id="clear-icon" on-click="__resetDatePickerValue"></casper-icon>
            </template>

            <casper-icon icon="fa-light:calendar-alt" slot="suffix" id="calendar-icon"></casper-icon>
          </div>
        </paper-input>
      </vaadin-date-picker-light>
    `;
  }

  static get properties () {
    return {
      /**
       * Flag that states if the date picker is disabled or not.
       *
       * @type {Boolean}
       */
      disabled: {
        type: Boolean,
        reflectToAttribute: true,
        observer: '__disabledChanged'
      },
      /**
       * Format in which the selected date will be displayed.
       *
       * @type {String}
       */
      format: {
        type: String,
        value: 'DD-MM-YYYY'
      },
      /**
       * The paper input's placeholder.
       *
       * @type {String}
       */
      inputPlaceholder: {
        type: String,
      },
      /**
       * The maximum date accepted by the calendar.
       *
       * @type {String}
       */
      maximumDate: {
        type: String,
      },
      /**
       * The error message that appears if the selected date is after the maximum allowed one.
       *
       * @type {String}
       */
      maximumDateErrorMessage: {
        type: String,
        value: 'A data não pode ser superior ao limite máximo'
      },
      /**
       * The minimum date accepted by the calendar.
       *
       * @type {String}
       */
      minimumDate: {
        type: String,
      },
      /**
       * The error message that appears if the selected date is before the minimum allowed one.
       *
       * @type {String}
       */
      minimumDateErrorMessage: {
        type: String,
        value: 'A data não pode ser inferior ao limite mínimo'
      },
      /**
       * Flag that states if the date picker's overlay is open or not.
       *
       * @type {Boolean}
       */
      opened: {
        type: Boolean,
        notify: true,
        observer: '__openedChanged'
      },
      /**
       * This flag states if this component is required to have a value.
       *
       * @type {Boolean}
       */
      required: {
        type: Boolean,
        value: true,
      },
      /**
       * The error message that appears if the input is required and does not contain any value.
       *
       * @type {String}
       */
      requiredErrorMessage: {
        type: String,
        value: 'Este campo deve ser preenchido.',
      },
      /**
       * Flag that states if the date picker is disabled or not.
       *
       * @type {Boolean}
       */
      value: {
        type: String,
        notify: true,
        observer: '__valueChanged'
      },
      /**
       * Flag that states if the paper input should display the error message and the invalid styles.
       *
       * @type {Boolean}
       */
      invalid: {
        type: Boolean,
        value: false,
      },
      /**
       * Internal property that should be used before actually changing the component's value.
       *
       * @type {String}
       */
      __internalValue: {
        type: String,
        observer: '__internalValueChanged'
      },
      /**
      * Tooltip
      *
      * @type {String}
      */
        tooltip: {
        type: String,
      },
      /**
      * Readonly Property
      *
      * @type {String}
      */
       readonly: {
        type: Boolean,
      },
      tooltipPosition: {
        type: String,
        value: 'bottom'
      }
    };
  }

  ready () {
    super.ready();

    this.__datePickerInput = this.shadowRoot.querySelector('paper-input');
    this.__setupDatePicker();
  }

  get formattedValue () {
    return this.value ? moment(this.value).format(this.format) : '';
  }

  open () { this.opened = true; }
  close () { this.opened = false; }
  toggle () { this.opened = !this.opened; }

  /**
   * Observer that gets fired when the external value changes.
   *
   * @param {String} value The current component's value.
   */
  __valueChanged (value) {
    // This means the value was changed internally when the user selected a new date.
    if (this.valueLock) return;

    this.__internallyChangeProperty('__internalValue', value);
  }

  /**
   * This method checks if the current vaadin date picker value is valid and either changes the external component's value
   * or displays the errors in the UI.
   *
   * @param {String} internalValue The current date picker's value.
   * @param {String} previousInternalValue The previous date picker's value.
   */
  __internalValueChanged (internalValue, previousInternalValue) {
    this.__pickerHasValue = !!internalValue;

    // This means the component is still initializing.
    if (!internalValue && !previousInternalValue) return;

    this.invalid = (this.required && !internalValue) || !this.$.picker.checkValidity();

    if (this.invalid) {
      // Discover why the input is invalid (required / minimum / maximum).
      if (!internalValue) {
        this.__errorMessage = this.requiredErrorMessage;
      } else {
        const currentDate = moment(internalValue);
        const minimumDate = moment(this.minimumDate);
        const maximumDate = moment(this.maximumDate);

        if (currentDate < minimumDate) this.__errorMessage = this.minimumDateErrorMessage;
        if (currentDate > maximumDate) this.__errorMessage = this.maximumDateErrorMessage;
      }

      return this.__setValue();
    }

    this.__setValue(internalValue);
  }

  /**
   * This method changes the public value and formattedValue property.
   *
   * @param {String} value The current component's value.
   */
  __setValue (value = '') {
    if (!this.__internalValueLock) {
      this.__internallyChangeProperty('value', value);
    }
  }

  /**
   * This method sets the callbacks and translations needed for the vaadin-date-picker-light component.
   */
  __setupDatePicker () {
    // Function to format a date into a String and the other way around.
    this.$.picker.set('i18n.parseDate', date => this.__parseDate(date));
    this.$.picker.set('i18n.formatDate', date => this.__formatDate(date));

    // Date picker translations.
    this.$.picker.set('i18n.today', 'Hoje');
    this.$.picker.set('i18n.cancel', 'Cancelar');
    this.$.picker.set('i18n.weekdays', moment.weekdays());
    this.$.picker.set('i18n.weekdaysShort', moment.weekdaysShort());
    this.$.picker.set('i18n.monthNames', moment.months().map(month => month.charAt(0).toUpperCase() + month.slice(1)));
  }

  /**
   * This method formats the current date picker's value into the defined format which by default is "DD-MM-YYYY".
   *
   * @param {Date} date The current date picker's value.
   */
  __formatDate (date) {
    return moment(new Date(date.year, date.month, date.day)).format(this.format);
  }

  /**
   * Parses the keyboard-input date into an object that can be by the datepicker.
   *
   * @param {String} date The date that was input by the user.
   */
  __parseDate (date) {
    const regexMatches = date.match(/(\d{2}).?(\d{2}).?(\d{4})/);

    if (regexMatches && regexMatches.length === 4) {
      return {
        day: parseInt(regexMatches[1]),
        month: parseInt(regexMatches[2]) - 1,
        year: parseInt(regexMatches[3]),
      };
    }
  }

  /**
   * Observer that gets fired when the vaadin date picker overlay opens which should focus the paper input.
   *
   * @param {Boolean} isOverlayOpen Flag that states if the overlay is currently open.
   */
  __openedChanged (isOverlayOpen) {
    if (isOverlayOpen) {
      CasperOverlay.pushActiveOverlay(this.$.picker.$.overlay);

      // Necessary for CasperEditDialog, to fix problem related to the stacking context of the top-layer
      this.$.picker.$.overlay.correspondingPicker = this.$.picker;
      this.dispatchEvent(new CustomEvent('casper-overlay-opened', { bubbles: true, composed: true, detail: { element: this.$.picker.$.overlay } }));
    } else {
      CasperOverlay.removeActiveOverlay(this.$.picker.$.overlay);
    }

    if (!isOverlayOpen) return;

    afterNextRender(this, () => {
      this.__datePickerInput.blur();
      this.__datePickerInput.focus();
    });
  }

  /**
   * Observer that gets fired when the disabled property changes.
   */
  __disabledChanged () {
    if (this.disabled) this.close();
  }

  /**
   * Method that is invoked when the user clicks on the clear icon.
   *
   * @param {Object} event The event's object.
   */
  __resetDatePickerValue (event) {
    event.stopPropagation();

    this.value = '';
  }

  /**
   * Changes a property and "locks" it in order to prevent infinite loops of observers.
   *
   * @param {String} propertyName The name of the property which will be changed.
   * @param {String} propertyValue The new value of the property.
   */
  __internallyChangeProperty (propertyName, propertyValue) {
    this[`${propertyName}Lock`] = true;
    this[propertyName] = propertyValue;
    this[`${propertyName}Lock`] = false;
  }
}

window.customElements.define('casper-date-picker', CasperDatePicker);
