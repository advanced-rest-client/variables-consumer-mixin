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
import {dedupingMixin} from '../../@polymer/polymer/lib/utils/mixin.js';
import {afterNextRender} from '../../@polymer/polymer/lib/utils/render-status.js';
/**
 * A mixin to be used with elements that consumes variables and environments
 * state. Contains all methods and listeners to kee variables and environments
 * up to date.
 *
 * @polymer
 * @mixinFunction
 * @memberof ArcComponents
 */
export const VariablesConsumerMixin = dedupingMixin((base) => {
  /**
   * @polymer
   * @mixinClass
   */
  class AVCmixin extends base {
    static get properties() {
      return {
        /**
         * Currently activated environment.
         */
        environment: {
          type: String,
          notify: true
        },
        /**
         * List of all available environments.
         * @type {Array<Object>}
         */
        environments: {type: Array, notify: true},
        /**
         * List of available variables for the environment.
         * @type {Array<Object>}
         */
        variables: {type: Array, notify: true},
        /**
         * Computed value, true if variables are available for current
         * environment.
         */
        hasVariables: {
          type: Boolean,
          value: false,
          notify: true,
          computed: '_computeHasVariables(variables.length)'
        },
        /**
         * Computed value, true if there's a list of environments set.
         */
        hasEnvironments: {
          type: Boolean,
          value: false,
          notify: true,
          computed: '_computeHasEnvs(environments.length)'
        },
        /**
         * When set variables are not set automatically when element
         * is attached to the DOM.
         */
        noAuthoLoad: Boolean
      };
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
      super.connectedCallback();
      window.addEventListener('selected-environment-changed', this._envChangedHandler);
      window.addEventListener('variables-list-changed', this._varListChangedHandler);
      window.addEventListener('variable-updated', this._varUpdateHandler);
      window.addEventListener('variable-deleted', this._varDeleteHandler);
      window.addEventListener('environment-deleted', this._envDeleteHandler);
      window.addEventListener('environment-updated', this._envUpdateHandler);
      window.addEventListener('data-imported', this._dataImportHandler);
      window.addEventListener('datastore-destroyed', this._onDatabaseDestroy);
      if (!this.noAuthoLoad) {
        this._initVariables();
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
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
    _dataImportHandler() {
      return this.refreshEnvironments()
      .catch((cause) => console.warn(cause));
    }
    /**
     * Handler for the `datastore-destroyed` custom event.
     *
     * @param {CustomEvent} e
     * @return {Boolean} True if scheduled refresh flow.
     */
    _onDatabaseDestroy(e) {
      let {datastore} = e.detail;
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
      afterNextRender(this, () => {
        this.environment = undefined;
        this.refreshState();
        this._initVariables();
      });
      return true;
    }

    _initVariables() {
      this._initializeVariables();
      return this.refreshEnvironments()
      .catch((cause) => console.warn(cause));
    }
    /**
     * Asks variables manager for current environment and variables.
     *
     * Note, At the moment of initialization the manager may not be in the DOM.
     * In this case the initialization fails. However, when the manager is
     * initialized it dispatched events to update variables and environments.
     * @return {Promise}
     */
    _initializeVariables() {
      if (this.environment) {
        return Promise.resolve();
      }
      this.refreshState(true);
      return this.refreshEnvironments()
      .catch((cause) => console.warn(cause));
    }
    /**
     * Refreshes list of variables and current environment.
     * @param {Boolean} noThrows When set it does not throw error when model is
     * not found.
     */
    refreshState(noThrows) {
      const e = this._dispatch('environment-current', {});
      if (!e.defaultPrevented) {
        if (noThrows) {
          // The manager is still initializing. It dispatches `selected-environment-changed`
          // and `variables-list-changed` when it initialize.
          // It also may mean that the manager is not in the DOM but there's no
          // way to tell...
          return;
        }
        throw new Error('Variables model not found');
      }
      this.set('environment', e.detail.environment);
      this.set('variables', e.detail.variables);
    }
    /**
     * Refreshes list of environments.
     * @return {Promise}
     */
    refreshEnvironments() {
      const e = this._dispatch('environment-list', {});
      if (!e.defaultPrevented) {
        return this._retryRefreshEnv();
      }
      return e.detail.result
      .then((environments) => {
        if (this._retryingModel) {
          this._retryingModel = false;
        }
        this.set('environments', environments);
        return environments;
      })
      .catch((cause) => {
        if (this._retryingModel) {
          this._retryingModel = false;
        }
        throw cause;
      });
    }
    /**
     * Retries environment list refresh after next frame render.
     * @return {Promise}
     */
    _retryRefreshEnv() {
      if (this._retryingModel) {
        return Promise.reject(new Error('Variables model not found'));
      }
      this._retryingModel = true;
      return new Promise((resolve, reject) => {
        afterNextRender(this, () => {
          this.refreshEnvironments()
          .then((data) => resolve(data))
          .catch((cause) => reject(cause));
        });
      });
    }

    /**
     * Computes `hasVariables` property.
     * @param {Number} length
     * @return {Boolean} True if list is not empty.
     */
    _computeHasVariables(length) {
      return !!length;
    }
    /**
     * Computes `hasEnvironments` property.
     * @param {Number} length
     * @return {Boolean} True if list is not empty.
     */
    _computeHasEnvs(length) {
      return !!length;
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
      this.set('variables', undefined);
      this.set('environment', env);
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
      }
      this.set('variables', vars);
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
        this.set('variables', [variable]);
        return;
      }
      const id = variable._id;
      const index = this._getVariableIndex(id);
      if (index === -1) {
        this.push('variables', variable);
      } else {
        this.set(['variables', index], variable);
      }
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
      this.splice('variables', index, 1);
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
        this.splice('environments', index, 1);
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
        this.set('environments', [env]);
        return;
      }
      const id = env._id;
      const index = envs.findIndex((item) => item._id === id);
      if (index === -1) {
        this.push('environments', env);
      } else {
        this.set(`environments.${index}`, env);
      }
    }
  }
  return AVCmixin;
});
