import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Plus } from 'lucide-react';
import { Meal } from '../types/menu';
import { formatNaira } from '../data/meals';
import { useCart } from '../context/CartContext';
import { DishImage } from './DishImage';

interface MealCardProps {
  meal: Meal;
}

export function MealCard({ meal }: MealCardProps) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    const added = addToCart(meal, 1);
    if (!added) {
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/sign-in?redirect_url=${redirect}`);
      return;
    }
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <article className="group flex flex-col bg-[#FFFFFF] rounded-xl border border-[#1C1917]/8 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to={`/menu/${meal.id}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3EEE6] block"
      >
        <DishImage
          src={meal.image}
          alt={meal.name}
          title={meal.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </Link>

      <div className="flex flex-col flex-1 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 text-xs text-[#57534E]">
          <span>{meal.category}</span>
          <span className="tabular-nums font-semibold text-sm text-[#143628]">
            {formatNaira(meal.price)}
          </span>
        </div>

        <h3 className="mt-2 font-display text-lg sm:text-xl font-semibold text-[#1C1917] leading-snug">
          <Link
            to={`/menu/${meal.id}`}
            className="hover:text-[#143628] transition-colors"
          >
            {meal.name}
          </Link>
        </h3>

        <p className="mt-2 text-sm text-[#57534E] leading-relaxed line-clamp-2 flex-1">
          {meal.shortDescription}
        </p>

        <div className="mt-5 pt-4 border-t border-[#1C1917]/8 flex items-center justify-between gap-3">
          <Link
            to={`/menu/${meal.id}`}
            className="text-sm font-medium text-[#143628] hover:text-[#C05621] transition-colors whitespace-nowrap shrink-0"
          >
            View Meal
          </Link>

          <button
            type="button"
            onClick={handleAdd}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              justAdded
                ? 'bg-[#C05621] text-white'
                : 'bg-[#143628] text-[#FAF7F2] hover:bg-[#1D4B38]'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
