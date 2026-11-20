import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { MEALS, formatNaira } from '../data/meals';
import { useCart } from '../context/CartContext';
import { DishImage } from '../components/DishImage';
import { MealCard } from '../components/MealCard';
import { PageHero } from '../components/PageHero';

export function MealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const meal = MEALS.find((m) => m.id === id);
  const { addToCart, totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setAddedFeedback(false);
  }, [id]);

  if (!meal) {
    return (
      <div>
        <PageHero
          eyebrow="Menu Item"
          title="Meal Not Found"
          subtitle="We could not find that dish on our current menu."
          image="/src/assets/images/dish_jollof_chicken_1795202397003.jpg"
          imageAlt="Nigerian Jollof Rice and Chicken"
        />
        <section className="py-20 bg-[#FAF7F2] text-center">
          <div className="max-w-lg mx-auto px-4">
            <p className="text-base text-[#57534E]">
              The meal you are looking for may have moved or the link may be incomplete.
            </p>
            <Link
              to="/menu"
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#143628] text-[#FAF7F2] text-sm font-medium hover:bg-[#1D4B38] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Menu</span>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const relatedMeals = MEALS.filter(
    (m) => m.category === meal.category && m.id !== meal.id
  ).slice(0, 3);

  const handleAddToCart = () => {
    const added = addToCart(meal, quantity);
    if (!added) {
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/sign-in?redirect_url=${redirect}`);
      return;
    }
    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 1800);
  };

  return (
    <div>
      <PageHero
        eyebrow={meal.category}
        title={meal.name}
        subtitle={meal.prepStyle}
        image={meal.image}
        imageAlt={meal.name}
      />

      <section className="py-10 sm:py-16 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#143628] hover:text-[#C05621] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </Link>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left: Large Dish Photography */}
            <div className="lg:col-span-7">
              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F3EEE6] border border-[#1C1917]/8">
                <DishImage
                  src={meal.image}
                  alt={meal.name}
                  title={meal.name}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right: Contiguous Purchase & Story Module */}
            <div className="lg:col-span-5 bg-[#FFFFFF] rounded-xl border border-[#1C1917]/8 p-6 sm:p-8">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#C05621]">
                {meal.category}
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">
                {meal.name}
              </h2>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="tabular-nums font-display text-2xl font-semibold text-[#143628]">
                  {formatNaira(meal.price)}
                </span>
                <span className="text-xs text-[#57534E]">Sample demonstration price</span>
              </div>

              <p className="mt-5 text-base text-[#57534E] leading-relaxed">
                {meal.fullDescription}
              </p>

              {/* Key Ingredients */}
              <div className="mt-6 pt-5 border-t border-[#1C1917]/8">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
                  Key Ingredients &amp; Notes
                </h3>
                <p className="mt-2 text-sm text-[#57534E] leading-relaxed">
                  {meal.ingredientsHighlight.join(' · ')}
                </p>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="mt-6 pt-6 border-t border-[#1C1917]/8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#1C1917]">Quantity</span>
                  <div className="inline-flex items-center rounded-lg border border-[#1C1917]/15 bg-[#FAF7F2]">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="p-2.5 text-[#1C1917] hover:bg-[#F3EEE6] rounded-l-lg transition-colors cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="tabular-nums px-4 text-sm font-semibold text-[#1C1917] min-w-[2.5rem] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Increase quantity"
                      className="p-2.5 text-[#1C1917] hover:bg-[#F3EEE6] rounded-r-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-base font-medium transition-colors cursor-pointer ${
                    addedFeedback
                      ? 'bg-[#C05621] text-white'
                      : 'bg-[#143628] hover:bg-[#1D4B38] text-[#FAF7F2]'
                  }`}
                >
                  {addedFeedback ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      <span>
                        Add to Cart ·{' '}
                        <span className="tabular-nums">
                          {formatNaira(meal.price * quantity)}
                        </span>
                      </span>
                    </>
                  )}
                </button>

                {totalItems > 0 && (
                  <Link
                    to="/cart"
                    className="block w-full text-center py-2.5 rounded-lg border border-[#143628]/20 text-sm font-medium text-[#143628] hover:bg-[#F3EEE6] transition-colors"
                  >
                    View Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Dishes */}
      {relatedMeals.length > 0 && (
        <section className="py-14 sm:py-20 bg-[#F3EEE6]/70 border-t border-[#1C1917]/8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">
              More in {meal.category}
            </h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {relatedMeals.map((related) => (
                <MealCard key={related.id} meal={related} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
