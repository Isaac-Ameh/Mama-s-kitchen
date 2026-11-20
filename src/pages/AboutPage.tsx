import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { RESTAURANT_IMAGES } from '../data/meals';
import { PageHero } from '../components/PageHero';
import { DishImage } from '../components/DishImage';

export function AboutPage() {
  return (
    <div>
      <PageHero
        eyebrow="Our Story"
        title="More Than a Meal. A Taste of Home."
        subtitle="An invitation to experience the warmth, depth, and generosity of Nigerian cooking."
        image={RESTAURANT_IMAGES.aboutTable}
        imageAlt="Guests gathered around a Nigerian restaurant dining table sharing traditional stews and rice dishes"
      />

      {/* Editorial Narrative */}
      <section className="py-16 sm:py-24 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            <div className="lg:col-span-6 space-y-6 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#C05621]">
                The Mama&apos;s Kitchen Story
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1917] text-balance leading-[1.15]">
                Rooted in Nigerian Hospitality
              </h2>
              <p className="text-base text-[#57534E] leading-relaxed">
                Nigerian food has always been about more than nourishment—it is how families mark
                milestones, welcome guests, and stay connected to where they come from. Mama&apos;s
                Kitchen was envisioned as a warm, welcoming table where those everyday and
                celebratory dishes are treated with the care they deserve.
              </p>
              <p className="text-base text-[#57534E] leading-relaxed">
                From the comforting familiarity of white rice and rich red stew to regional
                soups like Ofe Nsala, Afang, Oha, and Banga, our menu honours the breadth of
                Nigeria&apos;s culinary regions under one roof.
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="aspect-[4/3] lg:h-full rounded-xl overflow-hidden bg-[#F3EEE6] border border-[#1C1917]/8">
                <DishImage
                  src={RESTAURANT_IMAGES.culinaryPrep}
                  alt="Fresh peppers, ugu leaves, plantains, and earthenware mortar prepared in the kitchen"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Food Philosophy & Commitment */}
      <section className="py-16 sm:py-24 bg-[#F3EEE6]/70 border-y border-[#1C1917]/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#EBE3D5]">
                  <DishImage
                    src="/src/assets/images/dish_amala_ewedu_gbegiri_1795202397390.jpg"
                    alt="Amala, Ewedu and Gbegiri plated in stoneware"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#EBE3D5]">
                  <DishImage
                    src="/src/assets/images/dish_pounded_yam_edikang_ikong_1795202396598.jpg"
                    alt="Pounded Yam and Edikang Ikong vegetable soup"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="col-span-2 aspect-[16/9] rounded-xl overflow-hidden bg-[#EBE3D5]">
                  <DishImage
                    src="/src/assets/images/dish_jollof_grilled_chicken_1795202396120.jpg"
                    alt="Nigerian party Jollof Rice with flame-grilled spiced chicken and fried plantain"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col justify-center space-y-8">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#C05621]">
                  Our Food Philosophy
                </p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1917]">
                  Patience, Honesty, and Real Ingredients
                </h2>
                <p className="mt-4 text-base text-[#57534E] leading-relaxed">
                  Great Nigerian cooking cannot be rushed. Pepper bases need time to fry down until
                  sweet and fragrant; palm nut extracts and melon seeds reward steady, attentive
                  simmering; and swallows belong in the bowl warm and smooth.
                </p>
              </div>

              <div className="space-y-6 pt-6 border-t border-[#1C1917]/10">
                <div>
                  <h3 className="font-display text-xl font-semibold text-[#1C1917]">
                    Our Love for Nigerian Food
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-[#57534E] leading-relaxed">
                    Every dish on our menu reflects the diversity of Nigerian kitchens—from Yoruba
                    abula pairings to Efik leafy soups and Delta palm nut broths—prepared so both
                    lifelong lovers of Nigerian food and curious first-time diners feel at home.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold text-[#1C1917]">
                    Our Commitment to Authentic Flavours
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-[#57534E] leading-relaxed">
                    We stay faithful to traditional seasonings—locust beans, crayfish, uziza, ehuru,
                    scent leaf, and fresh scotch bonnet peppers—never watering down character or
                    replacing real craftsmanship with shortcuts.
                  </p>
                </div>
              </div>

              <div>
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-[#FAF7F2] text-sm font-medium transition-colors"
                >
                  <span>Explore Our Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
