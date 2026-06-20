'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

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
      <Header activePage="voice" />

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

      <Footer />
    </>
  );
}
