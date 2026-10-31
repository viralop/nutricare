<?php

/**
 * Recipes: [slug, title_en, title_ar, meal_type, servings, minutes, cost_level,
 * suitable_conditions[], steps_en[], steps_ar[], ingredients[[food-slug|null, g, note_en, note_ar]]].
 * Nutrition per serving is estimated from ingredient data at seed time.
 */
return [
    ['oats-fruit-breakfast', 'Oats with fruit & cinnamon', 'شوفان بالفاكهة والقرفة', 'breakfast', 1, 10, 'low',
        ['diabetes_t2', 'hypertension', 'high_cholesterol', 'heart_disease', 'obesity', 'general_wellness'],
        ['Combine 40 g rolled oats with 200 ml skim milk (or water) in a pot.', 'Simmer 5 minutes, stirring occasionally.', 'Top with sliced banana, strawberries and a dash of cinnamon — no added sugar.'],
        ['اخلط ٤٠ جم شوفان مع ٢٠٠ مل حليب خالي الدسم (أو ماء) في إناء.', 'اتركه يغلي على نار هادئة ٥ دقائق مع التحريك.', 'أضف شرائح الموز والفراولة ورشة قرفة — بدون سكر مضاف.'],
        [['oats-rolled', 40, null, null], ['milk-skim', 200, null, null], ['banana', 50, 'sliced', 'شرائح'], ['strawberries', 60, null, null]]],

    ['ful-healthy-plate', 'Ful medames the light way', 'فول مدمس بالطريقة الخفيفة', 'breakfast', 2, 15, 'low',
        ['diabetes_t2', 'hypertension', 'heart_disease', 'obesity', 'general_wellness'],
        ['Warm 300 g cooked fava beans with a splash of water.', 'Dress with 1 tbsp olive oil, cumin, lemon juice — skip the salt shaker.', 'Serve with cucumber, tomato and ¼ baladi loaf per person.'],
        ['سخّن ٣٠٠ جم فول مطبوخ مع قليل من الماء.', 'تبّل بملعقة زيت زيتون وكمون وعصير ليمون — بدون إضافة ملح.', 'قدم مع خيار وطماطم وربع رغيف بلدي للفرد.'],
        [['ful-medames', 300, 'no added salt', 'بدون ملح مضاف'], ['olive-oil', 14, '1 tbsp', 'ملعقة كبيرة'], ['cucumber', 100, null, null], ['tomato', 100, null, null], ['baladi-bread', 45, 'quarter loaf', 'ربع رغيف']]],

    ['grilled-chicken-veg-lunch', 'Grilled chicken with roasted vegetables', 'دجاج مشوي بخضار مشوية', 'lunch', 2, 35, 'medium',
        ['diabetes_t2', 'hypertension', 'high_cholesterol', 'heart_disease', 'obesity', 'general_wellness'],
        ['Season 2 chicken breasts with lemon, garlic and black pepper (no salt).', 'Grill 6–8 minutes per side until fully cooked.', 'Toss zucchini, eggplant and onion with 1 tbsp olive oil and roast at 200°C for 25 minutes.', 'Plate the chicken over the vegetables with a side salad.'],
        ['تبّل صدرين من الدجاج بالليمون والثوم والفلفل الأسود (بدون ملح).', 'اشوِ ٦–٨ دقائق لكل وجه حتى النضج الكامل.', 'اخلط الكوسة والباذنجان والبصل مع ملعقة زيت زيتون واشوِها في الفرن ٢٠٠°م لمدة ٢٥ دقيقة.', 'قدّم الدجاج فوق الخضار مع سلطة جانبية.'],
        [['grilled-chicken-breast', 240, null, null], ['zucchini', 150, null, null], ['eggplant', 150, null, null], ['onion', 80, null, null], ['olive-oil', 14, null, null]]],

    ['lentil-soup-dinner', 'Egyptian lentil soup', 'شوربة عدس مصرية', 'dinner', 3, 30, 'low',
        ['diabetes_t2', 'hypertension', 'high_cholesterol', 'heart_disease', 'obesity', 'general_wellness'],
        ['Sauté onion in 1 tbsp olive oil until soft.', 'Add 250 g dried lentils, 1.5 L water, cumin and a small carrot.', 'Simmer 25 minutes, then blend smooth.', 'Finish with lemon juice; garnish with parsley instead of fried croutons.'],
        ['شوّح البصل في ملعقة زيت زيتون حتى يلين.', 'أضف ٢٥٠ جم عدس مجفف و١.٥ لتر ماء وكمون وجزرة صغيرة.', 'اتركه يغلي ٢٥ دقيقة ثم اهرسه.', 'أضف عصير ليمون وقدّم مع بقدونس بدل التقلية.'],
        [['lentils-cooked', 600, 'from 250 g dry', 'من ٢٥٠ جم عدس جاف'], ['onion', 100, null, null], ['olive-oil', 14, null, null], ['carrot', 60, null, null]]],

    ['molokhia-light', 'Molokhia with grilled chicken, light', 'ملوخية بالدجاج المشوي لايت', 'dinner', 2, 40, 'medium',
        ['diabetes_t2', 'hypertension', 'heart_disease', 'general_wellness'],
        ['Prepare 400 g molokhia leaves in low-sodium chicken broth.', 'Make the taqliya with garlic and coriander in ½ tbsp olive oil (not ghee).', 'Serve with a skinless grilled chicken breast and ½ cup rice per person.'],
        ['حضّر ٤٠٠ جم ورق ملوخية في مرقة دجاج قليلة الصوديوم.', 'اعمل التقلية بالثوم والكزبرة في نصف ملعقة زيت زيتون (بدون سمنة).', 'قدّم مع صدر دجاج مشوي بدون جلد ونصف كوب أرز للفرد.'],
        [['molokhia', 400, null, null], ['grilled-chicken-breast', 120, null, null], ['white-rice-cooked', 90, null, null], ['olive-oil', 7, null, null]]],

    ['tabbouleh-salad', 'Tabbouleh (extra parsley)', 'تبولة بالبقدونس', 'lunch', 3, 20, 'low',
        ['diabetes_t2', 'hypertension', 'high_cholesterol', 'heart_disease', 'obesity', 'general_wellness'],
        ['Finely chop a large bunch of parsley, 2 tomatoes and ½ cucumber.', 'Add 3 tbsp soaked bulgur (fine).', 'Dress with 2 tbsp olive oil and plenty of lemon juice; salt-free.'],
        ['افرم حزمة بقدونس كبيرة وثمرتي طماطم ونصف خيار ناعمًا.', 'أضف ٣ ملاعق برغل ناعم منقوع.', 'تبّل بملعقتين زيت زيتون وعصير ليمون وفير؛ بدون ملح.'],
        [['tabbouleh', 450, 'light-oil version', 'نسخة خفيفة الزيت'], ['olive-oil', 20, null, null], ['tomato', 150, null, null]]],

    ['fish-veg-dinner', 'Baked tilapia with vegetables', 'بلطي بالفرن مع الخضار', 'dinner', 2, 30, 'medium',
        ['diabetes_t2', 'hypertension', 'high_cholesterol', 'heart_disease', 'general_wellness'],
        ['Stuff 2 tilapia with lemon slices, garlic and cumin.', 'Bake at 200°C for 20–25 minutes.', 'Serve with a cabbage-and-carrot salad dressed with lemon.'],
        ['احشُ سمكتين بلت巴尔بالمحتوى: شرائح ليمون وثوم وكمون.', 'اخبزهما في فرن ٢٠٠°م لمدة ٢٠–٢٥ دقيقة.', 'قدّم مع سلطة كرنب وجزر ب dressing الليمون.'],
        [['tilapia-grilled', 300, 'baked, same profile', 'مخبوز بنفس القيم'], ['lemon', 60, 'juice + slices', 'عصير وشرائح'], ['mixed-green-salad', 200, null, null]]],

    ['koshari-light', 'Koshari, light portion', 'كشري بالطريقة الخفيفة', 'lunch', 2, 45, 'low',
        ['diabetes_t2', 'obesity', 'general_wellness'],
        ['Cook 150 g brown rice and 100 g whole-wheat pasta; boil 150 g lentils.', 'Make sauce from fresh tomato, garlic and vinegar without extra salt.', 'Top with a FEW baked-onion rings instead of deep-fried, and 1 tsp olive oil.'],
        ['اطبخ ١٥٠ جم أرز بني و١٠٠ جم مكرونة قمح كامل؛ واسلق ١٥٠ جم عدس.', 'اعمل الصلصة من طماطم طازجة وثوم وخل بدون ملح إضافي.', 'أضف حلقات بصل مفرودة بالفرن بدل المقلية وملعقة صغيرة زيت زيتون.'],
        [['brown-rice-cooked', 300, null, null], ['whole-wheat-pasta-cooked', 200, null, null], ['lentils-cooked', 150, null, null], ['tomato', 200, 'sauce', 'صلصة'], ['onion', 60, 'baked rings', 'حلقات بالفرن']]],

    ['greek-yogurt-snack', 'Greek yogurt with nuts & guava', 'زبادي يوناني بالمكسرات والجوافة', 'snack', 1, 5, 'low',
        ['diabetes_t2', 'hypertension', 'high_cholesterol', 'heart_disease', 'general_wellness'],
        ['Spoon 170 g plain Greek yogurt into a bowl.', 'Top with diced guava and 10 g chopped walnuts.', 'Sprinkle cinnamon — no honey or sugar needed.'],
        ['ضع ١٧٠ جم زبادي يوناني سادة في طبق.', 'أضف مكعبات الجوافة و١٠ جم جوز مجروش.', 'رش قرفة — بدون عسل أو سكر.'],
        [['greek-yogurt', 170, null, null], ['guava', 80, 'diced', 'مكعبات'], ['walnuts', 10, null, null]]],

    ['veg-sticks-hummus', 'Vegetable sticks with hummus', 'أصابع خضار مع حمص', 'snack', 2, 10, 'low',
        ['diabetes_t2', 'hypertension', 'high_cholesterol', 'obesity', 'general_wellness'],
        ['Cut cucumber, carrot and celery into sticks.', 'Serve with 4 tbsp hummus per person (about 60 g).'],
        ['قطّع الخيار والجزر والكرفس إلى أصابع.', 'قدّم مع ٤ ملاعق حمص للفرد (نحو ٦٠ جم).'],
        [['cucumber', 150, null, null], ['carrot', 100, null, null], ['hummus-dip', 120, null, null]]],

    ['fruit-salad-snack', 'Fresh fruit salad', 'سلطة فواكه طازجة', 'snack', 2, 10, 'low',
        ['hypertension', 'high_cholesterol', 'heart_disease', 'general_wellness'],
        ['Dice guava, orange, apple and strawberries.', 'Mix with a squeeze of orange juice; chill 10 minutes.'],
        ['قطّع الجوافة والبرتقال والتفاح والفراولة مكعبات.', 'اخلطها مع رشة عصير برتقال وبرّدها ١٠ دقائق.'],
        [['guava', 100, null, null], ['orange', 130, null, null], ['apple', 100, null, null], ['strawberries', 100, null, null]]],

    ['shish-tawook-plate', 'Shish tawook with fattoush', 'شيش طاووق مع فتوش', 'dinner', 2, 35, 'medium',
        ['diabetes_t2', 'hypertension', 'high_cholesterol', 'heart_disease', 'obesity', 'general_wellness'],
        ['Marinate 300 g chicken breast chunks in yogurt, lemon, garlic and paprika for 30 minutes.', 'Skewer and grill 10–12 minutes, turning.', 'Toss fattoush with 1 tbsp olive oil and sumac; use baked pita chips.'],
        ['تبّل ٣٠٠ جم قطع صدر دجاج بالزبادي والليمون والثوم والبابريكا لمدة ٣٠ دقيقة.', 'اغرزها في أسياخ واشوِها ١٠–١٢ دقيقة مع التقليب.', 'اخلط الفتوش بملعقة زيت زيتون وسماق؛ واستخدم رقائق خبز بالفرن.'],
        [['shish-tawook', 300, null, null], ['fattoush', 300, 'light dressing', 'dressing خفيف'], ['baladi-bread', 30, 'baked chips', 'رقائق بالفرن']]],
];
