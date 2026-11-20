import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Flame, HeartHandshake, UtensilsCrossed } from 'lucide-react';
import { MEALS, RESTAURANT_IMAGES } from '../data/meals';
import { MealCard } from '../components/MealCard';
import { DishImage } from '../components/DishImage';

const FEATURED_MEALS = MEALS.filter((meal) => meal.featured).slice(0, 6);

const GALLERY_DISH_IDS = [
  'yam-porridge',
  'beans-and-fried-plantain',
  'eba-and-okra-soup',
  'semo-and-banga-soup',
  'pounded-yam-and-edikang-ikong',
];

const GALLERY_MEALS = GALLERY_DISH_IDS.map((id) =>
  MEALS.find((meal) => meal.id === id)
).filter((m): m is NonNullable<typeof m> => Boolean(m));

export function HomePage() {
  return (
    <div>
      {/* Full-Viewport Cinematic Hero */}
      <section className="relative min-h-[94vh] flex items-center bg-[#143628] text-[#FAF7F2] overflow-hidden">
        <div className="absolute inset-0">
          <DishImage
            src={RESTAURANT_IMAGES.hero}
            alt="Nigerian feast with smoky jollof rice, grilled spiced chicken, fried plantain, and pepper sauce"
            loading="eager"
            className="w-full h-full object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/35"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-20 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-[#F5C59F]">
              AUTHENTIC NIGERIAN CUISINE
            </p>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white text-balance leading-[1.08]">
              Taste the Richness of Nigeria.
            </h1>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-[#FAF7F2]/90 leading-relaxed max-w-xl">
              From the comfort of your favourite classics to the bold flavours of traditional
              Nigerian cuisine, every meal tells a story.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#C05621] hover:bg-[#9C4217] text-white text-sm sm:text-base font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <span>Explore Our Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center px-6 py-3.5 rounded-lg border border-white/35 bg-black/25 hover:bg-white/15 text-white text-sm sm:text-base font-medium backdrop-blur-xs transition-colors whitespace-nowrap shrink-0"
              >
                Our Story
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section A: Welcome to Mama's Kitchen */}
      <section className="py-16 sm:py-24 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col justify-center"
            >
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#C05621]">
                Welcome to Mama&apos;s Kitchen
              </p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1917] text-balance leading-[1.15]">
                Good Food. Rich Culture. Unforgettable Flavours.
              </h2>
              <p className="mt-5 text-base text-[#57534E] leading-relaxed">
                At Mama&apos;s Kitchen, cooking begins with patience, honest ingredients, and deep
                respect for Nigerian culinary heritage. Whether it is the unmistakable smoky depth
                of party jollof rice or a comforting bowl of freshly simmered Egusi beside warm
                pounded yam, every plate is crafted to bring people together.
              </p>
              <p className="mt-4 text-base text-[#57534E] leading-relaxed">
                We honour the familiar traditions found across Nigerian homes—freshly washed leafy
                greens, aromatic palm oil, slow-roasted pepper bases, and generous hospitality at
                every table.
              </p>
              <div className="mt-7">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#143628] hover:text-[#C05621] transition-colors"
                >
                  <span>Read Our Full Story</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6"
            >
              <div className="relative h-full min-h-[300px] sm:min-h-[380px] rounded-xl overflow-hidden bg-[#F3EEE6] border border-[#1C1917]/8">
                <DishImage
                  src={RESTAURANT_IMAGES.culinaryPrep}
                  alt="Fresh scotch bonnet peppers, green ugu leaves, ripe plantains, crayfish, and mortar on a wooden kitchen board"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section B: Popular Nigerian Meals */}
      <section className="py-16 sm:py-24 bg-[#F3EEE6]/70 border-y border-[#1C1917]/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#C05621]">
                From the Kitchen
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1917] text-balance">
                Popular Nigerian Meals
              </h2>
              <p className="mt-3 text-base text-[#57534E] leading-relaxed">
                Explore six guest favourites from our twenty-dish menu. Sample prices shown in
                Nigerian Naira.
              </p>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#143628] hover:text-[#C05621] transition-colors whitespace-nowrap shrink-0"
            >
              <span>View Full Menu (20)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {FEATURED_MEALS.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-[#FAF7F2] text-sm sm:text-base font-medium transition-colors"
            >
              <span>Explore All Meals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section C: Why Choose Mama's Kitchen? */}
      <section className="py-16 sm:py-24 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#C05621]">
              Our Standards
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1917] text-balance">
              Why Choose Mama&apos;s Kitchen?
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            <div className="pt-6 border-t border-[#1C1917]/12">
              <div className="w-11 h-11 rounded-lg bg-[#143628]/8 text-[#143628] flex items-center justify-center">
                <Flame className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-[#1C1917]">
                Authentic Nigerian Flavours
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-[#57534E] leading-relaxed">
                From smoky firewood-inspired Jollof to unpolished Ofada rice, ogiri, and iru locust
                beans, our seasoning honours regional Nigerian recipes without shortcuts.
              </p>
            </div>

            <div className="pt-6 border-t border-[#1C1917]/12">
              <div className="w-11 h-11 rounded-lg bg-[#143628]/8 text-[#143628] flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-[#1C1917]">
                Freshly Prepared Meals
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-[#57534E] leading-relaxed">
                Crisp leafy greens like ugu, waterleaf, and bitterleaf are prepped fresh, and
                swallows are turned warm so every soup arrives at the table vibrant and comforting.
              </p>
            </div>

            <div className="pt-6 border-t border-[#1C1917]/12">
              <div className="w-11 h-11 rounded-lg bg-[#143628]/8 text-[#143628] flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-[#1C1917]">
                Food Made with Care
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-[#57534E] leading-relaxed">
                Every pot is watched closely—giving tomatoes time to reduce, meat time to tenderize,
                and guests a welcoming experience that feels genuinely like home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section D: A Taste of Our Kitchen */}
      <section className="py-16 sm:py-24 bg-[#F3EEE6]/70 border-t border-[#1C1917]/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#C05621]">
              Visual Table
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1917]">
              A Taste of Our Kitchen
            </h2>
            <p className="mt-3 text-base text-[#57534E] leading-relaxed">
              Slow-simmered traditional soups, wholesome porridges, and regional classics served on
              warm stoneware.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-5">
            {GALLERY_MEALS.map((meal, index) => {
              const spanClass =
                index === 0
                  ? 'md:col-span-7 aspect-[16/10]'
                  : index === 1
                  ? 'md:col-span-5 aspect-[16/10] md:aspect-auto'
                  : 'md:col-span-4 aspect-[4/3]';

              return (
                <Link
                  key={meal.id}
                  to={`/menu/${meal.id}`}
                  className={`group relative rounded-xl overflow-hidden bg-[#EBE3D5] ${spanClass}`}
                >
                  <DishImage
                    src={meal.image}
                    alt={meal.name}
                    title={meal.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-xs text-[#F5C59F] font-medium">{meal.category}</p>
                    <h3 className="mt-0.5 font-display text-lg sm:text-xl font-semibold">
                      {meal.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section E: Call to Action */}
      <section className="py-20 sm:py-24 bg-[#143628] text-[#FAF7F2] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-white text-balance">
            Your Next Favourite Meal Is Waiting.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#FAF7F2]/85 max-w-xl mx-auto leading-relaxed">
            Browse all twenty Nigerian dishes across rice classics, traditional swallows and soups,
            and house specials.
          </p>
          <div className="mt-8">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#C05621] hover:bg-[#9C4217] text-white text-base font-medium transition-colors"
            >
              <span>Explore the Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
