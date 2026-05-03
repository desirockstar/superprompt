'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Get started with AI prompts',
    features: [
      'Browse all prompts for free',
      // 'Preview first 2-3 lines',
      'Unlimited unlocks via ads',
      'View prompt ratings',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Monthly',
    price: '$1.99',
    billing: '/month',
    description: 'Unlimited access with maximum flexibility',
    features: [
      'All Free features',
      'Unlimited prompt access',
      'Full content for all tiers',
      'Priority search',
      'View detailed evaluations',
      'Cancel anytime',
    ],
    cta: 'Start Monthly',
    highlighted: true,
  },
  {
    name: 'Yearly',
    price: '$9.99',
    billing: '/year',
    description: 'Best value - annual plan',
    features: [
      'All Monthly features',
      'Annual billing',
      '~$0.83 per month',
      'Priority support',
      'Exclusive prompt collections',
      'Early access to new features',
    ],
    cta: 'Start Yearly',
    highlighted: false,
  },
  {
    name: 'Lifetime',
    price: '$99.99',
    description: 'Lifetime access - one-time payment',
    features: [
      'All features forever',
      'No recurring charges',
      'Lifetime updates',
      'Priority support',
      'Exclusive prompt collections',
      'Early access to new features',
      'Lifetime guarantee',
    ],
    cta: 'Get Forever Access',
    highlighted: false,
  },
];

export default function PricingPage() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen pt-32 pb-20 px-4 transition-colors ${
      isDark
        ? 'bg-gradient-to-b from-black via-slate-950 to-black'
        : 'bg-gradient-to-b from-white via-gray-50 to-white'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 transition-colors ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Simple, Transparent Pricing
          </h1>
          <p className={`text-xl max-w-2xl mx-auto transition-colors ${
            isDark ? 'text-white/70' : 'text-slate-600'
          }`}>
            Choose the plan that works for you. Unlock unlimited access to high-quality AI prompts.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 border transition-all ${
                plan.highlighted
                  ? isDark
                    ? 'border-blue-500 bg-gradient-to-b from-blue-500/10 to-blue-500/5 shadow-lg shadow-blue-500/20 lg:scale-105'
                    : 'border-blue-400 bg-gradient-to-b from-blue-50 to-blue-50/50 shadow-lg shadow-blue-200/40 lg:scale-105'
                  : isDark
                  ? 'border-white/10 bg-white/5 hover:border-white/20'
                  : 'border-gray-300 bg-gray-100/50 hover:border-gray-400'
              }`}
            >
              {plan.highlighted && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-white px-4 py-1 rounded-full text-sm font-semibold transition-colors ${
                  isDark ? 'bg-blue-600' : 'bg-blue-500'
                }`}>
                  Most Popular
                </div>
              )}

              <h3 className={`text-2xl font-bold mb-2 transition-colors ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>{plan.name}</h3>
              <p className={`text-sm mb-6 transition-colors ${
                isDark ? 'text-white/70' : 'text-slate-600'
              }`}>{plan.description}</p>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-bold transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>{plan.price}</span>
                  {plan.billing && <span className={`transition-colors ${
                    isDark ? 'text-white/70' : 'text-slate-600'
                  }`}>{plan.billing}</span>}
                </div>
              </div>

              <Link href="/register" className="block w-full mb-8">
                <Button
                  className={`w-full rounded-lg font-semibold h-11 transition-all ${
                    plan.highlighted
                      ? isDark
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                      : isDark
                      ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                      : 'bg-gray-200 text-slate-900 hover:bg-gray-300 border border-gray-300'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>

              <div className="space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className={`text-sm transition-colors ${
                      isDark ? 'text-white/80' : 'text-slate-700'
                    }`}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className={`rounded-2xl p-12 mb-20 border transition-colors ${
          isDark
            ? 'bg-white/5 border-white/10'
            : 'bg-gray-100 border-gray-300'
        }`}>
          <h2 className={`text-3xl font-bold mb-12 transition-colors ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>Frequently Asked Questions</h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className={`text-lg font-semibold mb-3 transition-colors ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Can I cancel anytime?</h3>
              <p className={`transition-colors ${
                isDark ? 'text-white/70' : 'text-slate-600'
              }`}>
                Yes! Monthly subscriptions can be canceled at any time without penalties. Yearly subscriptions are annual commitments, but we offer a 30-day money-back guarantee.
              </p>
            </div>

            <div>
              <h3 className={`text-lg font-semibold mb-3 transition-colors ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>What payment methods do you accept?</h3>
              <p className={`transition-colors ${
                isDark ? 'text-white/70' : 'text-slate-600'
              }`}>
                We accept all major credit cards via Stripe. All payments are secure and encrypted.
              </p>
            </div>

            <div>
              <h3 className={`text-lg font-semibold mb-3 transition-colors ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Is there a free trial?</h3>
              <p className={`transition-colors ${
                isDark ? 'text-white/70' : 'text-slate-600'
              }`}>
                The free plan gives you access to all prompts with previews. You can unlock individual prompts via ads or upgrade to a paid plan anytime.
              </p>
            </div>

            <div>
              <h3 className={`text-lg font-semibold mb-3 transition-colors ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Can I upgrade or downgrade?</h3>
              <p className={`transition-colors ${
                isDark ? 'text-white/70' : 'text-slate-600'
              }`}>
                Yes, you can upgrade from monthly to yearly or cancel anytime. We'll prorate any charges accordingly.
              </p>
            </div>

            <div>
              <h3 className={`text-lg font-semibold mb-3 transition-colors ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Do you offer refunds?</h3>
              <p className={`transition-colors ${
                isDark ? 'text-white/70' : 'text-slate-600'
              }`}>
                We offer a 30-day money-back guarantee on all plans. Contact support if you're not satisfied.
              </p>
            </div>

            <div>
              <h3 className={`text-lg font-semibold mb-3 transition-colors ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>What if I need more help?</h3>
              <p className={`transition-colors ${
                isDark ? 'text-white/70' : 'text-slate-600'
              }`}>
                Contact our support team at support@superprompt.ai for any questions or issues.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className={`text-3xl font-bold mb-4 transition-colors ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>Ready to unlock unlimited prompts?</h2>
          <p className={`mb-8 max-w-2xl mx-auto transition-colors ${
            isDark ? 'text-white/70' : 'text-slate-600'
          }`}>
            Start with our free plan or upgrade to get instant access to all premium AI prompts.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button className={`rounded-lg text-white h-11 px-8 transition-colors ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}>
                Sign Up Now
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className={`rounded-lg h-11 px-8 border transition-colors ${
                isDark
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-gray-300 text-slate-900 hover:bg-gray-100'
              }`}>
                Browse Free Prompts
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
