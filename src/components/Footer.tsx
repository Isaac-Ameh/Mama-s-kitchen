import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#143628] text-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand Summary */}
          <div className="lg:col-span-4 space-y-4">
            <Link
              to="/"
              className="inline-block font-display text-2xl font-semibold tracking-tight text-[#FAF7F2]"
            >
              Mama&apos;s Kitchen
            </Link>
            <p className="text-sm leading-relaxed text-[#FAF7F2]/80 max-w-sm">
              Celebrating authentic Nigerian cooking—from smoky party jollof and slow-simmered
              traditional soups to cherished home-style classics made with care.
            </p>
            <p className="text-xs text-[#FAF7F2]/60">
              Demonstration restaurant storefront. Sample menu items and prices are shown for
              preview purposes.
            </p>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#FAF7F2]/60">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-[#FAF7F2]/85 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-[#FAF7F2]/85 hover:text-white transition-colors">
                  Our Menu
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[#FAF7F2]/85 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-[#FAF7F2]/85 hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-[#FAF7F2]/85 hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Menu Categories */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#FAF7F2]/60">
              Our Kitchen
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/menu?category=Rice+Dishes"
                  className="text-[#FAF7F2]/85 hover:text-white transition-colors"
                >
                  Rice Dishes
                </Link>
              </li>
              <li>
                <Link
                  to="/menu?category=Swallow+and+Soups"
                  className="text-[#FAF7F2]/85 hover:text-white transition-colors"
                >
                  Swallow &amp; Soups
                </Link>
              </li>
              <li>
                <Link
                  to="/menu?category=Other+Nigerian+Specials"
                  className="text-[#FAF7F2]/85 hover:text-white transition-colors"
                >
                  Nigerian Specials
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-[#FAF7F2]/85 hover:text-white transition-colors">
                  View All 20 Meals
                </Link>
              </li>
            </ul>
          </div>

          {/* Demo Contact & Opening Hours */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#FAF7F2]/60">
                Contact (Demo)
              </h3>
              <ul className="space-y-2 text-sm text-[#FAF7F2]/80">
                <li>Demo Location: 14 Heritage Lane (Sample Address)</li>
                <li>Demo Phone: +234 (0) 800 000 0000</li>
                <li>Demo Email: hello@mamaskitchen.example</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#FAF7F2]/60">
                Hours (Demo)
              </h3>
              <ul className="space-y-2 text-sm text-[#FAF7F2]/80">
                <li>Mon – Thu: 11:00 AM – 9:30 PM</li>
                <li>Fri – Sat: 11:00 AM – 10:30 PM</li>
                <li>Sunday: 12:00 PM – 9:00 PM</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Demo Social Row */}
        <div className="mt-12 pt-8 border-t border-[#FAF7F2]/12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#FAF7F2]/65">
          <p>&copy; {currentYear} Mama&apos;s Kitchen. Product Demonstration Website.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Social placeholders:</span>
            <Link to="/contact" className="hover:text-[#FAF7F2] transition-colors">
              Instagram (Demo)
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/contact" className="hover:text-[#FAF7F2] transition-colors">
              Facebook (Demo)
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/contact" className="hover:text-[#FAF7F2] transition-colors">
              X / Twitter (Demo)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
