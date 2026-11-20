export interface ServerMealInfo {
  id: string;
  name: string;
  priceNaira: number;
}

export const SERVER_MEAL_CATALOG: Record<string, ServerMealInfo> = {
  'eba-and-egusi-soup': { id: 'eba-and-egusi-soup', name: 'Eba and Egusi Soup', priceNaira: 5500 },
  'pounded-yam-and-egusi-soup': { id: 'pounded-yam-and-egusi-soup', name: 'Pounded Yam and Egusi Soup', priceNaira: 6800 },
  'fufu-and-ofe-nsala': { id: 'fufu-and-ofe-nsala', name: 'Fufu and Ofe Nsala', priceNaira: 7200 },
  'semo-and-ogbono-soup': { id: 'semo-and-ogbono-soup', name: 'Semo and Ogbono Soup', priceNaira: 5800 },
  'amala-ewedu-and-gbegiri': { id: 'amala-ewedu-and-gbegiri', name: 'Amala, Ewedu and Gbegiri', priceNaira: 6500 },
  'jollof-rice-and-chicken': { id: 'jollof-rice-and-chicken', name: 'Jollof Rice and Chicken', priceNaira: 5500 },
  'fried-rice-and-chicken': { id: 'fried-rice-and-chicken', name: 'Fried Rice and Chicken', priceNaira: 5800 },
  'white-rice-stew-and-chicken': { id: 'white-rice-stew-and-chicken', name: 'White Rice, Stew and Chicken', priceNaira: 5200 },
  'ofada-rice-and-ayamase-sauce': { id: 'ofada-rice-and-ayamase-sauce', name: 'Ofada Rice and Ayamase Sauce', priceNaira: 7000 },
  'rice-and-beans-with-plantain': { id: 'rice-and-beans-with-plantain', name: 'Rice and Beans with Plantain', priceNaira: 4900 },
  'yam-porridge': { id: 'yam-porridge', name: 'Yam Porridge', priceNaira: 5400 },
  'beans-and-fried-plantain': { id: 'beans-and-fried-plantain', name: 'Beans and Fried Plantain', priceNaira: 4600 },
  'eba-and-afang-soup': { id: 'eba-and-afang-soup', name: 'Eba and Afang Soup', priceNaira: 7000 },
  'pounded-yam-and-edikang-ikong': { id: 'pounded-yam-and-edikang-ikong', name: 'Pounded Yam and Edikang Ikong', priceNaira: 7400 },
  'fufu-and-bitterleaf-soup': { id: 'fufu-and-bitterleaf-soup', name: 'Fufu and Bitterleaf Soup', priceNaira: 6600 },
  'eba-and-okra-soup': { id: 'eba-and-okra-soup', name: 'Eba and Okra Soup', priceNaira: 6200 },
  'pounded-yam-and-oha-soup': { id: 'pounded-yam-and-oha-soup', name: 'Pounded Yam and Oha Soup', priceNaira: 7100 },
  'semo-and-banga-soup': { id: 'semo-and-banga-soup', name: 'Semo and Banga Soup', priceNaira: 6900 },
  'eba-and-vegetable-soup': { id: 'eba-and-vegetable-soup', name: 'Eba and Vegetable Soup', priceNaira: 5900 },
  'jollof-rice-and-grilled-chicken': { id: 'jollof-rice-and-grilled-chicken', name: 'Jollof Rice and Grilled Chicken', priceNaira: 6500 },
};
