// BM25 search over the CV, as pure functions: no DOM, no globals, no I/O.
// Callers pass plain passages and get ids back, so this can be unit-tested in
// Node and the page decides how to show the results. Spec: docs/specs/001.

/** Words that carry no meaning in a question about a CV (Spanish and English). */
const STOP = new Set(('de la el en y a que los las con por para un una es su se al lo como mas o tu tus tienes tiene has ha he mi mis sobre cual cuales del te usas usa sabes trabajado hecho hace haces puedes cuanto cuanta cuantos cuantas eres soy esta estas tipo nivel algo alguna vez desde usado ' +
  'the an of in on and or to is are do does you your have has with what which how for about tell me i my can did any it at as be been that this level kind ever since used use approach').split(' '));

/** Lowercase and strip accents, so "Formación" and "formacion" are one word. */
export const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** The lightest stemmer that helps here: a trailing plural "s" goes. */
const stem = (w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);

/** Words of a text, normalized, without stopwords, stemmed. Keeps # and + (C#, C++). */
export function tokenize(text) {
  return (normalize(text).match(/[a-z0-9#+]+/g) || []).filter((w) => !STOP.has(w)).map(stem);
}

/**
 * Synonym groups. They widen the ranking (asking for "sql" reaches PostgreSQL
 * and Snowflake) but never the highlighting, which stays on what was typed.
 * Kept out on purpose, because they are false friends in this CV (spec 005):
 * data (Allergan Data Labs), donde/where, based/role (role-based permissions),
 * remoto/remote in the location group (remote proctoring; they keep a
 * work-mode group of their own), education (Laureate Education),
 * flow (financing flows), github (GitHub Actions). Project names are not
 * synonyms of each other either: asking about trainer-flow pulled latino-migra.
 * Typed, they still match.
 */
const GROUPS = [
  'aws lambda sqs sns s3 dynamodb cloud nube serverless rekognition',
  'cola queue mensajeria messaging evento event sqs sns rabbitmq asincrona asynchronous',
  'ia ai inteligencia artificial llm gemini mcp agente agent',
  'liderazgo lider liderado liderar lidere liderando leadership lead led leading mentoria mentoreado mentoreando mentoring mentored mentor onboarding equipo team',
  'ingles english idioma language portugues portuguese espanol spanish',
  'vives vive vivo ubicacion location live zaragoza puesto contrato contract indefinido permanent busca buscas busco looking disponibilidad availability inmediata available',
  'remoto remote hibrido hybrid teletrabajo',
  'test testing prueba calidad quality jest cypress cobertura coverage pytest selenium',
  'frontend front react angular',
  'dato base database sql postgresql mongodb snowflake dynamodb firestore',
  'devops ci cd docker kubernetes pipeline actions despliegue deploy',
  'estudio estudiaste estudiar estudiado carrera study studied studies formacion universidad university master licenciatura degree titulo bachelor',
  'guardia oncall call incidente incident datadog observabilidad observability monitoring',
  'api graphql apollo endpoint disenado designed',
  'pausa break hueco gap crianza parenting ahora now actualmente currently',
  'backend back node nodejs typescript express',
  'proyecto project portfolio portafolio',
].map((g) => g.split(' ').map(stem));

const SYNONYMS = new Map();
for (const group of GROUPS) {
  for (const w of group) {
    if (!SYNONYMS.has(w)) SYNONYMS.set(w, new Set());
    for (const x of group) if (x !== w) SYNONYMS.get(w).add(x);
  }
}

/** Default weight per CV section: experience and projects are the evidence. */
// Cases weigh less than the CV they illustrate: detail on projects the CV already lists.
export const DEFAULT_BOOST = Object.freeze({ exp: 1.3, proj: 1.15, skills: 0.55, case: 0.7 });

/** Synonyms count a little over half a typed word. */
const SYNONYM_WEIGHT = 0.55;
/** BM25 parameters: term-frequency saturation and length normalization. */
const K1 = 1.4;
const B = 0.6;

function check(cond, message) {
  if (!cond) throw new TypeError(`search: ${message}`);
}

/**
 * Build an index from passages. `text` is the whole passage (title and lines),
 * which is what gets ranked; `lines` are the parts that can be quoted back.
 * @param {{id: string, section: string, text: string, lines?: {text: string}[]}[]} docs
 * @param {{boost?: Record<string, number>}} [options]
 */
export function createIndex(docs, { boost = DEFAULT_BOOST } = {}) {
  check(Array.isArray(docs), 'docs must be an array');
  check(docs.length > 0, 'docs must not be empty');
  const seen = new Set();
  const df = new Map();
  const passages = docs.map((d, i) => {
    check(d && typeof d === 'object', `doc ${i} is not an object`);
    check(typeof d.id === 'string' && d.id !== '', `doc ${i} needs a non-empty string id`);
    check(!seen.has(d.id), `duplicate id "${d.id}"`);
    seen.add(d.id);
    check(typeof d.section === 'string', `doc "${d.id}" needs a section`);
    check(typeof d.text === 'string', `doc "${d.id}" needs text`);
    const lines = d.lines ?? [{ text: d.text }];
    check(Array.isArray(lines) && lines.length > 0, `doc "${d.id}" needs at least one line`);
    const words = tokenize(d.text);
    const tf = new Map();
    for (const w of words) tf.set(w, (tf.get(w) || 0) + 1);
    for (const w of tf.keys()) df.set(w, (df.get(w) || 0) + 1);
    return {
      id: d.id,
      section: d.section,
      tf,
      len: words.length,
      lines: lines.map((l, j) => {
        check(l && typeof l.text === 'string', `doc "${d.id}" line ${j} needs text`);
        return new Set(tokenize(l.text));
      }),
    };
  });
  const avgLen = passages.reduce((a, p) => a + p.len, 0) / passages.length;
  return { passages, df, avgLen, boost };
}

/** Typed words weigh 1; their synonyms weigh less, unless also typed. */
function weighted(terms) {
  const w = new Map();
  for (const t of terms) w.set(t, 1);
  for (const t of terms) for (const x of SYNONYMS.get(t) || []) if (!w.has(x)) w.set(x, SYNONYM_WEIGHT);
  return w;
}

/**
 * Rank passages for a question.
 * Returns up to `limit` hits within `cutoff` of the best score. Each hit has
 * `lines`, the positions of its best one or two lines (in reading order),
 * `matched`, the query words, typed or synonym, found in it, and `synonyms`,
 * the subset of `matched` that was not typed: evidence the page can show.
 * `sections`, when given, restricts which passages may answer; idf still
 * comes from the whole index, so a word weighs the same in every mode.
 * @param {ReturnType<typeof createIndex>} index
 * @param {string} query
 * @param {{limit?: number, cutoff?: number, sections?: string[]}} [options]
 */
export function search(index, query, { limit = 3, cutoff = 0.35, sections } = {}) {
  check(index && Array.isArray(index.passages), 'index must come from createIndex()');
  check(typeof query === 'string', 'query must be a string');
  check(sections === undefined || (Array.isArray(sections) && sections.length > 0 && sections.every((x) => typeof x === 'string')),
    'sections must be a non-empty array of strings');
  const allowed = sections && new Set(sections);
  const terms = tokenize(query);
  if (!terms.length) return { terms: [], hits: [] };
  const w = weighted(terms);
  const N = index.passages.length;
  const typed = new Set(terms);
  const scored = index.passages.filter((p) => !allowed || allowed.has(p.section)).map((p) => {
    let s = 0;
    const matched = [];
    for (const [t, wt] of w) {
      const f = p.tf.get(t);
      if (!f) continue;
      const df = index.df.get(t);
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      s += wt * idf * (f * (K1 + 1)) / (f + K1 * (1 - B + B * p.len / index.avgLen));
      matched.push(t);
    }
    return { p, score: s * (index.boost[p.section] || 1), matched };
  }).filter((h) => h.score > 0).sort((a, b) => b.score - a.score);
  const best = scored.length ? scored[0].score : 0;
  const hits = scored.filter((h) => h.score >= best * cutoff).slice(0, limit).map((h) => {
    const ranked = h.p.lines
      .map((set, i) => ({ i, n: [...set].filter((t) => w.has(t)).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 2)
      .sort((a, b) => a.i - b.i)
      .map((x) => x.i);
    // A passage matched only in its title has no matching line: quote its first one.
    return { id: h.p.id, section: h.p.section, score: h.score, matched: h.matched,
      synonyms: h.matched.filter((t) => !typed.has(t)), lines: ranked.length ? ranked : [0] };
  });
  return { terms, hits };
}

/**
 * A matched stem as the text writes it: "kubernete" becomes "Kubernetes".
 * Splits the text the way tokenize() does; returns the stem itself when no
 * word of the text produces it.
 */
export function surfaceForm(text, stem) {
  for (const word of text.match(/[\p{L}\p{N}#+]+/gu) || []) if (tokenize(word)[0] === stem) return word;
  return stem;
}

/**
 * Should this word be highlighted for these query terms? Exact match, or one
 * containing the other once both are 3+ characters ("kube" marks "kubernetes").
 */
export function isHit(word, terms) {
  if (!word) return false;
  for (const q of terms) {
    if (word === q) return true;
    if (q.length >= 3 && (word.includes(q) || q.includes(word))) return true;
  }
  return false;
}
