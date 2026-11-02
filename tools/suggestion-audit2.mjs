// Audit 2: suggestions chained in a session + as admin (no conditions) + double-click.
const API = 'http://localhost:8000/api/v1';

async function chat(token, message, locale, sessionId = null) {
  return fetch(`${API}/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Accept-Language': locale,
    },
    body: JSON.stringify({ message, session_id: sessionId, locale }),
  }).then((r) => r.json());
}

const isFallback = (r) =>
  r.reply?.includes("didn't quite catch") || r.reply?.includes('لم أفهم السؤال');

for (const email of ['sara@nutricare.test', 'admin@nutricare.test']) {
  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password: email.startsWith('sara') ? 'password1234' : 'admin1234!' }),
  }).then((r) => r.json());

  // 1) chain: first question, then click each returned suggestion in sequence, twice
  let res = await chat(login.token, 'Is koshari bad for diabetes?', 'en');
  let sid = res.session_id;
  console.log(`\n=== ${email} — seed: ${isFallback(res) ? 'FALLBACK' : 'ok'}`);

  for (let round = 1; round <= 2; round++) {
    for (const q of res.data.suggestions ?? []) {
      const r2 = await chat(login.token, q, 'en', sid);
      sid = r2.data.session_id ?? sid;
      console.log(`${isFallback(r2) ? 'FALLBACK' : 'ok     '} r${round} [${q.slice(0, 45)}]`);
      if (isFallback(r2)) console.log('    reply:', (r2.data.reply || '').split('\n')[0].slice(0, 80));
    }
  }

  // 2) Arabic questions while session is EN-locale (frontend sends locale of UI)
  for (const q of ['كم سكر في ٣ تمرات؟', 'إيه بديل الشيبس؟']) {
    const r3 = await chat(login.token, q, 'en', sid);
    console.log(`${isFallback(r3) ? 'FALLBACK' : 'ok     '} cross-locale [${q}]`);
  }
}
