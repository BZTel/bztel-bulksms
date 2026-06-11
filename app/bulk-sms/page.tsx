'use client';

import { useState, useEffect } from 'react';

export default function BulkSmsPage() {
  const [recipients, setRecipients] = useState(1000);
  const [message, setMessage] = useState('Hi [Name], get 20% off our software consulting this week!');
  const [charCount, setCharCount] = useState(61);
  const [pages, setPages] = useState(1);
  const [credits, setCredits] = useState(1000);

  useEffect(() => {
    const chars = message.length;
    const computedPages = Math.max(1, Math.ceil(chars / 160));
    const recs = Math.max(1, recipients);
    
    setCharCount(chars);
    setPages(computedPages);
    setCredits(recs * computedPages);
  }, [message, recipients]);

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
          <li><a href="/bulk-sms" className="nav-link-l active">Bulk SMS</a></li>
          <li><a href="/software-development" className="nav-link-l">Software Development</a></li>
          <li><a href="/pricing" className="nav-link-l">Pricing</a></li>
          <li><a href="/contact" className="nav-link-l">Contact Us</a></li>
        </ul>

        <div className="nav-actions-l">
          <a href="/app" className="nav-login-btn">Log in</a>
          <a href="/app" className="btn-l btn-l-primary" style={{ borderRadius: 'var(--border-radius-sm)', padding: '8px 18px' }}>Sign Up</a>
        </div>
      </header>

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
                <div className="benefit-icon-box" style={{ marginTop: '2px' }}><svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></div>
                <div>
                  <strong style={{ color: 'var(--text-dark)', fontSize: '0.95rem' }}>Dynamic Personalization Tags</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginTop: '2px' }}>Insert <code>[Name]</code> inside campaign messages to personalize dispatches dynamically for each recipient based on your contact directories.</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div className="benefit-icon-box" style={{ marginTop: '2px' }}><svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                <div>
                  <strong style={{ color: 'var(--text-dark)', fontSize: '0.95rem' }}>Asynchronous Queue Simulation</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginTop: '2px' }}>Our simulated telecom gateway updates campaign queues asynchronously, reflecting delivery rates and credit usage on live charts.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive SMS Cost Estimator Demo */}
          <div className="api-card-l reveal reveal-right reveal-active" style={{ padding: '30px', flex: 0.8, background: '#ffffff', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-dark)' }}>Cost & Credit Calculator</h3>
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
            <a href="/app" className="btn-l btn-l-primary btn-block" style={{ padding: '10px', fontSize: '0.85rem', display: 'block', textAlign: 'center', marginTop: '20px' }}>Send Campaign Now</a>
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
