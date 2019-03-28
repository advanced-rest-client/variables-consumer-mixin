[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/variables-consumer-mixin.svg)](https://www.npmjs.com/package/@advanced-rest-client/variables-consumer-mixin)

[![Build Status](https://travis-ci.org/advanced-rest-client/variables-consumer-mixin.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/variables-consumer-mixin)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/variables-consumer-mixin)

# variables-consumer-mixin

A web components mixin to be used by elements that consumes variables.

The mixin works with:
- @advanced-rest-client/arc-models/variables-model.js (or compatible events API)
- @advanced-rest-client/variables-manager (or compatible events API)

By default the component using the mixin will query for current environment (the manager) and then
for variables list in the environment (data model). If this operation fails (for example model or
manager is still being initialized) then it listens for manager events to refresh its state.


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


## Usage

### Installation
```
npm install --save @advanced-rest-client/variables-consumer-mixin
```

### In a Polymer 3 element

```js
import {PolymerElement} from './node_modules/@polymer/polymer';
import {VariablesConsumerMixin} from './node_modules/@advanced-rest-client/variables-consumer-mixin/variables-consumer-mixin.js';

class SampleElement extends VariablesConsumerMixin(PolymerElement) {

}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/variables-consumer-mixin
cd api-url-editor
npm install
npm install -g polymer-cli
```

### Running the demo locally

```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
```
