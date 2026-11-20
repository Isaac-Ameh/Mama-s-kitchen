export type MealCategory =
  | 'Rice Dishes'
  | 'Swallow and Soups'
  | 'Other Nigerian Specials';

export interface Meal {
  id: string;
  name: string;
  category: MealCategory;
  shortDescription: string;
  fullDescription: string;
  ingredientsHighlight: string[];
  prepStyle: string;
  price: number; // Sample price in Nigerian Naira (NGN)
  image: string;
  featured?: boolean;
}

export interface CartItem {
  meal: Meal;
  quantity: number;
}
