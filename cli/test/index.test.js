import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, getModelOptions } from '../src/index.js';

test('parseArgs reads provider and model', () => {
  const opts = parseArgs(['--provider', 'gemini', '--model', 'gemini-2.0-flash']);
  assert.equal(opts.provider, 'gemini');
  assert.equal(opts.model, 'gemini-2.0-flash');
});

test('getModelOptions offers provider-specific model choices', () => {
  assert.ok(getModelOptions('openai').includes('gpt-4o-mini'));
  assert.ok(getModelOptions('gemini').includes('gemini-1.5-flash'));
  assert.ok(getModelOptions('openrouter').includes('openai/gpt-4o-mini'));
});
