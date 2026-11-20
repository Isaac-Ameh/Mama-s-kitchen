import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PaystackPop from '@paystack/inline-js';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAppAuth } from '../context/AppAuthContext';
import { formatNaira } from '../data/meals';
import { PageHero } from '../components/PageHero';
import { DishImage } from '../components/DishImage';
import { parseApiJson } from '../lib/api';

interface PaidReceipt {
  reference: string;
  totalNaira: number;
  paidAt?: string;
  channel?: string;
  items: Array<{
    mealId: string;
    name: string;
    unitPriceNaira: number;
    quantity: number;
    lineTotalNaira: number;
  }>;
}

export function CartPage() {
  const { items, isLoading, totalItems, subtotal, updateQuantity, removeFromCart, clearCart } =
    useCart();
  const { getToken, email } = useAppAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'initializing' | 'awaiting' | 'verifying'
  >('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [fallbackAuthUrl, setFallbackAuthUrl] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaidReceipt | null>(null);

  const verifyPaymentOnServer = useCallback(
    async (reference: string) => {
      setPaymentStatus('verifying');
      setPaymentError(null);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Your session expired. Please sign in again.');
        }

        const res = await fetch(
          `/api/payments/paystack/verify/${encodeURIComponent(reference)}`,
          {
            credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await parseApiJson<{
          verified?: boolean;
          receipt?: PaidReceipt;
          error?: string;
        }>(res, 'Could not verify Paystack payment.');

        if (!data.verified || !data.receipt) {
          throw new Error(data.error || 'Could not verify Paystack payment.');
        }

        setReceipt(data.receipt);
        setFallbackAuthUrl(null);
        clearCart();
      } catch (err) {
        setPaymentError(
          err instanceof Error ? err.message : 'Unable to verify Paystack payment.'
        );
      } finally {
        setPaymentStatus('idle');
      }
    },
    [getToken, clearCart]
  );

  // Support Paystack redirect callback (?reference=... or ?trxref=...)
  useEffect(() => {
    const callbackRef = searchParams.get('reference') || searchParams.get('trxref');
    if (callbackRef && /^MK-[A-Za-z0-9_-]{6,64}$/.test(callbackRef)) {
      setSearchParams({}, { replace: true });
      void verifyPaymentOnServer(callbackRef);
    }
  }, [searchParams, setSearchParams, verifyPaymentOnServer]);

  const handlePayWithPaystack = async () => {
    setPaymentStatus('initializing');
    setPaymentError(null);
    setFallbackAuthUrl(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Please sign in to proceed with payment.');
      }

      const initRes = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            mealId: item.meal.id,
            quantity: item.quantity,
          })),
        }),
      });

      const initData = await parseApiJson<{
        access_code?: string;
        reference?: string;
        authorization_url?: string;
        error?: string;
      }>(initRes, 'Unable to start Paystack checkout.');

      if (!initData.access_code || !initData.reference) {
        throw new Error(initData.error || 'Unable to start Paystack checkout.');
      }

      const { access_code, reference, authorization_url } = initData;

      if (authorization_url) {
        setFallbackAuthUrl(authorization_url);
      }

      setPaymentStatus('awaiting');
      const popup = new PaystackPop();
      popup.resumeTransaction(access_code, {
        onSuccess: (tx) => {
          const verifiedRef = tx?.reference || reference;
          void verifyPaymentOnServer(verifiedRef);
        },
        onCancel: () => {
          setPaymentStatus('idle');
          setPaymentError('Payment window was closed before completing payment.');
        },
        onError: (err) => {
          setPaymentStatus('idle');
          setPaymentError(
            err?.message ||
              'Could not display the Paystack modal in this frame. You can use the direct Paystack checkout link below.'
          );
        },
      });
    } catch (err) {
      setPaymentStatus('idle');
      setPaymentError(
        err instanceof Error ? err.message : 'Unable to start Paystack payment.'
      );
    }
  };

  return (
    <div>
      <PageHero
        eyebrow="Your Order"
        title="Shopping Cart"
        subtitle="Review your selected Nigerian meals, adjust quantities, and pay securely with Paystack."
        image="/src/assets/images/dish_eba_egusi_1795202396359.jpg"
        imageAlt="Nigerian Eba and Egusi Soup plated in ceramic stoneware"
      />

      <section className="py-12 sm:py-20 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {receipt ? (
            <div className="max-w-xl mx-auto bg-[#FFFFFF] rounded-xl border border-[#143628]/20 p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-7 h-7 text-[#143628] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#C05621]">
                    Payment Confirmed
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-[#1C1917]">
                    Thank You for Your Order
                  </h2>
                  <p className="mt-1 text-sm text-[#57534E]">
                    Reference:{' '}
                    <code className="text-xs bg-[#F3EEE6] px-1.5 py-0.5 rounded text-[#1C1917]">
                      {receipt.reference}
                    </code>
                  </p>
                </div>
              </div>

              <div className="border-y border-[#1C1917]/10 py-4 space-y-2.5 text-sm">
                {receipt.items.map((item) => (
                  <div key={item.mealId} className="flex items-center justify-between gap-4">
                    <span className="text-[#1C1917]">
                      {item.quantity} × {item.name}
                    </span>
                    <span className="tabular-nums font-medium text-[#1C1917]">
                      {formatNaira(item.lineTotalNaira)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1C1917]">Total Paid (Paystack)</span>
                <span className="tabular-nums font-display text-2xl font-semibold text-[#143628]">
                  {formatNaira(receipt.totalNaira)}
                </span>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/menu"
                  onClick={() => setReceipt(null)}
                  className="px-6 py-3 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-[#FAF7F2] text-sm font-medium transition-colors"
                >
                  Order More Meals
                </Link>
                <Link
                  to="/account"
                  className="px-6 py-3 rounded-lg border border-[#1C1917]/15 text-sm font-medium text-[#1C1917] hover:bg-[#F3EEE6] transition-colors"
                >
                  View Account
                </Link>
              </div>
            </div>
          ) : isLoading ? (
            <div className="max-w-lg mx-auto text-center py-12 px-6 bg-[#FFFFFF] rounded-xl border border-[#1C1917]/8">
              <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#143628]/20 border-t-[#143628] animate-spin" />
              <p className="mt-4 text-sm text-[#57534E]">Loading your cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="max-w-lg mx-auto text-center py-12 px-6 bg-[#FFFFFF] rounded-xl border border-[#1C1917]/8">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#F3EEE6] text-[#143628] flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-[#1C1917]">
                Your Cart Is Empty
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-[#57534E] leading-relaxed">
                Explore our Nigerian rice dishes, traditional swallows and soups, and kitchen
                specials to add meals to your cart.
              </p>
              <Link
                to="/menu"
                className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-[#FAF7F2] text-sm font-medium transition-colors"
              >
                <span>Continue Shopping</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Cart Items List */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1C1917]/10">
                  <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#1C1917]">
                    Selected Meals ({totalItems})
                  </h2>
                  <button
                    type="button"
                    onClick={clearCart}
                    disabled={paymentStatus !== 'idle'}
                    className="text-xs sm:text-sm font-medium text-[#57534E] hover:text-[#B91C1C] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Clear Cart
                  </button>
                </div>

                {items.map(({ meal, quantity }) => (
                  <article
                    key={meal.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-[#FFFFFF] rounded-xl border border-[#1C1917]/8 p-4 sm:p-5"
                  >
                    <Link
                      to={`/menu/${meal.id}`}
                      className="w-full sm:w-32 aspect-[4/3] rounded-lg overflow-hidden bg-[#F3EEE6] shrink-0"
                    >
                      <DishImage
                        src={meal.image}
                        alt={meal.name}
                        title={meal.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#57534E]">{meal.category}</p>
                      <h3 className="mt-0.5 font-display text-lg font-semibold text-[#1C1917]">
                        <Link
                          to={`/menu/${meal.id}`}
                          className="hover:text-[#143628] transition-colors"
                        >
                          {meal.name}
                        </Link>
                      </h3>
                      <p className="mt-1 tabular-nums text-sm text-[#57534E]">
                        {formatNaira(meal.price)} each
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#1C1917]/8">
                      {/* Quantity Stepper */}
                      <div className="inline-flex items-center rounded-lg border border-[#1C1917]/15 bg-[#FAF7F2]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(meal.id, quantity - 1)}
                          aria-label={`Decrease quantity of ${meal.name}`}
                          className="p-2 text-[#1C1917] hover:bg-[#F3EEE6] rounded-l-lg transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="tabular-nums px-3 text-sm font-semibold text-[#1C1917] min-w-[2rem] text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(meal.id, quantity + 1)}
                          aria-label={`Increase quantity of ${meal.name}`}
                          className="p-2 text-[#1C1917] hover:bg-[#F3EEE6] rounded-r-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="text-right min-w-[5.5rem]">
                        <p className="tabular-nums text-base font-semibold text-[#143628]">
                          {formatNaira(meal.price * quantity)}
                        </p>
                      </div>

                      {/* Remove Item */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(meal.id)}
                        aria-label={`Remove ${meal.name} from cart`}
                        className="p-2 rounded-lg text-[#57534E] hover:text-[#B91C1C] hover:bg-[#B91C1C]/8 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                ))}

                <div className="pt-2">
                  <Link
                    to="/menu"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#143628] hover:text-[#C05621] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Continue Shopping</span>
                  </Link>
                </div>
              </div>

              {/* Order Summary & Paystack Checkout */}
              <aside className="lg:col-span-4 bg-[#FFFFFF] rounded-xl border border-[#1C1917]/8 p-6 sm:p-7 space-y-5">
                <h2 className="font-display text-xl font-semibold text-[#1C1917]">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm border-b border-[#1C1917]/10 pb-4">
                  <div className="flex items-center justify-between text-[#57534E]">
                    <span>Items ({totalItems})</span>
                    <span className="tabular-nums font-medium text-[#1C1917]">
                      {formatNaira(subtotal)}
                    </span>
                  </div>
                  {email && (
                    <div className="flex items-center justify-between gap-3 text-[#57534E]">
                      <span>Receipt Email</span>
                      <span className="truncate text-[#1C1917] max-w-[180px]">{email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-[#1C1917]">Total</span>
                  <span className="tabular-nums font-display text-2xl font-semibold text-[#143628]">
                    {formatNaira(subtotal)}
                  </span>
                </div>

                {paymentError && (
                  <div
                    role="alert"
                    className="rounded-lg bg-[#B91C1C]/8 border border-[#B91C1C]/20 p-3.5 flex items-start gap-2.5 text-xs text-[#B91C1C]"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{paymentError}</p>
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  <button
                    type="button"
                    onClick={handlePayWithPaystack}
                    disabled={paymentStatus !== 'idle'}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-[#143628] hover:bg-[#1D4B38] disabled:opacity-60 text-[#FAF7F2] text-sm font-medium transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {paymentStatus === 'initializing'
                        ? 'Starting Paystack...'
                        : paymentStatus === 'awaiting'
                        ? 'Complete Payment in Paystack...'
                        : paymentStatus === 'verifying'
                        ? 'Verifying Payment...'
                        : `Pay ${formatNaira(subtotal)} with Paystack`}
                    </span>
                  </button>

                  {fallbackAuthUrl && (
                    <a
                      href={fallbackAuthUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#C05621] hover:bg-[#9C4217] text-white text-xs font-medium transition-colors"
                    >
                      <span>Open Paystack Checkout Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <Link
                    to="/menu"
                    className="block w-full text-center px-5 py-3 rounded-lg border border-[#1C1917]/15 text-sm font-medium text-[#1C1917] hover:bg-[#F3EEE6] transition-colors"
                  >
                    Continue Shopping
                  </Link>
                </div>

                <p className="text-xs text-[#57534E] leading-relaxed">
                  Totals are calculated and verified server-side in Nigerian Naira (₦) via Paystack.
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
