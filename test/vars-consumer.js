import {PolymerElement} from '../../../@polymer/polymer/polymer-element.js';
import {VariablesConsumerMixin} from '../variables-consumer-mixin.js';
/**
 * An example of implementation of VariablesConsumerMixin
 *
 * @customElement
 * @polymer
 * @appliesMixin VariablesConsumerMixin
 */
class VarsConsumer extends VariablesConsumerMixin(PolymerElement) {
  static get properties() {
    return {

    };
  }
}
window.customElements.define('vars-consumer', VarsConsumer);
