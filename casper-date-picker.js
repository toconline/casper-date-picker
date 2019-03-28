import moment from 'moment/src/moment.js';
import '@polymer/paper-input/paper-input.js';
import '@vaadin/vaadin-date-picker/theme/material/vaadin-date-picker-light.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperDatePicker extends PolymerElement {
  static get template() {
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
        value="{{_internalValue}}"
        opened="{{_isPickerOverlayOpened}}">
        <paper-input
          disabled="[[disabled]]"
          invalid="{{_inputInvalid}}"
          label="[[inputPlaceholder]]"
          error-message="[[_errorMessage]]">
          <iron-icon icon="casper-icons:date-range" slot="suffix"></iron-icon>
        </paper-input>
      </vaadin-date-picker-light>
    `;
  }

  static get is() {
    return 'casper-date-picker';
  }

  static get properties() {
    return {
      required: Boolean,
      minimumDate: String,
      maximumDate: String,
      inputPlaceholder: String,
      autoValidate: {
        type: Boolean,
        value: false
      },
      minimumErrorMessage: {
        type: String,
        value: 'A data não pode ser inferior ao limite mínimo'
      },
      maximumErrorMessage: {
        type: String,
        value: 'A data não pode ser superior ao limite máximo'
      },
      requiredErrorMessage: {
        type: String,
        value: 'Este campo deve ser preenchido.',
      },
      disabled: {
        type: Boolean,
        observer: '_disabledChanged'
      },
      format : {
        type: String,
        value: 'DD-MM-YYYY'
      },
      value: {
        type: String,
        notify: true,
        observer: '_valueChanged'
      },
      _inputInvalid: {
        type: Boolean,
        value: false,
      },
      _isPickerOverlayOpened: {
        type: Boolean,
        value: false,
        observer: '_isPickerOverlayOpenedChanged'
      },
      _internalValue: {
        type: String,
        observer: '_internalValueChanged'
      }
    };
  }

  ready () {
    super.ready();

    this._datePicker = this.shadowRoot.querySelector('vaadin-date-picker-light');
    this._datePickerInput = this.shadowRoot.querySelector('paper-input');
    this._datePicker.addEventListener('click', event => this._shouldOpenDatePicker(event));

    this._setupDatePicker();
  }

  _valueChanged (value) {
    if (this._valueLock) {
      this._valueLock = false;
      return;
    }

    this._internalValue = value;
  }

  _internalValueChanged (internalValue) {
    if (!this.autoValidate || !this._datePickerInput) return;

    const inputInvalid = (this.required && !internalValue) || !this.$.vaadinDatePicker.checkValidity();

    if (inputInvalid) {
      // Discover why the input is invalid (required / minimum / maximum).
      if (!internalValue) this._errorMessage = this.requiredErrorMessage;

      const currentDate = moment(internalValue);
      const minimumDate = moment(this.minimumDate);
      const maximumDate = moment(this.maximumDate);

      if (currentDate < maximumDate) this._errorMessage = this.minimumErrorMessage;
      if (currentDate > maximumDate) this._errorMessage = this.maximumErrorMessage;

      this._setValue('');
    } else {
      this._setValue(internalValue);
    }

    // Necessary to make sure the UI changes correctly.
    afterNextRender(this._datePickerInput, () => {
      this._inputInvalid = inputInvalid;
    });

    return !inputInvalid;
  }

  _setValue (value) {
    // Lock the observer from being triggered.
    this._valueLock = true;
    this.value = value;
  }

  open () {
    this._isPickerOverlayOpened = true;
  }

  close () {
    this._isPickerOverlayOpened = false;
  }

  toggle () {
    this._isPickerOverlayOpened = !this._isPickerOverlayOpened;
  }

  _setupDatePicker () {
    // Function to format a date into a String and the other way around.
    this._datePicker.set('i18n.parseDate', date => this._parseDate(date));
    this._datePicker.set('i18n.formatDate', date => this._formatDate(date));

    // Date picker translations.
    this._datePicker.set('i18n.today', 'Hoje');
    this._datePicker.set('i18n.cancel', 'Cancelar');
    this._datePicker.set('i18n.weekdaysShort', ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']);
    this._datePicker.set('i18n.weekdays', ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']);
    this._datePicker.set('i18n.monthNames', ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']);
  }

  _formatDate (date) {
    return moment(new Date(date.year, date.month, date.day)).format(this.format);
  }

  _parseDate (date) {
    const regexMatches = date.match(/(\d{2}).?(\d{2}).?(\d{4})/);

    if (regexMatches && regexMatches.length === 4) {
      return {
        day: parseInt(regexMatches[1]),
        month: parseInt(regexMatches[2]) - 1,
        year: parseInt(regexMatches[3]),
      };
    }
  }

  _shouldOpenDatePicker () {
    this._isPickerOverlayOpened = !this.disabled;
  }

  _isPickerOverlayOpenedChanged (isOverlayOpen) {
    if (this._focusDatePickerTimeout) clearTimeout(this._focusDatePickerTimeout);

    if (!this._datePickerInput || !isOverlayOpen) return;

    this._focusDatePickerTimeout = setTimeout(() => {
      this._datePickerInput.blur();
      this._datePickerInput.focus();
    }, 15);
  }

  _disabledChanged () {
    // Close the date picker if the input becomes disabled.
    if (this.disabled) this._isPickerOverlayOpened = false;
  }
}

window.customElements.define(CasperDatePicker.is, CasperDatePicker);
