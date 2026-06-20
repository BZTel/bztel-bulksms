'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function WhatsappApiPage() {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python'>('curl');

  const codeSnippets = {
    curl: `curl -X POST https://api.bztel.com/v1/whatsapp/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+2348054567890",
    "type": "template",
    "template_name": "shipping_update",
    "language": "en",
    "parameters": ["Ramsey", "Order #8492", "Track Package"]
  }'`,
    node: `import fetch from 'node-fetch';

const response = await fetch('https://api.bztel.com/v1/whatsapp/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '+2348054567890',
    type: 'template',
    template_name: 'shipping_update',
    language: 'en',
    parameters: ['Ramsey', 'Order #8492', 'Track Package']
  })
});

const data = await response.json();
console.log(data);`,
    python: `import requests
import json

url = "https://api.bztel.com/v1/whatsapp/send"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "to": "+2348054567890",
    "type": "template",
    "template_name": "shipping_update",
    "language": "en",
    "parameters": ["Ramsey", "Order #8492", "Track Package"]
}

res = requests.post(url, headers=headers, data=json.dumps(payload))
print(res.json())`
  };

  return (
    <>
      <title>WhatsApp Business API - BZTel</title>
      <meta name="description" content="Engage customers worldwide with BZTel's official WhatsApp Business API. Send transactional alerts, secure templates, and interactive messages." />
      
      <link rel="stylesheet" href="/css/landing.css" />
      <Header activePage="whatsapp" />

      {/* Hero Section */}
      <section className="hero-l" style={{ paddingTop: '150px', background: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), var(--bg-light)', display: 'block' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }} className="reveal reveal-scale reveal-active">
          <span className="hero-tag-l">WHATSAPP BUSINESS API</span>
          <h1 className="hero-title-l" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '20px', lineHeight: 1.1 }}>Official WhatsApp API Platform</h1>
          <p className="hero-subtitle-l" style={{ fontSize: '1.15rem', color: 'var(--text-slate)', maxWidth: '700px', margin: '0 auto 36px', lineHeight: 1.6 }}>Connect directly with customers on their favorite messaging app. BZTel provides robust official API endpoints to dispatch shipping alerts, support notifications, and rich interactive templates.</p>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="sect-l sect-l-offset" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="sect-header-l reveal reveal-active">
          <span className="sect-tag-l">CAPABILITIES</span>
          <h2 className="sect-title-l">Unlock Interactive Messaging</h2>
          <p className="sect-subtitle-l">Drive high-impact user experiences by leveraging rich media templates and rapid two-way conversational gates.</p>
        </div>

        <div className="api-grid-l" style={{ maxWidth: '1100px' }}>
          <div className="api-card-l reveal reveal-scale reveal-active">
            <div className="benefit-icon-box" style={{ marginBottom: '20px' }}>
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="api-card-title-l">Verified Senders</h3>
            <p className="api-card-desc-l" style={{ fontSize: '0.85rem' }}>Secure brand authority. Display your verified green tick alongside your business name, logo, contact card details, and operating status.</p>
          </div>

          <div className="api-card-l reveal reveal-scale reveal-active">
            <div className="benefit-icon-box" style={{ marginBottom: '20px' }}>
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="api-card-title-l">Interactive Action Buttons</h3>
            <p className="api-card-desc-l" style={{ fontSize: '0.85rem' }}>Allow users to reply instantly. Embed quick-reply button triggers, link backlines, phone call prompts, and menu selectors directly within template envelopes.</p>
          </div>

          <div className="api-card-l reveal reveal-scale reveal-active">
            <div className="benefit-icon-box" style={{ marginBottom: '20px' }}>
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="api-card-title-l">Rich Media Attachments</h3>
            <p className="api-card-desc-l" style={{ fontSize: '0.85rem' }}>Send and receive transactional PDFs, flight tickets, order invoices, shipping labels, and promotional image files automatically.</p>
          </div>
        </div>
      </section>

      {/* Deep-dive Content & Developer Integration */}
      <section className="sect-l">
        <div className="software-l" style={{ maxWidth: '1100px', display: 'flex', gap: '40px', alignItems: 'start' }}>
          
          {/* Detailed Content */}
          <div className="software-content-l reveal reveal-left reveal-active" style={{ flex: 1.1 }}>
            <span className="hero-tag-l">ENGAGEMENT GATEWAYS</span>
            <h2 className="hero-title-l" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-dark)' }}>Drive Conversations that Convert</h2>
            <p className="hero-subtitle-l" style={{ fontSize: '0.95rem', color: 'var(--text-slate)', lineHeight: 1.65, marginBottom: '20px' }}>Traditional SMS notifications get ignored or lost in simple inbox sorting. WhatsApp boasts a 98% open rate and a 45% response rate, making it the most immediate channel for business communications.</p>
            
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '8px' }}>Template Messages vs. Support Sessions</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>BZTel facilitates both outbound alerts and two-way helpdesk support. Start broadcasts using pre-approved message templates for outbound alerts. Once a user responds, an active 24-hour support session window opens, allowing free-form chat integration with your helpdesk team.</p>

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '8px' }}>Opt-In Management & Compliance</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>Maintain high sender reputation ratings. Our APIs handle user opt-in verifications automatically, keeping you compliant with WhatsApp's spam-prevention guidelines and routing paths.</p>
          </div>

          {/* Developer Sandbox */}
          <div className="code-editor-l reveal reveal-right reveal-active" style={{ flex: 0.9, minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
            <div className="editor-header-l">
              <ul className="editor-tabs-l">
                <li className={`editor-tab-l ${activeLang === 'curl' ? 'active' : ''}`} onClick={() => setActiveLang('curl')}>cURL</li>
                <li className={`editor-tab-l ${activeLang === 'node' ? 'active' : ''}`} onClick={() => setActiveLang('node')}>Node.js</li>
                <li className={`editor-tab-l ${activeLang === 'python' ? 'active' : ''}`} onClick={() => setActiveLang('python')}>Python</li>
              </ul>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-body)', fontWeight: 600 }}>WhatsApp API v1</span>
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
