import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MEALS } from '../data/meals';
import { MealCategory } from '../types/menu';
import { PageHero } from '../components/PageHero';
import { MealCard } from '../components/MealCard';

type FilterOption = 'All Meals' | MealCategory;

const CATEGORIES: FilterOption[] = [
  'All Meals',
  'Rice Dishes',
  'Swallow and Soups',
  'Other Nigerian Specials',
];

export function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialParam = searchParams.get('category') as FilterOption | null;

  const [selectedCategory, setSelectedCategory] = useState<FilterOption>(
    initialParam && CATEGORIES.includes(initialParam) ? initialParam : 'All Meals'
  );

  useEffect(() => {
    const param = searchParams.get('category') as FilterOption | null;
    if (param && CATEGORIES.includes(param)) {
      setSelectedCategory(param);
    } else if (!param) {
      setSelectedCategory('All Meals');
    }
  }, [searchParams]);

  const handleCategoryChange = (category: FilterOption) => {
    setSelectedCategory(category);
    if (category === 'All Meals') {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  const filteredMeals =
    selectedCategory === 'All Meals'
      ? MEALS
      : MEALS.filter((meal) => meal.category === selectedCategory);

  return (
    <div>
      <PageHero
        eyebrow="Mama's Kitchen Menu"
        title="Explore Our Menu"
        subtitle="Discover the authentic flavours of Nigeria, prepared with care and served fresh."
        image="/src/assets/images/dish_ofada_ayamase_1795202396796.jpg"
        imageAlt="Nigerian Ofada rice served on green uma leaf with Ayamase stew"
      />

      <section className="py-12 sm:py-16 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter Controls + Sample Price Notice */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-8 border-b border-[#1C1917]/10">
            <div
              role="tablist"
              aria-label="Filter menu by category"
              className="flex flex-wrap items-center gap-2"
            >
              {CATEGORIES.map((category) => {
                const count =
                  category === 'All Meals'
                    ? MEALS.length
                    : MEALS.filter((m) => m.category === category).length;
                const isActive = selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#143628] text-[#FAF7F2]'
                        : 'bg-[#F3EEE6] text-[#1C1917] hover:bg-[#E7DFD2]'
                    }`}
                  >
                    {category}{' '}
                    <span className="tabular-nums opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs sm:text-sm text-[#57534E]">
              Sample demonstration prices shown in Nigerian Naira (₦).
            </p>
          </div>

          {/* Meals Grid */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
