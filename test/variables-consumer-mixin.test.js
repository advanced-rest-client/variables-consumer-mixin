import { fixture, assert, defineCE, aTimeout } from '@open-wc/testing';
import sinon from 'sinon/pkg/sinon-esm.js';
import { VariablesConsumerMixin } from '../variables-consumer-mixin.js';

const tag = defineCE(class extends VariablesConsumerMixin(HTMLElement) {});

describe('VariablesConsumerMixin', function() {
  async function basicFixture() {
    return await fixture(`<${tag}></${tag}>`);
  }

  async function noAuthoLoadFixture() {
    return await fixture(`<${tag} noautoload></${tag}>`);
  }

  function noopEvent(e) {
    e.preventDefault();
    e.detail.result = Promise.resolve();
  }

  function noopEnvironmentList() {
    window.addEventListener('environment-list', function f(e) {
      window.removeEventListener('environment-list', f);
      noopEvent(e);
    });
  }

  function rejectEnvironmentList() {
    window.addEventListener('environment-list', function f(e) {
      window.removeEventListener('environment-list', f);
      e.preventDefault();
      e.detail.result = Promise.reject(new Error('test'));
    });
  }

  function noopEnvironmentCurrent() {
    window.addEventListener('environment-current', function f(e) {
      window.removeEventListener('environment-current', f);
      e.preventDefault();
      e.detail.result = Promise.resolve({
        environment: '',
        variables: []
      });
    });
  }

  describe('Initialization flow', () => {
    it('Asks for current environment', async () => {
      noopEnvironmentList();
      let called = false;
      window.addEventListener('environment-current', function f() {
        window.removeEventListener('environment-current', f);
        called = true;
      });
      await basicFixture();
      assert.isTrue(called);
    });

    it('Sets environment from the event', async () => {
      noopEnvironmentList();
      window.addEventListener('environment-current', function f(e) {
        window.removeEventListener('environment-current', f);
        e.preventDefault();
        e.detail.environment = 'test';
      });
      const element = await basicFixture();
      assert.equal(element.environment, 'test');
    });

    it('Sets variables from the event', async () => {
      noopEnvironmentList();
      window.addEventListener('environment-current', function f(e) {
        window.removeEventListener('environment-current', f);
        e.preventDefault();
        e.detail.variables = ['test'];
      });
      const element = await basicFixture();
      assert.deepEqual(element.variables, ['test']);
    });

    it('Asks for environments list', async () => {
      let called = false;
      window.addEventListener('environment-list', function f(e) {
        window.removeEventListener('environment-list', f);
        noopEvent(e);
        called = true;
      });
      await basicFixture();
      assert.isTrue(called);
    });

    it('Sets environments list from the event', async () => {
      window.addEventListener('environment-list', function f(e) {
        window.removeEventListener('environment-list', f);
        e.preventDefault();
        e.detail.result = Promise.resolve(['test']);
      });
      const element = await basicFixture();
      await aTimeout();
      assert.deepEqual(element.environments, ['test']);
    });

    it('refreshEnvironments() rejects when no model', async () => {
      noopEnvironmentList();
      const element = await basicFixture();
      let called = false;
      try {
        await element.refreshEnvironments();
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });
  });

  describe('_dispatch()', () => {
    let element;
    beforeEach(async () => {
      element = await noAuthoLoadFixture();
    });

    const eName = 'test-event';
    const eDetail = 'test-detail';

    it('Dispatches an event', () => {
      const spy = sinon.spy();
      element.addEventListener(eName, spy);
      element._dispatch(eName);
      assert.isTrue(spy.called);
    });

    it('Returns the event', () => {
      const e = element._dispatch(eName);
      assert.typeOf(e, 'customevent');
    });

    it('Event is cancelable by default', () => {
      const e = element._dispatch(eName);
      assert.isTrue(e.cancelable);
    });

    it('Event is composed', () => {
      const e = element._dispatch(eName);
      if (typeof e.composed !== 'undefined') {
        assert.isTrue(e.composed);
      }
    });

    it('Event bubbles', () => {
      const e = element._dispatch(eName);
      assert.isTrue(e.bubbles);
    });

    it('Event is not cancelable when set', () => {
      const e = element._dispatch(eName, eDetail, false);
      assert.isFalse(e.cancelable);
    });

    it('Event has detail', () => {
      const e = element._dispatch(eName, eDetail);
      assert.equal(e.detail, eDetail);
    });
  });

  describe('_initializeVariables()', () => {
    let element;
    beforeEach(async () => {
      element = await noAuthoLoadFixture();
    });

    it('Does nothing when environment is set', () => {
      const spy = sinon.spy(element, 'refreshState');
      element.environment = 'test';
      element._initializeVariables();
      assert.isFalse(spy.called);
    });

    it('Calls refreshState()', () => {
      noopEnvironmentList();
      noopEnvironmentCurrent();
      const spy = sinon.spy(element, 'refreshState');
      element._initializeVariables();
      assert.isTrue(spy.called);
    });

    it('Calls refreshEnvironments()', () => {
      noopEnvironmentList();
      noopEnvironmentCurrent();
      const spy = sinon.spy(element, 'refreshEnvironments');
      element._initializeVariables();
      assert.isTrue(spy.called);
    });

    it('Handles promise rejection', () => {
      rejectEnvironmentList();
      return element._dataImportHandler();
    });
  });

  describe('_dataImportHandler()', () => {
    let element;
    beforeEach(async () => {
      element = await noAuthoLoadFixture();
    });

    it('Calls refreshEnvironments()', () => {
      noopEnvironmentList();
      const spy = sinon.spy(element, 'refreshEnvironments');
      element._dataImportHandler();
      assert.isTrue(spy.called);
    });

    it('Handles promise rejection', () => {
      rejectEnvironmentList();
      return element._dataImportHandler();
    });
  });

  describe('_onDatabaseDestroy()', () => {
    let element;
    beforeEach(async () => {
      noopEnvironmentList();
      noopEnvironmentCurrent();

      element = await noAuthoLoadFixture();
    });

    it('Does noting when no datastore property', () => {
      const result = element._onDatabaseDestroy({ detail: {} });
      assert.isFalse(result);
    });

    it('Does noting when empty datastore property', () => {
      const result = element._onDatabaseDestroy({
        detail: {
          datastore: []
        }
      });
      assert.isFalse(result);
    });

    it('Does noting when other datastore', () => {
      const result = element._onDatabaseDestroy({
        detail: {
          datastore: ['other']
        }
      });
      assert.isFalse(result);
    });

    it('Schedules refresh when "variables" datastore', async () => {
      const result = element._onDatabaseDestroy({
        detail: {
          datastore: ['variables']
        }
      });
      await aTimeout();
      assert.isTrue(result);
    });

    it('Schedules refresh when datastore is string', async () => {
      const result = element._onDatabaseDestroy({
        detail: {
          datastore: 'variables'
        }
      });
      await aTimeout();
      assert.isTrue(result);
    });

    it('Schedules refresh when "variables-environments" store', async () => {
      const result = element._onDatabaseDestroy({
        detail: {
          datastore: 'variables-environments'
        }
      });
      await aTimeout();
      assert.isTrue(result);
    });

    it('Schedules refresh when "all" store', async () => {
      const result = element._onDatabaseDestroy({
        detail: {
          datastore: 'all'
        }
      });
      await aTimeout();
      assert.isTrue(result);
    });

    it('Eventually resets "environment"', async () => {
      element._onDatabaseDestroy({
        detail: {
          datastore: 'all'
        }
      });
      await aTimeout();
      assert.isUndefined(element.environment);
    });

    it('Eventually calls refreshState()', async () => {
      element._onDatabaseDestroy({
        detail: {
          datastore: 'all'
        }
      });
      noopEnvironmentList();
      noopEnvironmentCurrent();
      const spy = sinon.spy(element, 'refreshState');
      await aTimeout();
      assert.isTrue(spy.called);
    });

    it('Eventually calls _initializeVariables()', async () => {
      element._onDatabaseDestroy({
        detail: {
          datastore: 'all'
        }
      });
      noopEnvironmentList();
      noopEnvironmentCurrent();
      const spy = sinon.spy(element, '_initializeVariables');
      await aTimeout();
      assert.isTrue(spy.called);
    });
  });

  function fire(type, detail, cancelable) {
    if (!detail) {
      detail = {};
    }
    const e = new CustomEvent(type, {
      bubbles: true,
      cancelable,
      detail
    });
    document.body.dispatchEvent(e);
  }

  describe('selected-environment-changed', function() {
    let element;
    beforeEach(async () => {
      noopEnvironmentList();
      element = await basicFixture();
    });

    it('Updates environment from the event', function() {
      fire('selected-environment-changed', {
        value: 'test'
      });
      assert.equal(element.environment, 'test');
    });

    it('Does nothing when the same environment', function() {
      element.environment = 'test';
      element.variables = [];
      fire('selected-environment-changed', {
        value: 'test'
      });
      assert.typeOf(element.variables, 'array');
    });

    it('Clears variables', function() {
      element.variables = ['test'];
      fire('selected-environment-changed', {
        value: 'test'
      });
      assert.isUndefined(element.variables);
    });
  });

  describe('variables-list-changed', function() {
    let element;
    let items;
    beforeEach(async () => {
      noopEnvironmentList();
      element = await basicFixture();
      items = [{ _id: 1 }, { _id: 2 }];
    });

    it('Updates variables from the event', function() {
      fire('variables-list-changed', {
        value: items
      });
      assert.deepEqual(element.variables, items);
    });

    it('Variables list is a copy', function() {
      fire('variables-list-changed', {
        value: items
      });
      items[0]._id = 3;
      assert.equal(element.variables[0]._id, 1);
    });

    it('Does nothing if event is cancelable', function() {
      fire(
        'variables-list-changed',
        {
          value: items
        },
        true
      );
      assert.isUndefined(element.variables);
    });
  });

  describe('variable-updated', function() {
    let element;
    let items;
    beforeEach(async () => {
      noopEnvironmentList();
      element = await basicFixture();
      items = [
        {
          _id: 'a',
          environment: 'test',
          value: 'a'
        },
        {
          _id: 'b',
          environment: 'test',
          value: 'b'
        }
      ];
    });

    it('Ignores the event when different environment', () => {
      element.environment = 'default';
      fire('variable-updated', {
        value: items[0]
      });
      assert.isUndefined(element.variables);
    });

    it('Adds variable to undefined list', () => {
      element.environment = 'test';
      fire('variable-updated', {
        value: items[0]
      });
      assert.deepEqual(element.variables, [items[0]]);
    });

    it('Appends variable to the list', () => {
      element.environment = 'test';
      element.variables = [items[0]];
      fire('variable-updated', {
        value: items[1]
      });
      assert.deepEqual(element.variables, items);
    });

    it('Updates a variable', () => {
      element.environment = 'test';
      element.variables = items;
      const item = Object.assign({}, items[0]);
      item.value = 'c';
      fire('variable-updated', {
        value: item
      });
      assert.deepEqual(element.variables[0], item);
    });

    it('Does nothing if event is cancelable', function() {
      const item = Object.assign({}, items[0]);
      fire(
        'variable-updated',
        {
          value: item
        },
        true
      );
      assert.isUndefined(element.variables);
    });
  });

  describe('variable-deleted', function() {
    let element;
    let items;
    beforeEach(async () => {
      noopEnvironmentList();
      element = await basicFixture();
      items = [{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }];
      element.variables = items;
    });

    it('Does nothing when no items on the list', function() {
      fire('variable-deleted', {
        id: 'x'
      });
      // no error
    });

    it('Removes item from the list', function() {
      fire('variable-deleted', {
        id: 'b'
      });
      assert.lengthOf(element.variables, 2);
      assert.equal(element.variables[0]._id, 'a');
      assert.equal(element.variables[1]._id, 'c');
    });

    it('Does nothing when event is cancelable', function() {
      fire(
        'variable-deleted',
        {
          id: 'b'
        },
        true
      );
      assert.lengthOf(element.variables, 3);
    });
  });

  describe('environment-deleted', function() {
    let element;
    let items;
    beforeEach(async () => {
      noopEnvironmentList();
      element = await basicFixture();
      items = [{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }];
      element.environments = items;
    });

    it('Does nothing when no items on the list', function() {
      fire('environment-deleted', {
        id: 'x'
      });
      // no error
    });

    it('Removes item from the list', function() {
      fire('environment-deleted', {
        id: 'b'
      });
      assert.lengthOf(element.environments, 2);
      assert.equal(element.environments[0]._id, 'a');
      assert.equal(element.environments[1]._id, 'c');
    });

    it('Does nothing when event is cancelable', function() {
      fire(
        'environment-deleted',
        {
          id: 'b'
        },
        true
      );
      assert.lengthOf(element.environments, 3);
    });

    it('Does nothing when environments are not set', function() {
      element.environments = undefined;
      fire('environment-deleted', {
        id: 'b'
      });
    });
  });

  describe('environment-updated', function() {
    let element;
    let items;
    beforeEach(async () => {
      noopEnvironmentList();
      element = await basicFixture();
      items = [
        {
          _id: 'a',
          name: 'a'
        },
        {
          _id: 'b',
          name: 'b'
        }
      ];
    });

    it('Adds environment to undefined list', () => {
      fire('environment-updated', {
        value: items[0]
      });
      assert.deepEqual(element.environments, [items[0]]);
    });

    it('Appends environment to the list', () => {
      element.environments = [items[0]];
      fire('environment-updated', {
        value: items[1]
      });
      assert.deepEqual(element.environments, items);
    });

    it('Updates an environment', () => {
      element.environments = items;
      const item = Object.assign({}, items[0]);
      item.name = 'c';
      fire('environment-updated', {
        value: item
      });
      assert.deepEqual(element.environments[0], item);
    });

    it('Does nothing when event is cancelable', () => {
      element.environments = items;
      const item = Object.assign({}, items[0]);
      item.name = 'c';
      fire(
        'environment-updated',
        {
          value: item
        },
        true
      );
      assert.deepEqual(element.environments, items);
    });
  });

  describe('Auto computations', function() {
    let element;
    beforeEach(async () => {
      noopEnvironmentList();
      element = await basicFixture();
    });

    it('hasVariables is undefined by default', function() {
      assert.isUndefined(element.hasVariables);
    });

    it('hasVariables is computed', function() {
      element.variables = [
        {
          _id: 'b',
          bariable: 'b'
        }
      ];
      assert.isTrue(element.hasVariables);
    });

    it('hasEnvironments is undefined by default', function() {
      assert.isUndefined(element.hasEnvironments);
    });

    it('hasEnvironments is computed', function() {
      element.environments = [
        {
          _id: 'b',
          name: 'b'
        }
      ];
      assert.isTrue(element.hasEnvironments);
    });
  });
});
