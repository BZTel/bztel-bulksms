'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const currencyConfig = {
  USD: { symbol: '$', rate: 1.0, decimals: 3, decimalsLarge: 0 },
  GHS: { symbol: 'GH₵', rate: 15.0, decimals: 2, decimalsLarge: 0 },
  NGN: { symbol: '₦', rate: 1500.0, decimals: 1, decimalsLarge: 0 }
};

export default function PricingPage() {
  const currency = 'NGN';
  const [volume, setVolume] = useState(25000);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const config = currencyConfig[currency];

  const formatPrice = (usdVal: number) => {
    const converted = usdVal * config.rate;
    const decimals = usdVal >= 1000 ? config.decimalsLarge : config.decimals;
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return `${config.symbol}${formatted}${usdVal >= 1000 ? '+' : ''}`;
  };

  // Compute slider variables
  let rateUsd = 6.5 / 1500;
  if (volume >= 100000) {
    rateUsd = 6.3 / 1500;
  }



  const localRate = rateUsd * config.rate;
  const rateLabel = currency === 'NGN' 
    ? `${config.symbol}${localRate.toFixed(2)} / SMS` 
    : `${(localRate * 100).toFixed(2)}¢ / SMS`;
  const estimatedCost = volume * localRate;
  const costLabel = `${config.symbol}${estimatedCost.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <>
      <link rel="stylesheet" href="/css/landing.css" />
      <Header activePage="pricing" />

      {/* Hero Section */}
      <section className="hero-l" style={{ paddingTop: '150px', background: 'radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.08) 0%, transparent 50%), var(--bg-light)', display: 'block' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }} className="reveal reveal-scale reveal-active">
          <span className="hero-tag-l">BILLING SCHEMES</span>
          <h1 className="hero-title-l" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '20px', lineHeight: 1.1 }}>Simple, Transparent Pricing</h1>
          <p className="hero-subtitle-l" style={{ fontSize: '1.15rem', color: 'var(--text-slate)', maxWidth: '700px', margin: '0 auto 36px', lineHeight: 1.6 }}>No setup fees, lock-in contracts, or hidden billing. Pay only for the messages you broadcast and the custom engineering resources you consume.</p>
        </div>
      </section>

      {/* SMS API Pricing grid */}
      <section className="sect-l sect-l-offset">
        <div className="sect-header-l reveal reveal-active">
          <h2 className="sect-title-l" style={{ textAlign: 'center' }}>Communications API Rates</h2>
        </div>

        <div className="pricing-grid-l">
          {/* SMS card */}
          <div className="pricing-card-l reveal reveal-scale reveal-active">
            <span className="pricing-card-lbl-l">SMS</span>
            <div className="pricing-card-val-l">{formatPrice(6.5 / 1500)}</div>
            <div className="pricing-card-sub-l">Per SMS</div>
            <p className="pricing-card-desc-l" style={{ marginTop: '6px' }}>Worldwide SMS Delivery</p>
            <a href="/app" className="btn-l btn-l-outline btn-block" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Get Started</a>
          </div>

          {/* WhatsApp Card */}
          <div className="pricing-card-l reveal reveal-scale reveal-active">
            <span className="pricing-card-lbl-l">WhatsApp API</span>
            <div className="pricing-card-val-l">{formatPrice(0.03)}</div>
            <div className="pricing-card-sub-l">Per Conversation</div>
            <p className="pricing-card-desc-l" style={{ marginTop: '6px' }}>24-hour session window</p>
            <a href="/app" className="btn-l btn-l-outline btn-block" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Get Started</a>
          </div>

          {/* Voice Card */}
          <div className="pricing-card-l reveal reveal-scale reveal-active">
            <span className="pricing-card-lbl-l">Voice Call</span>
            <div className="pricing-card-val-l">{formatPrice(0.02)}</div>
            <div className="pricing-card-sub-l">Per Minute</div>
            <p className="pricing-card-desc-l" style={{ marginTop: '6px' }}>High Quality Voice</p>
            <a href="/app" className="btn-l btn-l-outline btn-block" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Get Started</a>
          </div>

          {/* Email Card */}
          <div className="pricing-card-l reveal reveal-scale reveal-active">
            <span className="pricing-card-lbl-l">Email API</span>
            <div className="pricing-card-val-l">{formatPrice(0.001)}</div>
            <div className="pricing-card-sub-l">Per Email</div>
            <p className="pricing-card-desc-l" style={{ marginTop: '6px' }}>Inbox Delivery</p>
            <a href="/app" className="btn-l btn-l-outline btn-block" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Get Started</a>
          </div>
        </div>

        {/* Volume Calculator Slider */}
        <div className="slider-container reveal reveal-scale reveal-active" style={{ maxWidth: '600px', margin: '40px auto 0' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '12px', textAlign: 'center' }}>Bulk Volume Discount Estimator</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Slide to adjust your estimated monthly SMS campaign volume.</p>
          
          <input 
            type="range" 
            className="slider-range" 
            min="1000" 
            max="250000" 
            step="5000" 
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
          />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Volume / Month</span>
              <strong style={{ fontSize: '1.35rem', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>{volume.toLocaleString()} SMS</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Estimated Rate</span>
              <strong style={{ fontSize: '1.35rem', color: 'var(--accent-purple)', fontFamily: 'var(--font-heading)' }}>{rateLabel}</strong>
            </div>
          </div>
          
          <div style={{ background: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.15)', padding: '12px', borderRadius: '6px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Estimated Monthly Cost:</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--text-dark)', fontFamily: 'var(--font-heading)' }}>{costLabel}</strong>
          </div>
        </div>
      </section>



      {/* FAQ Accordion Section */}
      <section className="sect-l sect-l-offset" id="faq" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="sect-header-l reveal reveal-active">
          <span className="hero-tag-l">QUESTIONS</span>
          <h2 className="hero-title-l" style={{ color: 'var(--text-dark)', textAlign: 'center' }}>Frequently Asked Questions</h2>
          <p className="hero-subtitle-l" style={{ color: 'var(--text-slate)', textAlign: 'center' }}>Find answers to common questions about billing, credits, and setup.</p>
        </div>

        <div className="faq-container" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* FAQ item 1 */}
          <div className={`faq-item ${activeFaq === 0 ? 'active' : ''}`} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', background: 'var(--bg-light)' }}>
            <button 
              className="faq-question" 
              style={{ width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', cursor: 'pointer', textAlign: 'left', outline: 'none' }}
              onClick={() => toggleFaq(0)}
            >
              <span>How are Bztel credits calculated?</span>
              <span className="faq-icon" style={{ fontSize: '1.25rem', fontWeight: 400 }}>{activeFaq === 0 ? '−' : '+'}</span>
            </button>
            <div className="faq-answer" style={{ maxHeight: activeFaq === 0 ? '200px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(0, 1, 0, 1)', padding: '0 24px' }}>
              <p style={{ paddingBottom: '20px', fontSize: '0.92rem', color: 'var(--text-slate)', lineHeight: 1.6 }}>SMS credits are calculated based on standard 160-character boundaries. 1 credit covers 1 SMS text globally. For voice broadcasting campaigns, calls are calculated at 2 credits per minute per recipient. WhatsApp conversation sessions last 24 hours per credit ticket.</p>
            </div>
          </div>

          {/* FAQ item 2 */}
          <div className={`faq-item ${activeFaq === 1 ? 'active' : ''}`} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', background: 'var(--bg-light)' }}>
            <button 
              className="faq-question" 
              style={{ width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', cursor: 'pointer', textAlign: 'left', outline: 'none' }}
              onClick={() => toggleFaq(1)}
            >
              <span>Do purchased balance credits expire?</span>
              <span className="faq-icon" style={{ fontSize: '1.25rem', fontWeight: 400 }}>{activeFaq === 1 ? '−' : '+'}</span>
            </button>
            <div className="faq-answer" style={{ maxHeight: activeFaq === 1 ? '200px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(0, 1, 0, 1)', padding: '0 24px' }}>
              <p style={{ paddingBottom: '20px', fontSize: '0.92rem', color: 'var(--text-slate)', lineHeight: 1.6 }}>No, Bztel balance credits never expire. Any SMS, voice, or conversation credits loaded onto your organization account remain active in your shared wallet indefinitely, allowing you to use them at your own convenience.</p>
            </div>
          </div>

          {/* FAQ item 3 */}
          <div className={`faq-item ${activeFaq === 2 ? 'active' : ''}`} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', background: 'var(--bg-light)' }}>
            <button 
              className="faq-question" 
              style={{ width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', cursor: 'pointer', textAlign: 'left', outline: 'none' }}
              onClick={() => toggleFaq(2)}
            >
              <span>Are there any setup fees or hidden subscription costs?</span>
              <span className="faq-icon" style={{ fontSize: '1.25rem', fontWeight: 400 }}>{activeFaq === 2 ? '−' : '+'}</span>
            </button>
            <div className="faq-answer" style={{ maxHeight: activeFaq === 2 ? '200px' : '0px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(0, 1, 0, 1)', padding: '0 24px' }}>
              <p style={{ paddingBottom: '20px', fontSize: '0.92rem', color: 'var(--text-slate)', lineHeight: 1.6 }}>No. Bztel is purely pay-as-you-go. There are no registration fees, monthly subscription retainers, or hidden lock-in contracts. You pay only for the communications you broadcast or custom engineering resources you purchase.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
