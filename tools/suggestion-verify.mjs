// Verify: suggestions are contextual, varied, and every chip answers.
const API = 'http://localhost:8000/api/v1';
const login = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ email: 'sara@nutricare.test', password: 'password1234' }),
}).then((r) => r.json());

async function chat(message, locale, sessionId = null) {
  return fetch(`${API}/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${login.token}`,
      'Accept-Language': locale,
    },
    body: JSON.stringify({ message, session_id: sessionId, locale }),
  })
    .then((r) => r.json())
    .then((j) => j.data);
}

const isFallback = (r) =>
  r?.reply?.includes("didn't quite catch") || r?.reply?.includes('لم أفهم السؤال');

let fails = 0;
const seeds = [
  ['en', 'Is koshari bad for diabetes?'],
  ['en', 'What do you think about molokhia?'],
  ['en', 'hello'],
  ['ar', 'هل البطاطس المحمرة مضرة للقلب؟'],
  ['ar', 'الأرز ولا المكرونة للسكر؟'],
];

for (const [locale, seed] of seeds) {
  const r1 = await chat(seed, locale);
  console.log(`\nseed [${locale}]: ${seed}`);
  console.log(`  suggestions r1: ${(r1.suggestions ?? []).join(' | ')}`);

  // each suggestion must produce a real answer
  for (const q of r1.suggestions ?? []) {
    const a = await chat(q, locale, r1.session_id);
    const bad = isFallback(a);
    if (bad) fails++;
    console.log(`  ${bad ? 'FALLBACK!' : 'answers ok'} — ${q}`);
  }

  // a second ask of the same seed should reshuffle (not the identical set)
  const r2 = await chat(seed, locale, r1.session_id);
  const same = JSON.stringify(r1.suggestions) === JSON.stringify(r2.suggestions);
  console.log(`  suggestions r2: ${(r2.suggestions ?? []).join(' | ')} ${same ? '(SAME SET)' : '(varied)'}`);
}

console.log(fails === 0 ? '\nALL SUGGESTIONS ANSWER ✓' : `\n${fails} FALLBACK SUGGESTIONS ✗`);
