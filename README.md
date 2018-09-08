[![Build Status](https://travis-ci.org/advanced-rest-client/api-url-data-model.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/variables-consumer-mixin)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/variables-consumer-mixin)

# variables-consumer-mixin

Mixin to be used by elements that consumes variables

```html
<link rel="import" href="../variables-consumer-mixin/variables-consumer-mixin.html">
<dom-module id="vars-consumer">
  <script>
  /**
   * An example of implementation of VariablesConsumerMixin
   *
   * @customElement
   * @polymer
   * @appliesMixin ArcComponents.VariablesConsumerMixin
   */
  class VarsConsumer extends ArcComponents.VariablesConsumerMixin(Polymer.Element) {
    static get is() {return 'vars-consumer';}
    static get properties() {
      return {};
    }
  }
  window.customElements.define(VarsConsumer.is, VarsConsumer);
  </script>
</dom-module>
```

The consumer works with `advanced-rest-client/arc-models/variables-model` and `advanced-rest-client/variables-manager`.

The model provides access to the data store and the manager synchronizes the state
between consumers.

### API components

This components is a part of API components ecosystem: https://elements.advancedrestclient.com/
