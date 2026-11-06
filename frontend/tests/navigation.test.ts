import test from 'node:test';
import assert from 'node:assert/strict';
import { swipeDestination } from '../src/systems/worldNavigation.ts';
test('distinct swipes navigate both directions without wrapping or mistaking look movements', () => {
  assert.equal(swipeDestination('hello', -.3, .01), 'castle');
  assert.equal(swipeDestination('castle', -.3, .01), 'garden');
  assert.equal(swipeDestination('garden', .3, .01), 'castle');
  assert.equal(swipeDestination('castle', .3, .01), 'hello');
  assert.equal(swipeDestination('hello', .3, 0), null);
  assert.equal(swipeDestination('garden', -.3, 0), null);
  assert.equal(swipeDestination('hello', -.12, 0), null);
  assert.equal(swipeDestination('hello', -.3, .25), null);
});
