// Audit: send each built-in suggestion through the API, flag fallback replies.
const API = 'http://localhost:8000/api/v1';
const login = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ email: 'sara@nutricare.test', password: 'password1234' }),
}).then((r) => r.json());

const suggestions = [
  ['en', 'Is rice okay for diabetes?'],
  ['en', 'How much sugar is in 3 dates?'],
  ['en', 'What can I eat instead of chips?'],
  ['en', 'Brown rice or white rice for cholesterol?'],
  ['ar', 'هل الأرز مناسب لمرضى السكر؟'],
  ['ar', 'كم سكر في ٣ تمرات؟'],
  ['ar', 'إيه بديل الشيبس؟'],
  ['ar', 'الفطور ولا العشاء أثقل للسكر؟'],
];

for (const [locale, q] of suggestions) {
  const res = await fetch(`${API}/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${login.token}`,
      'Accept-Language': locale,
    },
    body: JSON.stringify({ message: q, locale }),
  }).then((r) => r.json());
  const fellBack =
    res.reply?.includes("didn't quite catch") || res.reply?.includes('لم أفهم السؤال');
  console.log(`${fellBack ? 'FALLBACK' : 'ok      '} [${locale}] ${q}`);
  if (fellBack) console.log('   reply:', (res.reply || '').split('\n')[0].slice(0, 90));
}
