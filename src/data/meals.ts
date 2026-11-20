import { Meal } from '../types/menu';

export const RESTAURANT_IMAGES = {
  hero: '/src/assets/images/hero_jollof_feast_1795202397742.jpg',
  aboutTable: '/src/assets/images/about_nigerian_table_1795202396431.jpg',
  culinaryPrep: '/src/assets/images/welcome_culinary_prep_1795202396960.jpg',
};

export const MEALS: Meal[] = [
  {
    id: 'eba-and-egusi-soup',
    name: 'Eba and Egusi Soup',
    category: 'Swallow and Soups',
    shortDescription:
      'Golden cassava garri swallow paired with rich melon-seed soup, fresh ugu leaves, braised beef, and stockfish.',
    fullDescription:
      'A beloved staple across Nigerian homes. Smooth, freshly turned yellow garri Eba served warm alongside toasted Egusi melon-seed soup simmered slowly with red palm oil, ground crayfish, fluted pumpkin leaves, tender beef, and aromatic stockfish.',
    ingredientsHighlight: ['Yellow Garri', 'Toasted Egusi Seeds', 'Ugu Leaves', 'Beef & Stockfish', 'Red Palm Oil'],
    prepStyle: 'Slow-simmered traditional pot',
    price: 5500,
    image: '/src/assets/images/dish_eba_egusi_1795202396359.jpg',
  },
  {
    id: 'pounded-yam-and-egusi-soup',
    name: 'Pounded Yam and Egusi Soup',
    category: 'Swallow and Soups',
    shortDescription:
      'Velvety smooth pounded yam served with chunky, flavourful Egusi soup, assorted meat, and leafy greens.',
    fullDescription:
      'Silky, elastic pounded yam prepared for a delicate texture that complements our hearty Egusi soup. Richly finished with melon-seed curds, aromatic locust beans, braised beef cuts, and fresh green leaves.',
    ingredientsHighlight: ['White Puna Yam', 'Melon Seeds', 'Locust Beans (Iru)', 'Assorted Beef', 'Pumpkin Leaves'],
    prepStyle: 'Freshly pounded & slow-cooked',
    price: 6800,
    image: '/src/assets/images/dish_pounded_yam_egusi_1795202397067.jpg',
    featured: true,
  },
  {
    id: 'fufu-and-ofe-nsala',
    name: 'Fufu and Ofe Nsala',
    category: 'Swallow and Soups',
    shortDescription:
      'Soft cassava fufu served beside aromatic Igbo white soup thickened with yam, fresh catfish, and utazi leaves.',
    fullDescription:
      'Known affectionately as White Soup, Ofe Nsala is crafted without palm oil so the clean, peppery warmth of uda, ehuru, and fresh catfish shines through. Thickened smoothly with pounded yam and finished with delicately bitter utazi leaves alongside warm fufu.',
    ingredientsHighlight: ['Cassava Fufu', 'Fresh Catfish', 'Ehuru & Uda Spices', 'Utazi Leaves', 'Yam Thickener'],
    prepStyle: 'Palm-oil-free aromatic broth',
    price: 7200,
    image: '/src/assets/images/dish_fufu_ofe_nsala_1795202396678.jpg',
    featured: true,
  },
  {
    id: 'semo-and-ogbono-soup',
    name: 'Semo and Ogbono Soup',
    category: 'Swallow and Soups',
    shortDescription:
      'Smooth semolina swallow paired with glossy wild mango seed draw soup, tender beef, tripe, and greens.',
    fullDescription:
      'Nutty, deeply comforting Ogbono soup prepared from finely ground wild bush mango seeds cooked gently in palm oil and rich meat stock, layered with tender beef, tripe, crayfish, and fresh spinach alongside light Semovita.',
    ingredientsHighlight: ['Semovita', 'Ground Ogbono Seeds', 'Beef & Tripe', 'Crayfish', 'Fresh Spinach'],
    prepStyle: 'Rich slow-drawn broth',
    price: 5800,
    image: '/src/assets/images/dish_semo_ogbono_1795202396497.jpg',
  },
  {
    id: 'amala-ewedu-and-gbegiri',
    name: 'Amala, Ewedu and Gbegiri',
    category: 'Swallow and Soups',
    shortDescription:
      'Classic Ibadan-style yam flour swallow with silky ewedu, velvety gbegiri bean soup, and spicy buka stew.',
    fullDescription:
      'An iconic trio from Western Nigeria. Dark, earthy Amala made from dried yam flour meets the harmonious contrast of velvety yellow honey-bean Gbegiri, fresh green Ewedu jute leaf soup, and slow-reduced red Ata Din Din beef stew.',
    ingredientsHighlight: ['Yam Flour Amala', 'Ewedu Jute Leaves', 'Peeled Honey Beans', 'Buka Pepper Stew', 'Braised Beef'],
    prepStyle: 'Traditional Yoruba abula pairing',
    price: 6500,
    image: '/src/assets/images/dish_amala_ewedu_gbegiri_1795202397390.jpg',
    featured: true,
  },
  {
    id: 'jollof-rice-and-chicken',
    name: 'Jollof Rice and Chicken',
    category: 'Rice Dishes',
    shortDescription:
      'Vibrant long-grain party jollof rice simmered in smoky tomato-pepper reduction with crisp roasted chicken.',
    fullDescription:
      'Our signature Nigerian Jollof Rice, cooked slowly in a deeply seasoned reduction of plum tomatoes, tatashe, scotch bonnet peppers, thyme, and bay leaf until smoky and fragrant. Served with spiced golden-roasted chicken and fresh tomato-onion garnish.',
    ingredientsHighlight: ['Long-Grain Parboiled Rice', 'Tatashe & Scotch Bonnet', 'Bay Leaf & Thyme', 'Spiced Roasted Chicken'],
    prepStyle: 'Slow-steamed smoky pot finish',
    price: 5500,
    image: '/src/assets/images/dish_jollof_chicken_1795202397003.jpg',
  },
  {
    id: 'fried-rice-and-chicken',
    name: 'Fried Rice and Chicken',
    category: 'Rice Dishes',
    shortDescription:
      'Fragrant Nigerian-style seasoned rice stir-fried with sweet corn, carrots, peas, liver, and crispy fried chicken.',
    fullDescription:
      'Long-grain rice infused with rich chicken stock, curry leaf aroma, and thyme, then tossed hot with crisp diced carrots, sweet green peas, sweet corn, green bell peppers, and tender beef liver. Plated with seasoned golden fried chicken.',
    ingredientsHighlight: ['Stock-Infused Rice', 'Carrots & Sweet Peas', 'Bell Peppers & Sweet Corn', 'Diced Liver', 'Fried Chicken'],
    prepStyle: 'High-heat wok-tossed rice',
    price: 5800,
    image: '/src/assets/images/dish_fried_rice_chicken_1795202396262.jpg',
  },
  {
    id: 'white-rice-stew-and-chicken',
    name: 'White Rice, Stew and Chicken',
    category: 'Rice Dishes',
    shortDescription:
      'Fluffy steamed white rice crowned with rich, glossy Nigerian tomato-pepper stew and tender stewed chicken.',
    fullDescription:
      'Simple, deeply satisfying Nigerian comfort food. Perfectly steamed fluffy white rice topped generously with rich, slow-fried tomato, red bell pepper, and onion stew simmered with ginger, garlic, and tender braised chicken.',
    ingredientsHighlight: ['Steamed Long-Grain Rice', 'Plum Tomato & Pepper Base', 'Ginger & Garlic', 'Braised Chicken'],
    prepStyle: 'Slow-fried rich tomato stew',
    price: 5200,
    image: '/src/assets/images/dish_white_rice_stew_1795202397102.jpg',
  },
  {
    id: 'ofada-rice-and-ayamase-sauce',
    name: 'Ofada Rice and Ayamase Sauce',
    category: 'Rice Dishes',
    shortDescription:
      'Nutty unpolished local Ofada rice served in uma leaf with bold green Ayamase pepper stew, egg, and assorted beef.',
    fullDescription:
      'Aromatic locally grown Nigerian Ofada rice presented traditionally over fragrant uma leaves. Paired with dark, deeply savoury Ayamase sauce crafted from green bell peppers, scotch bonnets, bleached palm oil, iru locust beans, assorted beef, and a boiled egg.',
    ingredientsHighlight: ['Unpolished Ofada Rice', 'Green Bell & Habenero Peppers', 'Iru (Locust Beans)', 'Assorted Beef & Egg'],
    prepStyle: 'Traditional leaf-wrapped plating',
    price: 7000,
    image: '/src/assets/images/dish_ofada_ayamase_1795202396796.jpg',
    featured: true,
  },
  {
    id: 'rice-and-beans-with-plantain',
    name: 'Rice and Beans with Plantain',
    category: 'Other Nigerian Specials',
    shortDescription:
      'Wholesome Nigerian white rice and honey beans topped with hearty red pepper stew and sweet fried plantain.',
    fullDescription:
      'A nostalgic Nigerian favourite combining fluffy white rice and tender brown honey beans, finished with rich red tomato-pepper stew, braised beef, and a generous side of caramelized ripe fried plantain.',
    ingredientsHighlight: ['White Rice', 'Nigerian Honey Beans', 'Tomato Pepper Stew', 'Caramelized Fried Plantain'],
    prepStyle: 'Home-style comfort pairing',
    price: 4900,
    image: '/src/assets/images/dish_rice_beans_plantain_1795202396639.jpg',
  },
  {
    id: 'yam-porridge',
    name: 'Yam Porridge',
    category: 'Other Nigerian Specials',
    shortDescription:
      'Velvety Nigerian Asaro simmered in spiced palm oil and pepper sauce with smoked fish, crayfish, and fresh greens.',
    fullDescription:
      'Comforting white yam cubes gently simmered until half-mashed into a luscious, rich red palm oil and tatashe pepper sauce. Layered with flaky smoked mackerel, ground crayfish, sweet onions, and fresh green ugu leaves.',
    ingredientsHighlight: ['White Puna Yam', 'Red Palm Oil', 'Smoked Mackerel', 'Crayfish', 'Fresh Ugu Greens'],
    prepStyle: 'One-pot creamy simmer',
    price: 5400,
    image: '/src/assets/images/dish_yam_porridge_1795202396323.jpg',
  },
  {
    id: 'beans-and-fried-plantain',
    name: 'Beans and Fried Plantain',
    category: 'Other Nigerian Specials',
    shortDescription:
      'Slow-stewed honey beans in caramelized onion and palm oil sauce served with golden crispy sweet plantains.',
    fullDescription:
      'Sweet Nigerian honey beans (Ewa Riro) cooked until tender in an aromatic blend of red palm oil, sweet onions, crayfish, and mild red pepper, paired beside golden caramelized dodo fried plantains.',
    ingredientsHighlight: ['Nigerian Honey Beans', 'Caramelized Onions', 'Red Palm Oil', 'Ripe Sweet Plantain'],
    prepStyle: 'Slow-braised Ewa Riro',
    price: 4600,
    image: '/src/assets/images/dish_beans_plantain_1795202396140.jpg',
  },
  {
    id: 'eba-and-afang-soup',
    name: 'Eba and Afang Soup',
    category: 'Swallow and Soups',
    shortDescription:
      'Golden garri Eba served with lush Efik-Ibibio Afang soup packed with shredded afang, waterleaf, and stockfish.',
    fullDescription:
      'Originating from Cross River and Akwa Ibom kitchens, our Afang soup blends finely pounded wild afang leaves with tender waterleaf, periwinkle, stockfish, crayfish, and pure palm oil for a deeply earthy, nourishing finish beside warm Eba.',
    ingredientsHighlight: ['Yellow Garri Eba', 'Wild Afang Leaves', 'Waterleaf', 'Stockfish & Periwinkle', 'Pure Palm Oil'],
    prepStyle: 'Efik-Ibibio heritage recipe',
    price: 7000,
    image: '/src/assets/images/dish_eba_afang_1795202396593.jpg',
    featured: true,
  },
  {
    id: 'pounded-yam-and-edikang-ikong',
    name: 'Pounded Yam and Edikang Ikong',
    category: 'Swallow and Soups',
    shortDescription:
      'Smooth pounded yam alongside nutrient-rich Edikang Ikong vegetable soup overflowing with ugu, waterleaf, and beef.',
    fullDescription:
      'Regarded as a royal dish of southeastern Nigeria, Edikang Ikong combines abundant fresh fluted pumpkin leaves and waterleaf braised gently in palm oil with tender beef, kpomo, dried fish, and crayfish—served with smooth pounded yam.',
    ingredientsHighlight: ['Pounded Yam', 'Fluted Pumpkin (Ugu)', 'Waterleaf', 'Beef & Dried Fish', 'Crayfish'],
    prepStyle: 'Minimal-broth leafy braise',
    price: 7400,
    image: '/src/assets/images/dish_pounded_yam_edikang_ikong_1795202396598.jpg',
  },
  {
    id: 'fufu-and-bitterleaf-soup',
    name: 'Fufu and Bitterleaf Soup',
    category: 'Swallow and Soups',
    shortDescription:
      'Traditional Igbo Ofe Onugbu thickened with cocoyam in golden palm oil broth, served with warm cassava fufu.',
    fullDescription:
      'Carefully washed bitterleaf balances the rich, velvety warmth of cocoyam-thickened palm oil broth, ogiri flavouring, tender braised beef, and stockfish. Served traditionally with smooth white cassava fufu.',
    ingredientsHighlight: ['Cassava Fufu', 'Washed Bitterleaf', 'Cocoyam Thickener', 'Ogiri Seasoning', 'Beef & Stockfish'],
    prepStyle: 'Authentic Igbo cocoyam base',
    price: 6600,
    image: '/src/assets/images/dish_fufu_bitterleaf_1795202397014.jpg',
  },
  {
    id: 'eba-and-okra-soup',
    name: 'Eba and Okra Soup',
    category: 'Swallow and Soups',
    shortDescription:
      'Freshly chopped Nigerian okra soup studded with prawns, stockfish, beef, and palm oil alongside golden Eba.',
    fullDescription:
      'Vibrant, lightly textured okra cooked just enough to preserve its crisp green freshness, enriched with red palm oil, succulent prawns, flaked stockfish, braised beef, and ground crayfish. Paired with warm golden Eba.',
    ingredientsHighlight: ['Yellow Garri Eba', 'Fresh Chopped Okra', 'Prawns & Stockfish', 'Braised Beef', 'Palm Oil'],
    prepStyle: 'Quick-simmered to stay vibrant',
    price: 6200,
    image: '/src/assets/images/dish_eba_okra_1795202396909.jpg',
  },
  {
    id: 'pounded-yam-and-oha-soup',
    name: 'Pounded Yam and Oha Soup',
    category: 'Swallow and Soups',
    shortDescription:
      'Smooth pounded yam with fragrant Ofe Oha, featuring hand-torn oha leaves in rich cocoyam-thickened palm oil broth.',
    fullDescription:
      'Celebrated for its delicate seasonal aroma, Ofe Oha brings hand-torn tender oha leaves together with smooth cocoyam paste, uziza warmth, crayfish, tender beef, and stockfish, accompanied by fluffy pounded yam.',
    ingredientsHighlight: ['Pounded Yam', 'Fresh Hand-Torn Oha Leaves', 'Cocoyam Paste', 'Uziza & Crayfish', 'Stockfish'],
    prepStyle: 'Traditional Eastern clay-pot style',
    price: 7100,
    image: '/src/assets/images/dish_pounded_yam_oha_1795202397144.jpg',
  },
  {
    id: 'semo-and-banga-soup',
    name: 'Semo and Banga Soup',
    category: 'Swallow and Soups',
    shortDescription:
      'Velvety Delta-style palm nut soup infused with traditional spices and fresh catfish, served with warm Semovita.',
    fullDescription:
      'Rich palm fruit extract reduced slowly with aromatic Delta spices—oburunbebe stick, ataiko, and beletete—around tender fresh catfish steaks and scent leaf, creating a deeply fragrant soup served alongside smooth Semo.',
    ingredientsHighlight: ['Semovita', 'Fresh Palm Fruit Extract', 'Catfish Steaks', 'Banga Spices', 'Scent Leaf'],
    prepStyle: 'Delta slow-reduced palm broth',
    price: 6900,
    image: '/src/assets/images/dish_semo_banga_1795202396695.jpg',
  },
  {
    id: 'eba-and-vegetable-soup',
    name: 'Eba and Vegetable Soup',
    category: 'Swallow and Soups',
    shortDescription:
      'Hearty Yoruba Efo Riro spinach stew cooked in rich iru pepper sauce with beef and smoked fish, paired with Eba.',
    fullDescription:
      'Colourful, intensely flavourful Efo Riro cooked down in roasted red tatashe and scotch bonnet pepper sauce, fragrant locust beans, smoked fish, and tender beef—served with golden yellow Eba.',
    ingredientsHighlight: ['Yellow Garri Eba', 'Fresh Spinach Greens', 'Tatashe Pepper Base', 'Locust Beans (Iru)', 'Smoked Fish'],
    prepStyle: 'Rich Yoruba Efo Riro stew',
    price: 5900,
    image: '/src/assets/images/dish_eba_vegetable_1795202396657.jpg',
  },
  {
    id: 'jollof-rice-and-grilled-chicken',
    name: 'Jollof Rice and Grilled Chicken',
    category: 'Rice Dishes',
    shortDescription:
      'Smoky party Jollof Rice served with flame-charred spiced grilled chicken, sweet fried plantain, and fresh onions.',
    fullDescription:
      'Our flagship celebratory plate: smoky firewood-style Jollof Rice cooked in rich peppered stock, served beside a flame-grilled spiced chicken quarter with crisp charred edges, caramelized sweet plantain slices, and fresh red onion rings.',
    ingredientsHighlight: ['Smoky Party Jollof Rice', 'Char-Grilled Spiced Chicken', 'Sweet Plantain', 'Red Onion Garnish'],
    prepStyle: 'Open-flame grill & slow pot',
    price: 6500,
    image: '/src/assets/images/dish_jollof_grilled_chicken_1795202396120.jpg',
    featured: true,
  },
];

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
