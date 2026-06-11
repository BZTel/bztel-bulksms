'use client';

import { useState, useEffect } from 'react';

const currencyConfig = {
  USD: { symbol: '$', rate: 1.0, decimals: 3, decimalsLarge: 0 },
  GHS: { symbol: 'GH₵', rate: 15.0, decimals: 2, decimalsLarge: 0 },
  NGN: { symbol: '₦', rate: 1500.0, decimals: 1, decimalsLarge: 0 }
};

export default function PricingPage() {
  const [currency, setCurrency] = useState<'USD' | 'GHS' | 'NGN'>('USD');
  const [volume, setVolume] = useState(25000);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Auto-detect currency via geolocation and local timezone lookup
  useEffect(() => {
    async function detectCurrency() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data.country_code === 'GH') {
            setCurrency('GHS');
          } else if (data.country_code === 'NG') {
            setCurrency('NGN');
          } else {
            setCurrency('USD');
          }
          return;
        }
      } catch (err) {
        console.warn('Geolocation lookup failed, trying timezone detection...');
      }

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes('Accra')) {
        setCurrency('GHS');
      } else if (tz.includes('Lagos')) {
        setCurrency('NGN');
      } else {
        setCurrency('USD');
      }
    }
    detectCurrency();
  }, []);

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
  let rateUsd = 0.0099;
  if (volume >= 10000 && volume < 50000) {
    rateUsd = 0.0079;
  } else if (volume >= 50000 && volume < 200000) {
    rateUsd = 0.0069;
  } else if (volume >= 200000) {
    rateUsd = 0.0059;
  }

  const localRate = rateUsd * config.rate;
  const rateLabel = `${(localRate * 100).toFixed(2)}¢ / SMS`;
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

      {/* Navigation Bar */}
      <header className="navbar-l">
        <div className="logo-l" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
          <svg className="logo-l-icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm6 13c0 1.1-.9 2-2 2h-6V7h5.5c1.1 0 2 .9 2 2 0 .73-.4 1.36-1 1.72.6.36 1 .99 1 1.72v2.56zM10 9h4v2h-4V9zm0 4h4v2h-4v-2z" />
          </svg>
          <span className="logo-l-text">BZTel</span>
        </div>

        <ul className="nav-menu-l">
          <li><a href="/" className="nav-link-l">Home</a></li>
          <li><a href="/bulk-sms" className="nav-link-l">Bulk SMS</a></li>
          <li><a href="/software-development" className="nav-link-l">Software Development</a></li>
          <li><a href="/pricing" className="nav-link-l active">Pricing</a></li>
          <li><a href="/contact" className="nav-link-l">Contact Us</a></li>
        </ul>

        <div className="nav-actions-l">
          <select 
            id="currency-selector" 
            style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dark)', borderRadius: 'var(--border-radius-sm)', padding: '6px 12px', marginRight: '12px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
          >
            <option value="USD">USD ($)</option>
            <option value="GHS">GHS (GH₵)</option>
            <option value="NGN">NGN (₦)</option>
          </select>
          
          <a href="/app" className="nav-login-btn">Log in</a>
          <a href="/app" className="btn-l btn-l-primary" style={{ borderRadius: 'var(--border-radius-sm)', padding: '8px 18px' }}>Sign Up</a>
        </div>
      </header>

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
            <div className="pricing-card-val-l">{formatPrice(0.005)}</div>
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

          {/* OTP Card */}
          <div className="pricing-card-l reveal reveal-scale reveal-active">
            <span className="pricing-card-lbl-l">OTP SMS</span>
            <div className="pricing-card-val-l">{formatPrice(0.01)}</div>
            <div className="pricing-card-sub-l">Per OTP</div>
            <p className="pricing-card-desc-l" style={{ marginTop: '6px' }}>Fast & Secure Delivery</p>
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

      {/* Software Development consulting packages rates */}
      <section className="sect-l">
        <div className="sect-header-l reveal reveal-active">
          <span className="hero-tag-l">CONSULTING FEES</span>
          <h2 className="hero-title-l" style={{ color: 'var(--text-dark)', textAlign: 'center' }}>Custom Software Development Rates</h2>
          <p className="hero-subtitle-l" style={{ color: 'var(--text-slate)', textAlign: 'center' }}>Professional custom software engineering billed under transparent package agreements.</p>
        </div>

        <div className="api-grid-l" style={{ maxWidth: '1100px' }}>
          {/* MVP Package */}
          <div className="api-card-l reveal reveal-scale reveal-active" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 className="api-card-title-l" style={{ fontSize: '1.25rem' }}>MVP Startup Pack</h3>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)', fontFamily: 'var(--font-heading)', margin: '16px 0 8px' }}>{formatPrice(5000)}</div>
              <p className="api-card-desc-l" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>Ideal for early stage validation. Built in 3 to 5 weeks. Includes core database design, authentication dashboard, and mobile-responsive layouts.</p>
            </div>
            <a href="/software-development#consult-form" className="btn-l btn-l-primary btn-block">Discuss MVP</a>
          </div>

          {/* Growth Package */}
          <div className="api-card-l reveal reveal-scale reveal-active" style={{ position: 'relative', borderColor: 'var(--accent-purple)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-md)' }}>
            <div>
              <h3 className="api-card-title-l" style={{ fontSize: '1.25rem', color: 'var(--accent-purple)' }}>Growth & SaaS</h3>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'var(--font-heading)', margin: '16px 0 8px' }}>{formatPrice(15000)}</div>
              <p className="api-card-desc-l" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>Ideal for businesses launching multitenant platforms. Billed under fixed sprints. Includes payment gateways, Stripe billing, role permissions, and metrics tracking.</p>
            </div>
            <a href="/software-development#consult-form" className="btn-l btn-l-primary btn-block">Discuss Growth</a>
          </div>

          {/* Custom Enterprise */}
          <div className="api-card-l reveal reveal-scale reveal-active" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 className="api-card-title-l" style={{ fontSize: '1.25rem' }}>Custom Enterprise</h3>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)', fontFamily: 'var(--font-heading)', margin: '16px 0 8px' }}>{formatPrice(50000)}</div>
              <p className="api-card-desc-l" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>Dedicated engineering squads. Custom SLA support timelines, legacy database system migration, custom microservices mesh integration, and load scaling audits.</p>
            </div>
            <a href="/software-development#consult-form" className="btn-l btn-l-outline btn-block">Contact Architecture Team</a>
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

      {/* Footer Section */}
      <footer className="footer-l">
        <div className="footer-grid-l">
          <div className="footer-logo-box-l">
            <div className="logo-l" style={{ color: '#ffffff' }}>
              <svg className="logo-l-icon" fill="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm6 13c0 1.1-.9 2-2 2h-6V7h5.5c1.1 0 2 .9 2 2 0 .73-.4 1.36-1 1.72.6.36 1 .99 1 1.72v2.56zM10 9h4v2h-4V9zm0 4h4v2h-4v-2z" />
              </svg>
              <span style={{ fontSize: '1.25rem' }}>BZTel</span>
            </div>
            <p className="footer-logo-text-l">Empowering businesses with reliable communication APIs and custom software solutions that connect the world.</p>
          </div>

          <div className="footer-column-l">
            <h4>Products</h4>
            <ul className="footer-links-l">
              <li><a href="/bulk-sms">SMS API</a></li>
              <li><a href="/app">WhatsApp API</a></li>
              <li><a href="/app">OTP API</a></li>
            </ul>
          </div>

          <div className="footer-column-l">
            <h4>Software Development</h4>
            <ul className="footer-links-l">
              <li><a href="/software-development">Web Development</a></li>
              <li><a href="/software-development">Mobile Apps</a></li>
              <li><a href="/software-development">SaaS Development</a></li>
            </ul>
          </div>

          <div className="footer-column-l">
            <h4>Developers</h4>
            <ul className="footer-links-l">
              <li><a href="/#developers">API Docs</a></li>
              <li><a href="/#developers">SDKs & Libraries</a></li>
            </ul>
          </div>

          <div className="footer-column-l">
            <h4>Company</h4>
            <ul className="footer-links-l">
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom-l">
          <span>&copy; 2026 BZTel. All rights reserved.</span>
          <div className="footer-bottom-links-l">
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </>
  );
}
