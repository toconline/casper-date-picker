import moment from 'moment/src/moment.js';
import '@polymer/paper-input/paper-input.js';
import '@casper2020/casper-icons/casper-icon.js';
import '@vaadin/vaadin-date-picker/theme/material/vaadin-date-picker-light.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import { CasperOverlay } from '@casper2020/casper-overlay-behavior/casper-overlay.js';

class CasperDatePicker extends PolymerElement {
  static get template () {
    return html`
      <style>
        vaadin-date-picker-light {
          width: 100%;
        }
      </style>
      <vaadin-date-picker-light
        id="vaadinDatePicker"
        min="[[minimumDate]]"
        max="[[maximumDate]]"
        attr-for-value="value"
        value="{{__internalValue}}"
        opened="{{opened}}">
        <paper-input
          disabled="[[disabled]]"
          invalid="{{__inputInvalid}}"
          label="[[inputPlaceholder]]"
          error-message="[[__errorMessage]]">
          <casper-icon icon="fa-light:calendar-alt" slot="suffix"></casper-icon>
        </paper-input>
      </vaadin-date-picker-light>
    `;
  }

  static get properties () {
    return {
      /**
       * This flag states if the casper-date-picker is required to have a value.
       *
       * @type {Boolean}
       */
      required: {
        type: Boolean,
        value: true,
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
       * The maximum date accepted by the calendar.
       *
       * @type {String}
       */
      maximumDate: {
        type: String,
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
       * Wether the component should auto-validate itself as soon as its value changes or not.
       *
       * @type {Boolean}
       */
      autoValidate: {
        type: Boolean,
        value: true
      },
      /**
       * The error message that appears if the selected date is before the minimum allowed one.
       *
       * @type {String}
       */
      minimumErrorMessage: {
        type: String,
        value: 'A data não pode ser inferior ao limite mínimo'
      },
      /**
       * The error message that appears if the selected date is after the maximum allowed one.
       *
       * @type {String}
       */
      maximumErrorMessage: {
        type: String,
        value: 'A data não pode ser superior ao limite máximo'
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
      disabled: {
        type: Boolean,
        value: false,
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
       * Flag that states if the date picker's overlay is open or not.
       *
       * @type {Boolean}
       */
      opened: {
        type: Boolean,
        value: false,
        notify: true,
        observer: '__openedChanged'
      },
      /**
       * Flag that states if the paper input should display the error message and the invalid styles.
       *
       * @type {Boolean}
       */
      __inputInvalid: {
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
      }
    };
  }

  ready () {
    super.ready();

    this.__datePickerInput = this.shadowRoot.querySelector('paper-input');
    this.__setupDatePicker();
  }

  open () { this.opened = true; }
  close () { this.opened = false; }
  toggle () { this.opened = !this.opened; }

  /**
   * Observer that gets fired when the external value changes.
   */
  __valueChanged () {
    this.__skipValueObserver = this.value;
    this.__internalValue = this.value;
  }

  /**
   * This method checks if the current vaadin date picker value is valid and either changes the external component's value
   * or displays the errors in the UI.
   *
   * @param {String} internalValue The current vaadin-date-picker value.
   */
  __internalValueChanged (internalValue) {
    if (!this.autoValidate) this.__setValue(internalValue);

    const inputInvalid = (this.required && !internalValue) || !this.$.vaadinDatePicker.checkValidity();

    if (inputInvalid) {
      // Discover why the input is invalid (required / minimum / maximum).
      if (!internalValue) {
        this.__errorMessage = this.requiredErrorMessage;
      } else {
        const currentDate = moment(internalValue);
        const minimumDate = moment(this.minimumDate);
        const maximumDate = moment(this.maximumDate);

        if (currentDate < minimumDate) this.__errorMessage = this.minimumErrorMessage;
        if (currentDate > maximumDate) this.__errorMessage = this.maximumErrorMessage;
      }

      this.__setValue('');
    } else {
      this.__setValue(internalValue);
    }

    // Necessary to make sure the UI changes correctly.
    this.__inputInvalid = inputInvalid;
  }

  __setValue (value) {
    // Lock the observer from being triggered.
    if (this.__skipValueObserver !== value) {
      this.value = value;
    }
  }

  __setupDatePicker () {
    this.__datePicker = this.shadowRoot.querySelector('vaadin-date-picker-light');

    // Function to format a date into a String and the other way around.
    this.__datePicker.set('i18n.parseDate', date => this.__parseDate(date));
    this.__datePicker.set('i18n.formatDate', date => this.__formatDate(date));

    // Date picker translations.
    this.__datePicker.set('i18n.today', 'Hoje');
    this.__datePicker.set('i18n.cancel', 'Cancelar');
    this.__datePicker.set('i18n.weekdaysShort', ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']);
    this.__datePicker.set('i18n.weekdays', ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']);
    this.__datePicker.set('i18n.monthNames', ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']);
  }

  /**
   * This method formats the current vaadin-date-picker value into the defined format which by default is "DD-MM-YYYY".
   *
   * @param {Date} date The current vaadin-date-picker value.
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
    const regexMatches = date.match(/(?<day>\d{2}).?(?<month>\d{2}).?(?<year>\d{4})/);

    if (regexMatches && regexMatches.length === 4) {
      return {
        day: parseInt(regexMatches.groups.day),
        month: parseInt(regexMatches.groups.month) - 1,
        year: parseInt(regexMatches.groups.year),
      };
    }
  }

  /**
   * Observer that gets fired when the vaadin date picker overlay opens which should focus the paper input.
   *
   * @param {Boolean} isOverlayOpen Flag that states if the overlay is currently open.
   */
  __openedChanged (isOverlayOpen) {
    isOverlayOpen
      ? CasperOverlay.pushActiveOverlay(this.$.vaadinDatePicker.$.overlay)
      : CasperOverlay.removeActiveOverlay(this.$.vaadinDatePicker.$.overlay);

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
    // Close the date picker if the input becomes disabled.
    if (this.disabled) {
      this.close();
      this.shadowRoot.querySelector('casper-icon').style.color = '';
    } else {
      this.shadowRoot.querySelector('casper-icon').style.color = 'var(--primary-color)';
    }
  }
}

window.customElements.define('casper-date-picker', CasperDatePicker);
