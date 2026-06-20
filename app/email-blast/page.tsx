'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function EmailBlastPage() {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python'>('curl');

  const codeSnippets = {
    curl: `curl -X POST https://api.bztel.com/v1/email/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "client@example.com",
    "from": "admin@bztel.net",
    "subject": "🚀 Welcome to BZTel!",
    "body_html": "<html><body><h2>Welcome!</h2><p>Get 5,000 free credits today.</p></body></html>"
  }'`,
    node: `import fetch from 'node-fetch';

const response = await fetch('https://api.bztel.com/v1/email/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: 'client@example.com',
    from: 'admin@bztel.net',
    subject: '🚀 Welcome to BZTel!',
    body_html: '<html><body><h2>Welcome!</h2><p>Get 5,000 free credits today.</p></body></html>'
  })
});

const data = await response.json();
console.log(data);`,
    python: `import requests
import json

url = "https://api.bztel.com/v1/email/send"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "to": "client@example.com",
    "from": "admin@bztel.net",
    "subject": "🚀 Welcome to BZTel!",
    "body_html": "<html><body><h2>Welcome!</h2><p>Get 5,000 free credits today.</p></body></html>"
}

res = requests.post(url, headers=headers, data=json.dumps(payload))
print(res.json())`
  };

  return (
    <>
      <title>Email Blast & Bulk SMTP API - BZTel</title>
      <meta name="description" content="Design, schedule, and broadcast bulk marketing email campaigns and transactional emails with premium SMTP relays and high inbox delivery rates." />
      
      <link rel="stylesheet" href="/css/landing.css" />
      <Header activePage="email-blast" />

      {/* Hero Section */}
      <section className="hero-l" style={{ paddingTop: '150px', background: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), var(--bg-light)', display: 'block' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }} className="reveal reveal-scale reveal-active">
          <span className="hero-tag-l">EMAIL CAMPAIGNS</span>
          <h1 className="hero-title-l" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '20px', lineHeight: 1.1 }}>High-Inbox Email Blast Platform</h1>
          <p className="hero-subtitle-l" style={{ fontSize: '1.15rem', color: 'var(--text-slate)', maxWidth: '700px', margin: '0 auto 36px', lineHeight: 1.6 }}>Dispatch high-volume marketing campaigns and transactional SMTP relays. BZTel combines custom templates, email list filters, and bounce prevention protocols to ensure your emails reach the inbox.</p>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="sect-l sect-l-offset" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="sect-header-l reveal reveal-active">
          <span className="sect-tag-l">DELIVERABILITY</span>
          <h2 className="sect-title-l">Advanced Email Engineering</h2>
          <p className="sect-subtitle-l">Bypass spam filters with dedicated infrastructure, secure SPF/DKIM validation, and dynamic content merging.</p>
        </div>

        <div className="api-grid-l" style={{ maxWidth: '1100px' }}>
          <div className="api-card-l reveal reveal-scale reveal-active">
            <div className="benefit-icon-box" style={{ marginBottom: '20px' }}>
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
              </svg>
            </div>
            <h3 className="api-card-title-l">SMTP Relay Networks</h3>
            <p className="api-card-desc-l" style={{ fontSize: '0.85rem' }}>Integrate seamlessly with legacy systems or REST APIs. Build transactional welcome emails, account alerts, and billing workflows instantly.</p>
          </div>

          <div className="api-card-l reveal reveal-scale reveal-active">
            <div className="benefit-icon-box" style={{ marginBottom: '20px' }}>
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
            </div>
            <h3 className="api-card-title-l">Campaign Analytics</h3>
            <p className="api-card-desc-l" style={{ fontSize: '0.85rem' }}>Receive instant webhook updates for click-through stats, bounce events, spam complaints, unsubscribe requests, and email opens.</p>
          </div>

          <div className="api-card-l reveal reveal-scale reveal-active">
            <div className="benefit-icon-box" style={{ marginBottom: '20px' }}>
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="api-card-title-l">Reputation Management</h3>
            <p className="api-card-desc-l" style={{ fontSize: '0.85rem' }}>Avoid blacklists. Route volume broadcasts through warm dedicated IP pools with automatic header alignments to protect domains.</p>
          </div>
        </div>
      </section>

      {/* Deep-dive Content & Developer Integration */}
      <section className="sect-l">
        <div className="software-l" style={{ maxWidth: '1100px', display: 'flex', gap: '40px', alignItems: 'start' }}>
          
          {/* Detailed Content */}
          <div className="software-content-l reveal reveal-left reveal-active" style={{ flex: 1.1 }}>
            <span className="hero-tag-l">BULK BROADCASTING</span>
            <h2 className="hero-title-l" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-dark)' }}>Enterprise Email Infrastructure</h2>
            <p className="hero-subtitle-l" style={{ fontSize: '0.95rem', color: 'var(--text-slate)', lineHeight: 1.65, marginBottom: '20px' }}>Sending marketing blasts requires optimized dispatch channels. BZTel scales delivery throughput automatically based on account tier settings, ensuring multi-million recipient campaigns are processed smoothly.</p>
            
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '8px' }}>Audience Segmentation & Lists</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>Target user groups dynamically. Create lists based on purchase history, subscriber status, or geographic timezone, and integrate custom variables like names and discount codes directly into template blocks.</p>

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '8px' }}>CAN-SPAM & GDPR Consent Checkers</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>Deliver compliant newsletters. Our template engine validates and embeds physical address footers, standard header links, and automated single-click unsubscribe links automatically.</p>
          </div>

          {/* Developer Sandbox */}
          <div className="code-editor-l reveal reveal-right reveal-active" style={{ flex: 0.9, minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
            <div className="editor-header-l">
              <ul className="editor-tabs-l">
                <li className={`editor-tab-l ${activeLang === 'curl' ? 'active' : ''}`} onClick={() => setActiveLang('curl')}>cURL</li>
                <li className={`editor-tab-l ${activeLang === 'node' ? 'active' : ''}`} onClick={() => setActiveLang('node')}>Node.js</li>
                <li className={`editor-tab-l ${activeLang === 'python' ? 'active' : ''}`} onClick={() => setActiveLang('python')}>Python</li>
              </ul>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Email API v1</span>
            </div>
            <div className="editor-body-l" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', minHeight: '260px' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                {codeSnippets[activeLang]}
              </pre>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </>
  );
}
