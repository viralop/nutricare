<?php
// Round 2: pick candidates whose FILENAME contains a keyword.
const UA = 'NutriCareImageFixer/1.0 (educational demo; contact: dev@nutricare.local)';

function fetch(string $url, bool $head = false): ?string {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 12,
    CURLOPT_USERAGENT => UA,
    CURLOPT_NOBODY => $head,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => 0,
  ]);
  $out = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($code !== 200) return null;
  return $out;
}

$targets = [
  'taameya' => ['falafel balls', ['falafel']],
  'ful-medames' => ['foul mdammas', ['mdammas', 'medames', 'ful', 'foul']],
  'grilled-chicken-breast' => ['grilled chicken breast plate', ['grilled', 'chicken']],
  'halawa-tahiniya' => ['halva blocks', ['halva', 'halawa', 'tahini']],
  'taro' => ['taro corms root vegetable', ['taro', 'colocasia']],
  'strawberries' => ['strawberry fruit fresh', ['strawberri', 'strawberry']],
];

foreach ($targets as $slug => [$query, $keywords]) {
  $api = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search'
    . '&gsrsearch=' . rawurlencode($query) . '&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=500';
  $body = fetch($api);
  if (!$body) { echo "$slug|FAIL:api\n"; continue; }
  $d = json_decode($body, true);
  $pages = $d['query']['pages'] ?? [];
  $found = null;
  foreach ($pages as $p) {
    $thumb = $p['imageinfo'][0]['thumburl'] ?? null;
    if (!$thumb) continue;
    $file = urldecode(basename(preg_replace('/\?.*$/', '', $thumb)));
    $file = preg_replace('/^500px-/', '', $file);
    if (!preg_match('/\.(jpe?g)$/i', $file)) continue;
    $okKeyword = false;
    foreach ($keywords as $kw) if (stripos($file, $kw) !== false) { $okKeyword = true; break; }
    if (!$okKeyword) continue;
    if (preg_match('/herbarium|specimen|steamers|bekir|breakfast|mural|leaf/i', $file)) continue;
    if (fetch($thumb, true) !== null) { $found = $thumb; break; }
  }
  echo $slug . '|' . ($found ?? 'FAIL:nomatch') . "\n";
  usleep(400000);
}
