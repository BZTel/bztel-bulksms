'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const currencyConfig = {
  USD: { symbol: '$', rate: 1.0, decimals: 3, decimalsLarge: 0 },
  GHS: { symbol: 'GH₵', rate: 15.0, decimals: 2, decimalsLarge: 0 },
  NGN: { symbol: '₦', rate: 1500.0, decimals: 1, decimalsLarge: 0 }
};

export default function BulkSmsPage() {
  const [recipients, setRecipients] = useState(1000);
  const [message, setMessage] = useState('Hi [Name], get 20% off our software consulting this week!');
  const [charCount, setCharCount] = useState(61);
  const [pages, setPages] = useState(1);
  const [credits, setCredits] = useState(1000);
  const currency = 'NGN';

  useEffect(() => {
    const chars = message.length;
    const computedPages = Math.max(1, Math.ceil(chars / 160));
    const recs = Math.max(1, recipients);
    
    setCharCount(chars);
    setPages(computedPages);
    setCredits(recs * computedPages);
  }, [message, recipients]);

  const config = currencyConfig[currency];

  // Compute pricing variables (₦6.50 base rate, discounted to ₦6.30 for 100,000+ units)
  let rateUsd = 6.5 / 1500;
  if (credits >= 100000) {
    rateUsd = 6.3 / 1500;
  }

  const localRate = rateUsd * config.rate;
  const rateLabel = currency === 'NGN' 
    ? `${config.symbol}${localRate.toFixed(2)} / SMS` 
    : `${(localRate * 100).toFixed(2)}¢ / SMS`;
  const estimatedCost = credits * localRate;
  const costLabel = `${config.symbol}${estimatedCost.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  return (
    <>
      <link rel="stylesheet" href="/css/landing.css" />
      <Header activePage="bulk-sms" />

      {/* Hero Section */}
      <section className="hero-l" style={{ paddingTop: '150px', background: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), var(--bg-light)', display: 'block' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }} className="reveal reveal-scale reveal-active">
          <span className="hero-tag-l">PRODUCT OVERVIEW</span>
          <h1 className="hero-title-l" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '20px', lineHeight: 1.1 }}>Bulk SMS Campaign Broadcasting</h1>
          <p className="hero-subtitle-l" style={{ fontSize: '1.15rem', color: 'var(--text-slate)', maxWidth: '700px', margin: '0 auto 36px', lineHeight: 1.6 }}>Send high-volume SMS dispatches worldwide in seconds. BZTel integrates campaign builders, personalization tokens, and automated contact lists into one premium dashboard console.</p>
          <a href="/app" className="btn-l btn-l-primary" style={{ padding: '14px 32px' }}>Launch Campaign Portal &rarr;</a>
        </div>
      </section>

      <section className="sect-l sect-l-offset">
        <div className="software-l" style={{ maxWidth: '1100px', display: 'flex', gap: '40px' }}>
          <div className="software-content-l reveal reveal-left reveal-active" style={{ flex: 1.2 }}>
            <span className="hero-tag-l">SMS BROADCASTING FEATURES</span>
            <h2 className="hero-title-l" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-dark)' }}>Built for Higher Delivery success and Customer Engagement</h2>
            <p className="hero-subtitle-l" style={{ fontSize: '0.95rem', color: 'var(--text-slate)', lineHeight: 1.65, marginBottom: '24px' }}>Our campaign console bypasses cellular blockages and route lag by utilizing dynamic simulation models. We help companies test customer alerts, verify recipient numbers, and evaluate campaign costs instantly.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div className="benefit-icon-box" style={{ marginTop: '2px' }}><svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></div>
                <div>
                  <strong style={{ color: 'var(--text-dark)', fontSize: '0.95rem' }}>Dynamic Personalization Tags</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginTop: '2px' }}>Insert <code>[Name]</code> inside campaign messages to personalize dispatches dynamically for each recipient based on your contact directories.</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div className="benefit-icon-box" style={{ marginTop: '2px' }}><svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                <div>
                  <strong style={{ color: 'var(--text-dark)', fontSize: '0.95rem' }}>Asynchronous Queue Simulation</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginTop: '2px' }}>Our simulated telecom gateway updates campaign queues asynchronously, reflecting delivery rates and credit usage on live charts.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive SMS Cost Estimator Demo */}
          <div className="api-card-l reveal reveal-right reveal-active" style={{ padding: '30px', flex: 0.8, background: '#ffffff', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-dark)', margin: 0 }}>Cost & Credit Calculator</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Calculate campaign costs dynamically. Each message represents 160 characters (GSM 7-bit standard).</p>
            
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>Number of Recipients</label>
              <input 
                type="number" 
                className="form-control" 
                value={recipients} 
                min="1" 
                style={{ background: 'var(--bg-offset)', padding: '8px 12px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                onChange={(e) => setRecipients(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>Campaign Message</label>
              <textarea 
                className="form-control" 
                style={{ background: 'var(--bg-offset)', fontSize: '0.85rem', minHeight: '80px', width: '100%', boxSizing: 'border-box' }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>{charCount} character{charCount !== 1 ? 's' : ''} ({pages} page{pages > 1 ? 's' : ''})</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{credits.toLocaleString()} Credits</span>
              </div>
            </div>

            {/* Cost Breakdown Details */}
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-slate)' }}>Total Credits Required:</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>{credits.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-slate)' }}>Unit Rate:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)' }}>{rateLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.12)', padding: '10px 12px', borderRadius: 'var(--border-radius-sm)', marginTop: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>Total Amount to Pay:</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--accent-purple)', fontFamily: 'var(--font-heading)' }}>{costLabel}</strong>
              </div>
            </div>

            {credits >= 100000 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', color: '#047857', padding: '8px 12px', borderRadius: 'var(--border-radius-sm)', fontSize: '0.75rem', marginTop: '12px' }}>
                <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Bulk discount applied (rates reduced to {rateLabel})</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(79, 70, 229, 0.03)', border: '1px solid rgba(79, 70, 229, 0.08)', color: 'var(--text-slate)', padding: '8px 12px', borderRadius: 'var(--border-radius-sm)', fontSize: '0.75rem', marginTop: '12px' }}>
                <svg style={{ width: '14px', height: '14px', color: 'var(--accent-purple)', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Tip: Purchase 100,000+ units to unlock bulk rate: {currency === 'NGN' ? '₦6.30' : `${((6.3 / 1500) * config.rate * 100).toFixed(2)}¢`} / SMS.</span>
              </div>
            )}
            <a href="/app" className="btn-l btn-l-primary btn-block" style={{ padding: '10px', fontSize: '0.85rem', display: 'block', textAlign: 'center', marginTop: '20px' }}>Buy Now</a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
