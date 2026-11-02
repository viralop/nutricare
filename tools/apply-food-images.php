<?php
// Apply corrected food image URLs to DB + seeder file.
const UTM = '?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail';
$map = [
  'green-olives' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/DFC_3933_A_close-up_of_a_pile_of_pitted_green_olives_showing_their_smooth_glossy_skins_and_hollow_centers.jpg/500px-DFC_3933_A_close-up_of_a_pile_of_pitted_green_olives_showing_their_smooth_glossy_skins_and_hollow_centers.jpg' . UTM,
  'water' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Blue_glass_with_carbonated_water.jpg/500px-Blue_glass_with_carbonated_water.jpg' . UTM,
  'zaatar-manakish' => "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Manakish_Za%27atar.jpg/500px-Manakish_Za%27atar.jpg" . UTM,
  'taameya' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Falafel_3.JPG/500px-Falafel_3.JPG' . UTM,
  'salted-mixed-nuts' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Liat_Portal_for_Foodie_Disorder_-_Mixed_nuts_and_dried_cranberries.jpg/500px-Liat_Portal_for_Foodie_Disorder_-_Mixed_nuts_and_dried_cranberries.jpg' . UTM,
  'beef-liver' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/A_liver.jpg/500px-A_liver.jpg' . UTM,
  'peanuts-raw' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Arachis_hypogaea_-_Peanuts_in_shell.jpg/500px-Arachis_hypogaea_-_Peanuts_in_shell.jpg' . UTM,
  'guava' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/GUAVA_FRUIT.jpg/500px-GUAVA_FRUIT.jpg' . UTM,
  'banana' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Banana-Sitia-Crete.jpg/500px-Banana-Sitia-Crete.jpg' . UTM,
  'butter' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Block_of_butter_2020-09-28_2949b.jpg/500px-Block_of_butter_2020-09-28_2949b.jpg' . UTM,
  'potato-boiled' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Boiled%2C_floury_potatoes_%285299865427%29.jpg/500px-Boiled%2C_floury_potatoes_%285299865427%29.jpg' . UTM,
  'brown-rice-cooked' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b6/Bowl_of_Cooked_Brown_Rice.jpg/500px-Bowl_of_Cooked_Brown_Rice.jpg' . UTM,
  'grilled-chicken-breast' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Chicken_and_Zucchini_dinner.jpg/500px-Chicken_and_Zucchini_dinner.jpg' . UTM,
  'halawa-tahiniya' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/Halva_12-2015.jpg/500px-Halva_12-2015.jpg' . UTM,
  'spinach' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/A_pot_of_cut_spinach_leaves_with_carrots_and_onions.jpg/500px-A_pot_of_cut_spinach_leaves_with_carrots_and_onions.jpg' . UTM,
  'taro' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Taro_Root.jpg/500px-Taro_Root.jpg' . UTM,
  'ful-medames' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Foul_Mdammis%2C_Tunisie.jpg/500px-Foul_Mdammis%2C_Tunisie.jpg' . UTM,
  'strawberries' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Strawberries.JPG/500px-Strawberries.JPG' . UTM,
  'almonds' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Liat_Portal_for_Foodie_Disorder_-_Almonds.jpg/500px-Liat_Portal_for_Foodie_Disorder_-_Almonds.jpg' . UTM,
  'chickpeas-boiled' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Chickpeas_-_The_Coconut_Island_2025-10-05.jpg/500px-Chickpeas_-_The_Coconut_Island_2025-10-05.jpg' . UTM,
  'okra' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/Bucket_of_raw_okra_pods.jpg/500px-Bucket_of_raw_okra_pods.jpg' . UTM,
  'black-coffee' => 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/500px-A_small_cup_of_coffee.JPG' . UTM,
];

require 'C:/ai/app/api/vendor/autoload.php';
$app = require 'C:/ai/app/api/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$dbCount = 0;
foreach ($map as $slug => $url) {
  $f = App\Models\Food::where('slug', $slug)->first();
  if ($f) { $f->image_url = $url; $f->save(); $dbCount++; }
  else echo "WARN: no food row for $slug\n";
}

// Seeder file: replace existing entries, append missing ones.
$path = 'C:/ai/app/api/database/seeders/data/food-images.php';
$src = file_get_contents($path);
$replaced = 0; $appended = [];
foreach ($map as $slug => $url) {
  $newLine = "    '$slug' => '" . str_replace("'", "\\'", $url) . "',";
  if (preg_match("/^\s*'" . preg_quote($slug, '/') . "'\s*=>\s*'[^']*',/m", $src)) {
    $src = preg_replace("/^\s*'" . preg_quote($slug, '/') . "'\s*=>\s*'[^']*',/m", $newLine, $src, 1, $n);
    $replaced += $n;
  } else {
    $appended[] = $newLine;
  }
}
if ($appended) {
  $src = preg_replace("/\];\s*$/", implode("\n", $appended) . "\n];\n", $src, 1);
}
file_put_contents($path, $src);
echo "db updated: $dbCount, seeder replaced: $replaced, appended: " . count($appended) . "\n";
