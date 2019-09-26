/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
function noop() {}
/**
 * A mixin to be used with elements that consumes variables and environments
 * state. Contains all methods and listeners to kee variables and environments
 * up to date.
 *
 * @polymer
 * @mixinFunction
 * @memberof ArcComponents
 * @param {Class} base class
 * @return {Class}
 */
export const VariablesConsumerMixin = (base) => class extends base {
  static get properties() {
    return {
      /**
       * Currently activated environment.
       */
      environment: { type: String },
      /**
       * List of all available environments.
       * @type {Array<Object>}
       */
      environments: { type: Array },
      /**
       * List of available variables for the environment.
       * @type {Array<Object>}
       */
      variables: { type: Array },
      /**
       * Computed value, true if variables are available for current
       * environment.
       */
      _hasVariables: { type: Boolean },
      /**
       * Computed value, true if there's a list of environments set.
       */
      _hasEnvironments: { type: Boolean },
      /**
       * When set variables are not set automatically when element
       * is attached to the DOM.
       */
      noAutoLoad: { type: Boolean }
    };
  }

  get environment() {
    return this._environment;
  }

  set environment(value) {
    const old = this._environment;
    if (old === value) {
      return;
    }
    this._environment = value;
    if (this.requestUpdate) {
      this.requestUpdate('environment', old);
    }
    this._environmentChanged(value);
    this.dispatchEvent(new CustomEvent('environment-changed', {
      detail: {
        value
      }
    }));
  }

  get environments() {
    return this._environments;
  }

  set environments(value) {
    const old = this._environments;
    if (old === value) {
      return;
    }
    this._environments = value;
    this._hasEnvironments = !!(value && value.length);
    if (this.requestUpdate) {
      this.requestUpdate('environments', old);
    }
    this._environmentsChanged(value);
    this.dispatchEvent(new CustomEvent('environments-changed', {
      detail: {
        value
      }
    }));
  }

  get variables() {
    return this._variables;
  }

  set variables(value) {
    const old = this._variables;
    if (old === value) {
      return;
    }
    this._variables = value;
    this._hasVariables = !!(value && value.length);
    if (this.requestUpdate) {
      this.requestUpdate('variables', old);
    }
    this._variablesChanged(value);
    this.dispatchEvent(new CustomEvent('variables-changed', {
      detail: {
        value
      }
    }));
  }

  get hasVariables() {
    return this._hasVariables;
  }

  get hasEnvironments() {
    return this._hasEnvironments;
  }

  constructor() {
    super();
    this._envChangedHandler = this._envChangedHandler.bind(this);
    this._varListChangedHandler = this._varListChangedHandler.bind(this);
    this._varUpdateHandler = this._varUpdateHandler.bind(this);
    this._varDeleteHandler = this._varDeleteHandler.bind(this);
    this._envDeleteHandler = this._envDeleteHandler.bind(this);
    this._envUpdateHandler = this._envUpdateHandler.bind(this);
    this._dataImportHandler = this._dataImportHandler.bind(this);
    this._onDatabaseDestroy = this._onDatabaseDestroy.bind(this);
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }

    window.addEventListener('selected-environment-changed', this._envChangedHandler);
    window.addEventListener('variables-list-changed', this._varListChangedHandler);
    window.addEventListener('variable-updated', this._varUpdateHandler);
    window.addEventListener('variable-deleted', this._varDeleteHandler);
    window.addEventListener('environment-deleted', this._envDeleteHandler);
    window.addEventListener('environment-updated', this._envUpdateHandler);
    window.addEventListener('data-imported', this._dataImportHandler);
    window.addEventListener('datastore-destroyed', this._onDatabaseDestroy);
    if (!this.noAuthoLoad) {
      this._initializeVariables();
    }
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    window.removeEventListener('selected-environment-changed', this._envChangedHandler);
    window.removeEventListener('variables-list-changed', this._varListChangedHandler);
    window.removeEventListener('variable-updated', this._varUpdateHandler);
    window.removeEventListener('variable-deleted', this._varDeleteHandler);
    window.removeEventListener('environment-deleted', this._envDeleteHandler);
    window.removeEventListener('environment-updated', this._envUpdateHandler);
    window.removeEventListener('data-imported', this._dataImportHandler);
    window.removeEventListener('datastore-destroyed', this._onDatabaseDestroy);
  }
  /**
   * To be overritem by implementing elements
   */
  _variablesChanged() {}
  /**
   * To be overritem by implementing elements
   */
  _environmentsChanged() {}
  /**
   * To be overritem by implementing elements
   */
  _environmentChanged() {}
  /**
   * Dispatches bubbling and composed custom event.
   * By default the event is cancelable until `cancelable` property is set to false.
   * @param {String} type Event type
   * @param {?any} detail A detail to set
   * @param {?Boolean} cancelable When false the event is not cancelable.
   * @return {CustomEvent}
   */
  _dispatch(type, detail, cancelable) {
    if (typeof cancelable !== 'boolean') {
      cancelable = true;
    }
    const e = new CustomEvent(type, {
      bubbles: true,
      composed: true,
      cancelable,
      detail
    });
    this.dispatchEvent(e);
    return e;
  }
  /**
   * Handler for `data-imported` cutom event.
   * Refreshes environments list.
   *
   * @return {Promise}
   */
  async _dataImportHandler() {
    try {
      await this.refreshEnvironments();
    } catch (_) {
      noop();
    }
  }
  /**
   * Handler for the `datastore-destroyed` custom event.
   *
   * @param {CustomEvent} e
   * @return {Boolean} True if scheduled refresh flow.
   */
  _onDatabaseDestroy(e) {
    let { datastore } = e.detail;
    if (!datastore || !datastore.length) {
      return false;
    }
    if (typeof datastore === 'string') {
      datastore = [datastore];
    }
    if (datastore.indexOf('variables') === -1 &&
      datastore.indexOf('variables-environments') === -1 &&
      datastore[0] !== 'all') {
      return false;
    }
    setTimeout(() => this._resetAfterDestroyed());
    return true;
  }

  async _resetAfterDestroyed() {
    this.environment = undefined;
    await this._initializeVariables();
  }
  /**
   * Asks variables manager for current environment and variables.
   *
   * Note, At the moment of initialization the manager may not be in the DOM.
   * In this case the initialization fails. However, when the manager is
   * initialized it dispatched events to update variables and environments.
   * @return {Promise}
   */
  async _initializeVariables() {
    if (this.environment) {
      return Promise.resolve();
    }
    this.refreshState();
    try {
      await this.refreshEnvironments();
    } catch (_) {
      noop();
    }
  }
  /**
   * Refreshes list of variables and current environment.
   */
  refreshState() {
    const e = this._dispatch('environment-current', {});
    if (!e.defaultPrevented) {
      // silently exit, be a good citizen
      return;
    }
    this.environment = e.detail.environment;
    let vars = e.detail.variables;
    if (!(vars instanceof Array)) {
      vars = [];
    }
    vars = Array.from(vars);
    vars.sort(this._varSortFn);
    this.variables = vars;
  }
  /**
   * Refreshes list of environments.
   * @return {Promise}
   */
  async refreshEnvironments() {
    const e = this._dispatch('environment-list', {});
    if (!e.defaultPrevented) {
      return Promise.reject(new Error('Variables model not found'));
    }
    const environments = await e.detail.result;
    this.environments = environments ? Array.from(environments) : undefined;
  }
  /**
   * Removes variables and updates environment.
   * @param {CustomEvent} e
   */
  _envChangedHandler(e) {
    const env = e.detail.value;
    if (env === this.environment) {
      return;
    }
    this.variables = undefined;
    this.environment = env;
  }

  /**
   * Handler for the `variables-list-changed` event.
   * Sets list of the variables.
   * @param {CustomEvent} e
   */
  _varListChangedHandler(e) {
    if (e.cancelable) {
      return;
    }
    const eventVars = e.detail.value;
    let vars;
    if (eventVars && eventVars.length) {
      vars = eventVars.map((item) => Object.assign({}, item));
      vars.sort(this._varSortFn);
    }
    this.variables = vars;
  }
  /**
   * Handler for `variable-updated` event. Updates variable in the list
   * if it is on it or adds it otherwise.
   * @param {CustomEvent} e
   */
  _varUpdateHandler(e) {
    if (e.cancelable) {
      return;
    }
    const variable = e.detail.value;
    if (variable.environment !== this.environment) {
      return;
    }
    if (!this.variables) {
      this.variables = [variable];
      return;
    }
    const id = variable._id;
    const index = this._getVariableIndex(id);
    const vars = this.variables;
    if (index === -1) {
      vars.push(variable);
    } else {
      vars[index] = variable;
    }
    vars.sort(this._varSortFn);
    this.variables = [...vars];
  }
  /**
   * Handler for `variable-deleted` event. Removes variable from the list
   * if it is on it.
   * @param {CustomEvent} e
   */
  _varDeleteHandler(e) {
    if (e.cancelable) {
      return;
    }
    const id = e.detail.id;
    const index = this._getVariableIndex(id);
    if (index === -1) {
      return;
    }
    const vars = this.variables;
    vars.splice(index, 1);
    this.variables = [...vars];
  }

  _varSortFn(a, b) {
    if (!a) {
      return 1;
    }
    if (!b) {
      return -1;
    }
    const aName = String(a.variable);
    const bName = String(b.variable);
    return aName.localeCompare(bName, {
      ignorePunctuation: true,
      sensitivity: 'base'
    });
  }
  /**
   * Finds variable index on the variables list.
   * @param {String} id PouchDB data id
   * @return {Number} Variable index or -1.
   */
  _getVariableIndex(id) {
    const vars = this.variables;
    if (!vars) {
      return -1;
    }
    return vars.findIndex((item) => item._id === id);
  }
  /**
   * Handler for non-cancelable `environment-deleted` event.
   * Removes environment if it exists on the list.
   * @param {CustomEvent} e
   */
  _envDeleteHandler(e) {
    if (e.cancelable) {
      return;
    }
    const envs = this.environments;
    if (!envs) {
      return;
    }
    const id = e.detail.id;
    const index = envs.findIndex((item) => item._id === id);
    if (index !== -1) {
      const envs = this.environments;
      envs.splice(index, 1);
      this.environments = [...envs];
    }
  }
  /**
   * Handler for non-cancelable `environment-updated` event.
   * Updates / adds environment to the list.
   * @param {CustomEvent} e
   */
  _envUpdateHandler(e) {
    if (e.cancelable) {
      return;
    }
    const envs = this.environments;
    const env = e.detail.value;
    if (!envs) {
      this.environments = [env];
      return;
    }
    const id = env._id;
    const index = envs.findIndex((item) => item._id === id);
    if (index === -1) {
      envs.push(env);
    } else {
      envs[index] = env;
    }
    this.environments = [...envs];
  }
};
