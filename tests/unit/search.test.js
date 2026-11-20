// Unit tests for js/search.js: Node's built-in runner, no dependencies.
// Run: npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, normalize, createIndex, search, isHit, DEFAULT_BOOST } from '../../js/search.js';

const doc = (id, text, section = 'exp', lines) => ({ id, section, text, ...(lines ? { lines: lines.map((t) => ({ text: t })) } : {}) });

test('tokenize normalizes accents, drops stopwords and plural s, keeps C# and C++', () => {
  assert.equal(normalize('Formación ÁRBOL'), 'formacion arbol');
  assert.deepEqual(tokenize('¿Qué bases de datos has usado?'), ['base', 'dato']);
  assert.deepEqual(tokenize('C# and C++'), ['c#', 'c++']);
  assert.deepEqual(tokenize('bus gas'), ['bus', 'gas'], 'words of 3 letters keep their s');
  assert.deepEqual(tokenize('   '), []);
});

test('an empty question, or one made only of stopwords, returns nothing instead of throwing', () => {
  const index = createIndex([doc('a', 'Node.js services')]);
  assert.deepEqual(search(index, ''), { terms: [], hits: [] });
  assert.deepEqual(search(index, '¿Qué has hecho?'), { terms: [], hits: [] });
});

test('BM25: more occurrences rank higher, and a longer passage is penalized', () => {
  const index = createIndex([
    doc('once', 'kafka once among many many other unrelated words here'),
    doc('twice', 'kafka kafka twice'),
    doc('none', 'nothing relevant'),
  ]);
  const { hits } = search(index, 'kafka');
  assert.deepEqual(hits.map((h) => h.id), ['twice', 'once']);
  assert.ok(hits[0].score > hits[1].score);
});

test('a rare word outweighs a common one (idf)', () => {
  const index = createIndex([
    doc('common', 'docker'), doc('also-common', 'docker'), doc('rare', 'terraform'),
  ]);
  const { hits } = search(index, 'docker terraform', { cutoff: 0 });
  assert.equal(hits[0].id, 'rare');
});

test('synonyms widen the ranking, and each hit says which words matched', () => {
  const index = createIndex([doc('db', 'PostgreSQL and Snowflake in production'), doc('ui', 'React front end')]);
  const { terms, hits } = search(index, 'sql');
  assert.deepEqual(terms, ['sql'], 'terms are only what was typed');
  assert.equal(hits[0].id, 'db');
  assert.ok(hits[0].matched.includes('postgresql') || hits[0].matched.includes('snowflake'));
});

test('section boosts favour experience over skills by default, and can be replaced', () => {
  const docs = [doc('skill', 'graphql apis', 'skills'), doc('job', 'graphql apis', 'exp')];
  assert.equal(search(createIndex(docs), 'graphql').hits[0].id, 'job');
  assert.equal(search(createIndex(docs, { boost: { skills: 2 } }), 'graphql').hits[0].id, 'skill');
  assert.ok(Object.isFrozen(DEFAULT_BOOST));
});

test('results are capped by limit and by the cutoff relative to the best score', () => {
  const index = createIndex([
    doc('a', 'aws aws aws'), doc('b', 'aws aws'), doc('c', 'aws'), doc('d', 'aws plus many other words to dilute the score a lot more'),
  ]);
  assert.equal(search(index, 'aws').hits.length, 3, 'default limit is 3');
  assert.equal(search(index, 'aws', { limit: 1 }).hits.length, 1);
  assert.equal(search(index, 'aws', { cutoff: 0.99, limit: 10 }).hits.length, 1, 'only the best is within 99%');
});

test('quoted lines: the best two, in reading order; the first line when only the title matched', () => {
  // As on the page, text is the whole passage: its title plus its lines.
  const lines = ['Full stack development', 'Kubernetes and Docker pipelines', 'Mentoring', 'Docker images'];
  const index = createIndex([doc('intel', ['Intel Software Engineer', ...lines].join(' '), 'exp', lines)]);
  assert.deepEqual(search(index, 'docker kubernetes').hits[0].lines, [1, 3]);
  assert.deepEqual(search(index, 'intel').hits[0].lines, [0], 'title-only match quotes line 0');
});

test('a doc without lines is quoted as a whole', () => {
  const index = createIndex([doc('perfil', 'Backend engineer in Zaragoza')]);
  assert.deepEqual(search(index, 'zaragoza').hits[0].lines, [0]);
});

test('highlighting matches exact words, or containment from three letters', () => {
  assert.equal(isHit('kubernetes', ['kube']), true);
  assert.equal(isHit('aws', ['aws']), true);
  assert.equal(isHit('golang', ['go']), false, 'a query term under 3 letters only matches exactly');
  assert.equal(isHit('go', ['golang']), true, 'a 3+ letter query term matches a word it contains');
  assert.equal(isHit('', ['x']), false);
  assert.equal(isHit('react', ['vue']), false);
});

test('bad input fails loudly, with a message that says what was wrong', () => {
  assert.throws(() => createIndex('nope'), /docs must be an array/);
  assert.throws(() => createIndex([]), /must not be empty/);
  assert.throws(() => createIndex([null]), /doc 0 is not an object/);
  assert.throws(() => createIndex([{ section: 'exp', text: 'x' }]), /non-empty string id/);
  assert.throws(() => createIndex([doc('a', 'x'), doc('a', 'y')]), /duplicate id "a"/);
  assert.throws(() => createIndex([{ id: 'a', text: 'x' }]), /needs a section/);
  assert.throws(() => createIndex([{ id: 'a', section: 'exp' }]), /needs text/);
  assert.throws(() => createIndex([{ id: 'a', section: 'exp', text: 'x', lines: [] }]), /at least one line/);
  assert.throws(() => createIndex([{ id: 'a', section: 'exp', text: 'x', lines: [{}] }]), /line 0 needs text/);
  const index = createIndex([doc('a', 'x')]);
  assert.throws(() => search(index, 42), /query must be a string/);
  assert.throws(() => search({}, 'x'), /index must come from createIndex/);
  assert.throws(() => search(index, null), TypeError, 'and the error is a TypeError');
});
