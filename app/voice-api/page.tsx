'use client';

import { useState } from 'react';

export default function VoiceApiPage() {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python'>('curl');

  const codeSnippets = {
    curl: `curl -X POST https://api.bztel.com/v1/voice/call \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+2348054567890",
    "voice_engine": "premium_female_us",
    "play_text": "Hello Ramsey, this is BZTel. Your verification code is 8294.",
    "play_loops": 2
  }'`,
    node: `import fetch from 'node-fetch';

const response = await fetch('https://api.bztel.com/v1/voice/call', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '+2348054567890',
    voice_engine: 'premium_female_us',
    play_text: 'Hello Ramsey, this is BZTel. Your verification code is 8294.',
    play_loops: 2
  })
});

const data = await response.json();
console.log(data);`,
    python: `import requests
import json

url = "https://api.bztel.com/v1/voice/call"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "to": "+2348054567890",
    "voice_engine": "premium_female_us",
    "play_text": "Hello Ramsey, this is BZTel. Your verification code is 8294.",
    "play_loops": 2
}

res = requests.post(url, headers=headers, data=json.dumps(payload))
print(res.json())`
  };

  return (
    <>
      <title>Voice calling & TTS API - BZTel</title>
      <meta name="description" content="Integrate crystal-clear global voice calls, automated Text-to-Speech (TTS), and responsive IVR call routing systems into your applications." />
      
      <link rel="stylesheet" href="/css/landing.css" />

      {/* Top Contact Header Bar */}
      <div className="top-bar-l">
        <div className="top-bar-container-l">
          <div className="top-bar-info-l">
            {/* WhatsApp Item */}
            <div className="top-bar-item-l">
              <svg className="top-bar-icon-l" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.004 2C6.51 2 2.014 6.5 2.014 12c0 2.14.67 4.125 1.82 5.766L2 22l4.392-1.156c1.63.882 3.486 1.383 5.612 1.383 5.493 0 9.99-4.5 9.99-10S17.496 2 12.004 2zm6.273 14.17c-.26.736-1.503 1.345-2.07 1.41-.5.06-1.15.1-3.32-.76-2.77-1.1-4.56-3.93-4.7-4.12-.14-.19-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.26.26-.26.56-.32.74-.32.19 0 .38 0 .54.01.17.01.4.01.62.53.22.53.76 1.85.83 1.98.07.13.11.29.02.48-.09.19-.19.31-.37.52-.18.21-.38.48-.54.65-.18.19-.37.39-.16.74.21.35.94 1.55 2.01 2.5 1.39 1.23 2.56 1.62 2.92 1.8.36.18.57.15.79-.1.21-.24.93-1.08 1.18-1.45.25-.37.5-.31.84-.19.34.12 2.16 1.02 2.53 1.2.37.19.62.28.71.43.09.16.09.91-.17 1.65z"/>
              </svg>
              <div className="top-bar-text-l">
                <span className="top-bar-label-l">Mon - Sun (24/7)</span>
                <a href="https://wa.me/2348060257405" target="_blank" rel="noopener noreferrer" className="top-bar-value-l">
                  +234 806 025 7405 (WhatsApp Only)
                </a>
              </div>
            </div>
            
            {/* Email Item */}
            <div className="top-bar-item-l">
              <svg className="top-bar-icon-l" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <div className="top-bar-text-l">
                <span className="top-bar-label-l">Support Email</span>
                <a href="mailto:info@bztel.net" className="top-bar-value-l">
                  info@bztel.net
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>


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
          <li><a href="/pricing" className="nav-link-l">Pricing</a></li>
          <li><a href="/contact" className="nav-link-l">Contact Us</a></li>
        </ul>

        <div className="nav-actions-l">
          <a href="/app" className="nav-login-btn">Log in</a>
          <a href="/app" className="btn-l btn-l-primary" style={{ borderRadius: 'var(--border-radius-sm)', padding: '8px 18px' }}>Sign Up</a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-l" style={{ paddingTop: '150px', background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), var(--bg-light)', display: 'block' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }} className="reveal reveal-scale reveal-active">
          <span className="hero-tag-l">VOICE COMMUNICATIONS</span>
          <h1 className="hero-title-l" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '20px', lineHeight: 1.1 }}>Programmable Voice & Speech APIs</h1>
          <p className="hero-subtitle-l" style={{ fontSize: '1.15rem', color: 'var(--text-slate)', maxWidth: '700px', margin: '0 auto 36px', lineHeight: 1.6 }}>Deliver crystal-clear call quality worldwide. BZTel integrates automated Text-to-Speech (TTS), interactive key-press call routing (IVR), and live tracking metrics into one premium API framework.</p>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="sect-l sect-l-offset" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="sect-header-l reveal reveal-active">
          <span className="sect-tag-l">VOICE SERVICES</span>
          <h2 className="sect-title-l">Advanced Voice Engineering</h2>
          <p className="sect-subtitle-l">Automate telephone workflows, verify accounts securely with phone verification, and deploy interactive routing structures globally.</p>
        </div>

        <div className="api-grid-l" style={{ maxWidth: '1100px' }}>
          <div className="api-card-l reveal reveal-scale reveal-active">
            <div className="benefit-icon-box" style={{ marginBottom: '20px' }}>
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
            <h3 className="api-card-title-l">TTS Audio Synthesis</h3>
            <p className="api-card-desc-l" style={{ fontSize: '0.85rem' }}>Synthesize warm, natural-sounding voices in over 30 regional accents. Dynamically process script templates into human-like audio waveforms.</p>
          </div>

          <div className="api-card-l reveal reveal-scale reveal-active">
            <div className="benefit-icon-box" style={{ marginBottom: '20px' }}>
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="api-card-title-l">Interactive Menus (IVR)</h3>
            <p className="api-card-desc-l" style={{ fontSize: '0.85rem' }}>Capture keypress inputs from users (DTMF signals) to dynamically branch call menus, route customers to departments, or run database lookups.</p>
          </div>

          <div className="api-card-l reveal reveal-scale reveal-active">
            <div className="benefit-icon-box" style={{ marginBottom: '20px' }}>
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="api-card-title-l">Encrypted SIP Routing</h3>
            <p className="api-card-desc-l" style={{ fontSize: '0.85rem' }}>Route call packets over international telecom networks using primary SIP trunk integrations. Guaranteed secure audio tunnels via TLS/SRTP protocols.</p>
          </div>
        </div>
      </section>

      {/* Deep-dive Content & Developer Integration */}
      <section className="sect-l">
        <div className="software-l" style={{ maxWidth: '1100px', display: 'flex', gap: '40px', alignItems: 'start' }}>
          
          {/* Detailed Content */}
          <div className="software-content-l reveal reveal-left reveal-active" style={{ flex: 1.1 }}>
            <span className="hero-tag-l">VOICE SYSTEMS</span>
            <h2 className="hero-title-l" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-dark)' }}>Scalable Outbound Call Gateways</h2>
            <p className="hero-subtitle-l" style={{ fontSize: '0.95rem', color: 'var(--text-slate)', lineHeight: 1.65, marginBottom: '20px' }}>Connect and communicate programmatically. BZTel's queue architecture handles massive concurrent outbound call campaigns without resource contention, ensuring high-fidelity call delivery on cellular and landline networks alike.</p>
            
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '8px' }}>Webhooks for Call State Tracking</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>Track the lifecycle of every call in real-time. Receive instant HTTP POST webhooks when a call starts dialing, answers, encounters a busy signal, enters a keypress selection, or disconnects. Logs are immediately updated for auditing.</p>

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '8px' }}>Global Compliance & Recording Audits</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>Record calls programmatically with built-in consent flags to remain compliant with international call recording guidelines. Dual-channel audio recordings are compiled and saved into secure bucket links for retrieval.</p>
          </div>

          {/* Developer Sandbox */}
          <div className="code-editor-l reveal reveal-right reveal-active" style={{ flex: 0.9, minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
            <div className="editor-header-l">
              <ul className="editor-tabs-l">
                <li className={`editor-tab-l ${activeLang === 'curl' ? 'active' : ''}`} onClick={() => setActiveLang('curl')}>cURL</li>
                <li className={`editor-tab-l ${activeLang === 'node' ? 'active' : ''}`} onClick={() => setActiveLang('node')}>Node.js</li>
                <li className={`editor-tab-l ${activeLang === 'python' ? 'active' : ''}`} onClick={() => setActiveLang('python')}>Python</li>
              </ul>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Voice API v1</span>
            </div>
            <div className="editor-body-l" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', minHeight: '260px' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                {codeSnippets[activeLang]}
              </pre>
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
              <li><a href="/whatsapp-api">WhatsApp API</a></li>
              <li><a href="/voice-api">Voice API</a></li>
              <li><a href="/email-blast">Email Blast</a></li>
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
