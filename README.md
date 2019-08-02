[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/variables-consumer-mixin.svg)](https://www.npmjs.com/package/@advanced-rest-client/variables-consumer-mixin)

[![Build Status](https://travis-ci.org/advanced-rest-client/variables-consumer-mixin.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/variables-consumer-mixin)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/variables-consumer-mixin)

# variables-consumer-mixin

A mixin function to be used by elements that consumes Advanced REST Client variables.

The mixin works with:
-   @advanced-rest-client/arc-models/variables-model.js (or compatible events API)
-   @advanced-rest-client/variables-manager (or compatible events API)

By default the component using the mixin queries for current environment (the manager) and then
for variables list in the environment (data model). If this operation fails (for example model or
manager is still being initialized) then it listens for manager events to refresh its state.

## Usage

### Installation
```
npm install --save @advanced-rest-client/variables-consumer-mixin
```

### In a LitElement template

```javascript
import { LitElement, html } from 'lit-element';
import { VariablesConsumerMixin } from '@advanced-rest-client/variables-consumer-mixin/variables-consumer-mixin.js';

class SampleElement extends VariablesConsumerMixin(LitElement) {
  ...
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/variables-consumer-mixin
cd variables-consumer-mixin
npm install
```

### Running the tests

```sh
npm test
```
