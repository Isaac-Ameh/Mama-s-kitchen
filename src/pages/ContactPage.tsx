import React, { useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { PageHero } from '../components/PageHero';

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!name.trim()) {
      nextErrors.name = 'Please enter your name.';
    }
    if (!email.trim()) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!message.trim() || message.trim().length < 10) {
      nextErrors.message = 'Please enter a message of at least 10 characters.';
    }
    return nextErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitted(false);
      return;
    }

    setErrors({});
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div>
      <PageHero
        eyebrow="Get in Touch"
        title="We'd Love to Hear From You"
        subtitle="Questions about our Nigerian dishes, catering ideas, or dining experience? Reach out below."
        image="/src/assets/images/dish_jollof_grilled_chicken_1795202396120.jpg"
        imageAlt="Smoky Nigerian Jollof Rice with grilled chicken and sweet fried plantain"
      />

      <section className="py-16 sm:py-24 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left: Demonstration Contact Info & Opening Hours */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#C05621]">
                  Demonstration Details
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">
                  Visit or Reach Mama&apos;s Kitchen
                </h2>
                <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
                  Note: The address, phone number, and opening hours below are clearly labelled
                  demonstration placeholders for preview purposes.
                </p>
              </div>

              <div className="space-y-5 pt-4 border-t border-[#1C1917]/10">
                <div className="flex items-start gap-3.5">
                  <MapPin className="w-5 h-5 text-[#143628] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#1C1917]">
                      Address (Demo Placeholder)
                    </h3>
                    <p className="mt-0.5 text-sm text-[#57534E]">
                      14 Heritage Lane, Sample District (Demonstration Address)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Phone className="w-5 h-5 text-[#143628] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#1C1917]">
                      Phone (Demo Placeholder)
                    </h3>
                    <p className="mt-0.5 text-sm text-[#57534E] tabular-nums">
                      +234 (0) 800 000 0000
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Mail className="w-5 h-5 text-[#143628] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#1C1917]">
                      Email (Demo Placeholder)
                    </h3>
                    <p className="mt-0.5 text-sm text-[#57534E]">hello@mamaskitchen.example</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Clock className="w-5 h-5 text-[#143628] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#1C1917]">
                      Opening Hours (Demo Schedule)
                    </h3>
                    <ul className="mt-1 space-y-1 text-sm text-[#57534E]">
                      <li>Monday – Thursday: 11:00 AM – 9:30 PM</li>
                      <li>Friday – Saturday: 11:00 AM – 10:30 PM</li>
                      <li>Sunday: 12:00 PM – 9:00 PM</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Validated Demo Enquiry Form */}
            <div className="lg:col-span-7 bg-[#FFFFFF] rounded-xl border border-[#1C1917]/8 p-6 sm:p-8 lg:p-10">
              <h2 className="font-display text-2xl font-semibold text-[#1C1917]">
                Send an Enquiry (Demo Form)
              </h2>
              <p className="mt-2 text-sm text-[#57534E]">
                Test the form validation below. Because this is a product demonstration, submissions
                stay in your browser and are not sent to a live restaurant inbox.
              </p>

              {submitted && (
                <div
                  role="status"
                  className="mt-6 rounded-lg bg-[#143628]/6 border border-[#143628]/20 p-4 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#143628] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#143628]">
                      Demo Enquiry Recorded Locally
                    </p>
                    <p className="mt-1 text-sm text-[#57534E]">
                      Thank you for testing the contact form. Please note this is a demonstration
                      preview and no message was transmitted to an external restaurant.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-sm font-medium text-[#1C1917]"
                  >
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Adaobi Okafor"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                    className="mt-1.5 w-full rounded-lg border border-[#1C1917]/15 bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#1C1917] placeholder:text-[#57534E]/60 focus:outline-none focus:ring-2 focus:ring-[#143628]"
                  />
                  {errors.name && (
                    <p id="contact-name-error" className="mt-1.5 text-xs text-[#B91C1C]">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-medium text-[#1C1917]"
                  >
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'contact-email-error' : undefined}
                    className="mt-1.5 w-full rounded-lg border border-[#1C1917]/15 bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#1C1917] placeholder:text-[#57534E]/60 focus:outline-none focus:ring-2 focus:ring-[#143628]"
                  />
                  {errors.email && (
                    <p id="contact-email-error" className="mt-1.5 text-xs text-[#B91C1C]">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-sm font-medium text-[#1C1917]"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you are looking for..."
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'contact-message-error' : undefined}
                    className="mt-1.5 w-full rounded-lg border border-[#1C1917]/15 bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#1C1917] placeholder:text-[#57534E]/60 focus:outline-none focus:ring-2 focus:ring-[#143628]"
                  />
                  {errors.message && (
                    <p id="contact-message-error" className="mt-1.5 text-xs text-[#B91C1C]">
                      {errors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#143628] hover:bg-[#1D4B38] text-[#FAF7F2] text-sm font-medium transition-colors cursor-pointer"
                >
                  Submit Demo Enquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
