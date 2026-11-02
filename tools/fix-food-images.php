<?php
// One-off: find correct Commons photos for mismatched food images.
const UA = 'NutriCareImageFixer/1.0 (educational demo; contact: dev@nutricare.local)';

function fetch(string $url, bool $head = false): ?string {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 12,
    CURLOPT_USERAGENT => UA,
    CURLOPT_NOBODY => $head,
    // One-off read-only fetcher; this PHP build has no CA bundle configured.
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
  'green-olives' => 'green olives bowl',
  'water' => 'glass of water',
  'zaatar-manakish' => "za'atar manakish",
  'taameya' => 'ful medames egyptian',
  'salted-mixed-nuts' => 'mixed nuts bowl',
  'beef-liver' => 'beef liver',
  'peanuts-raw' => 'peanuts in shell',
  'guava' => 'guava fruit',
  'banana' => 'banana fruit',
  'butter' => 'butter block',
  'potato-boiled' => 'boiled potatoes',
  'brown-rice-cooked' => 'cooked brown rice',
  'grilled-chicken-breast' => 'grilled chicken breast',
  'halawa-tahiniya' => 'tahini halva',
  'spinach' => 'spinach leaves',
  'taro' => 'taro root',
  'ful-medames' => 'ful medames',
  'strawberries' => 'strawberries',
  'almonds' => 'almonds raw',
  'chickpeas-boiled' => 'cooked chickpeas',
  'okra' => 'okra pods',
  'black-coffee' => 'black coffee cup',
];

foreach ($targets as $slug => $query) {
  $api = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search'
    . '&gsrsearch=' . rawurlencode($query) . '&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=500';
  $body = fetch($api);
  if (!$body) { echo "$slug|FAIL:api\n"; continue; }
  $d = json_decode($body, true);
  $pages = $d['query']['pages'] ?? [];
  $found = null;
  foreach ($pages as $p) {
    $title = $p['title'] ?? '';
    $thumb = $p['imageinfo'][0]['thumburl'] ?? null;
    if (!$thumb) continue;
    if (preg_match('/\.pdf|\.svg|\.ogv|\.webm|\.tif/i', $title)) continue;
    $path = preg_replace('/\?.*$/', '', $thumb);
    if (!preg_match('/\.(jpe?g)$/i', $path)) continue;
    if (fetch($thumb, true) !== null) { $found = $thumb; break; }
  }
  echo $slug . '|' . ($found ?? 'FAIL:nomatch') . "\n";
  usleep(400000);
}
