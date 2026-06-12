'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function HomePage() {
  const [currency, setCurrency] = useState<'USD' | 'GHS' | 'NGN'>('NGN');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<'curl' | 'python' | 'php' | 'node' | 'go'>('curl');
  const [phone, setPhone] = useState('+2348054567890');
  const [smsMsg, setSmsMsg] = useState('Hello from BzTel 🚀');
  const [sendingTest, setSendingTest] = useState(false);
  const [sentTest, setSentTest] = useState(false);
  const [showPushAlert, setShowPushAlert] = useState(false);
  const [pushText, setPushText] = useState('Hello from BzTel 🚀');

  useEffect(() => {
    // Detect currency automatically
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
            setCurrency('NGN');
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
        setCurrency('NGN');
      }
    }
    detectCurrency();

    // Theme initialization
    const savedTheme = localStorage.getItem('bztel-theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const handleThemeToggle = () => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (current === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('bztel-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('bztel-theme', 'light');
    }
  };

  const currencyConfig = {
    USD: { symbol: '$', rate: 1.0, decimals: 3, decimalsLarge: 0 },
    GHS: { symbol: 'GH₵', rate: 15.0, decimals: 2, decimalsLarge: 0 },
    NGN: { symbol: '₦', rate: 1500.0, decimals: 1, decimalsLarge: 0 }
  };

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

  // Interactive Sandbox Code Block mapping
  const getCodeSnippet = () => {
    const snippets = {
      curl: `curl -X POST https://api.bztel.com/v1/sms/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "${phone}",
    "message": "${smsMsg}",
    "sender_id": "BZTel",
    "type": "text"
  }'`,
      python: `import requests
import json

url = "https://api.bztel.com/v1/sms/send"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "to": "${phone}",
    "message": "${smsMsg}",
    "sender_id": "BZTel",
    "type": "text"
}

response = requests.post(url, headers=headers, data=json.dumps(payload))
print(response.json())`,
      php: `<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.bztel.com/v1/sms/send",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => json_encode([
    "to" => "${phone}",
    "message" => "${smsMsg}",
    "sender_id" => "BZTel"
  ]),
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer YOUR_API_KEY",
    "Content-Type: application/json"
  ],
]);
$response = curl_exec($curl);
curl_close($curl);
echo $response;`,
      node: `import fetch from 'node-fetch';

const response = await fetch('https://api.bztel.com/v1/sms/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '${phone}',
    message: '${smsMsg}',
    sender_id: 'BZTel'
  })
});

const data = await response.json();
console.log(data);`,
      go: `package main

import (
	"bytes"
	"net/http"
)

func main() {
	jsonData := []byte(\`{"to": "${phone}", "message": "${smsMsg}"}\`)
	req, _ := http.NewRequest("POST", "https://api.bztel.com/v1/sms/send", bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{}
	client.Do(req)
}`
    };
    return snippets[activeLang];
  };

  const handleSandboxSend = () => {
    setSendingTest(true);
    setTimeout(() => {
      setPushText(smsMsg || 'Hello from BzTel 🚀');
      setShowPushAlert(true);
      setSendingTest(false);
      setSentTest(true);
      
      // Auto-hide mock iOS push notification alert
      setTimeout(() => {
        setShowPushAlert(false);
        setSentTest(false);
      }, 5000);
    }, 1500);
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
          <li><a href="/" className="nav-link-l active">Home</a></li>
          <li><a href="/bulk-sms" className="nav-link-l">Bulk SMS</a></li>
          <li><a href="/software-development" className="nav-link-l">Software Development</a></li>
          <li><a href="/pricing" className="nav-link-l">Pricing</a></li>
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
          
          <button id="theme-toggle" className="theme-toggle-l" title="Toggle Light/Dark Theme" style={{ marginRight: '12px', outline: 'none' }} onClick={handleThemeToggle}>
            <svg id="theme-toggle-moon" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style={{ width: '20px', height: '20px' }}>
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <a href="/app" className="nav-login-btn">Log in</a>
          <a href="/app" className="btn-l btn-l-primary" style={{ borderRadius: 'var(--border-radius-sm)', padding: '8px 18px' }}>Sign Up</a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-l" style={{ display: 'flex' }}>
        <div className="hero-content-l reveal reveal-left reveal-active">
          <h1 className="hero-title-l">Communication APIs & <span>Custom Software</span> Built for Your Growth</h1>
          <p className="hero-subtitle-l">BZTel provides powerful communication APIs and custom software development services to help businesses connect, automate and scale globally.</p>
          
          <div className="hero-btns-l">
            <a href="/app" className="btn-l btn-l-primary" style={{ padding: '12px 28px' }}>Get Started Free</a>
            <a href="#products" className="btn-l btn-l-secondary" style={{ padding: '12px 28px' }}>View API Docs &lt;/&gt;</a>
          </div>

          <div className="hero-benefits-l">
            <div className="benefit-item-l">
              <div className="benefit-icon-box">
                <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
              </div>
              <div>
                <strong>Easy Integration</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>REST API & SDKs</span>
              </div>
            </div>
            <div className="benefit-item-l">
              <div className="benefit-icon-box">
                <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div>
                <strong>99.9% Uptime</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Reliable & Scalable</span>
              </div>
            </div>
            <div className="benefit-item-l">
              <div className="benefit-icon-box">
                <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h18"/></svg>
              </div>
              <div>
                <strong>Global Coverage</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>200+ Countries</span>
              </div>
            </div>
          </div>
        </div>

        {/* Code Block Sandbox */}
        <div className="code-editor-l reveal reveal-right reveal-active" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="editor-header-l">
            <ul className="editor-tabs-l" id="hero-tabs">
              <li className={`editor-tab-l ${activeLang === 'curl' ? 'active' : ''}`} onClick={() => setActiveLang('curl')}>cURL</li>
              <li className={`editor-tab-l ${activeLang === 'python' ? 'active' : ''}`} onClick={() => setActiveLang('python')}>Python</li>
              <li className={`editor-tab-l ${activeLang === 'php' ? 'active' : ''}`} onClick={() => setActiveLang('php')}>PHP</li>
              <li className={`editor-tab-l ${activeLang === 'node' ? 'active' : ''}`} onClick={() => setActiveLang('node')}>Node.js</li>
              <li className={`editor-tab-l ${activeLang === 'go' ? 'active' : ''}`} onClick={() => setActiveLang('go')}>Go</li>
            </ul>
          </div>
          <div className="editor-body-l" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '290px' }}>
            <pre id="hero-code-block" style={{ flex: 1, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {getCodeSnippet()}
            </pre>
            
            {/* Interactive Sandbox Controls */}
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--code-border)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Recipient Phone" 
                  value={phone} 
                  style={{ padding: '6px 10px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--code-border)', borderRadius: '4px', color: '#fff', fontFamily: 'monospace', outline: 'none', width: '100%' }}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div style={{ flex: 2 }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="SMS Message" 
                  value={smsMsg} 
                  style={{ padding: '6px 10px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--code-border)', borderRadius: '4px', color: '#fff', fontFamily: 'monospace', outline: 'none', width: '100%' }}
                  onChange={(e) => setSmsMsg(e.target.value)}
                />
              </div>
              <button 
                className="btn-l btn-l-primary" 
                style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '4px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', height: '32px' }}
                onClick={handleSandboxSend}
                disabled={sendingTest || sentTest}
              >
                {sendingTest ? 'Sending...' : sentTest ? 'Sent!' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="trusted-by-sect">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h3 className="trusted-title">TRUSTED BY LEADING TEAMS WORLDWIDE</h3>
          <div className="trusted-logos">
            {/* AeroLogix Logo */}
            <svg className="trusted-logo-svg" viewBox="0 0 120 30" width="100" height="24">
              <text x="10" y="20" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="16">AeroLogix</text>
            </svg>
            {/* Vortex Logo */}
            <svg className="trusted-logo-svg" viewBox="0 0 120 30" width="80" height="24">
              <text x="10" y="20" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="16">VORTEX</text>
            </svg>
            {/* ApexCorp Logo */}
            <svg className="trusted-logo-svg" viewBox="0 0 120 30" width="100" height="24">
              <text x="10" y="20" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="16">APEX CORP</text>
            </svg>
            {/* Quantum Logo */}
            <svg className="trusted-logo-svg" viewBox="0 0 120 30" width="90" height="24">
              <text x="10" y="20" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="16">QUANTUM</text>
            </svg>
            {/* Nexus Logo */}
            <svg className="trusted-logo-svg" viewBox="0 0 120 30" width="80" height="24">
              <text x="10" y="20" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="16">NEXUS</text>
            </svg>
          </div>
          
          <div className="dev-testimonial-card reveal reveal-scale reveal-active">
            <p className="testimonial-quote">
              "Integrating BZTel SMS API took us less than 15 minutes. We deliver over 50,000 notifications daily to our customers across Nigeria with sub-second delivery latency. The dynamic failover routing is a complete game-changer."
            </p>
            <div className="testimonial-author">
              — Tunde Balogun, CTO at AeroLogix
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="stats-row-l reveal reveal-scale reveal-active">
        <div className="stat-item-l">
          <div className="stat-item-icon">
            <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2a2.5 2.5 0 002.5-2.5V10a2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div className="stat-item-details-l">
            <span className="stat-item-val">200+</span>
            <span className="stat-item-lbl">Countries Covered</span>
          </div>
        </div>
        <div className="stat-item-l">
          <div className="stat-item-icon">
            <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div className="stat-item-details-l">
            <span className="stat-item-val">99.9%</span>
            <span className="stat-item-lbl">Uptime SLA</span>
          </div>
        </div>
        <div className="stat-item-l">
          <div className="stat-item-icon">
            <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          </div>
          <div className="stat-item-details-l">
            <span className="stat-item-val">10B+</span>
            <span className="stat-item-lbl">Messages Delivered</span>
          </div>
        </div>
      </section>

      {/* Products / Powerful APIs Section */}
      <section className="sect-l" id="products">
        <div className="sect-header-l reveal reveal-active">
          <h2 className="sect-title-l" style={{ fontSize: '2.5rem', textAlign: 'center', color: 'var(--text-dark)' }}>Powerful Communication APIs</h2>
          <p className="sect-subtitle-l" style={{ textAlign: 'center' }}>Everything you need to engage your customers across every channel.</p>
        </div>

        <div className="api-grid-l">
          {/* Card 1 */}
          <div className="api-card-l reveal reveal-scale reveal-active">
            <div className="benefit-icon-box" style={{ marginBottom: '20px' }}>
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            </div>
            <h3 className="api-card-title-l">SMS API</h3>
            <p className="api-card-desc-l">Send transactional, promotional and bulk SMS worldwide.</p>
            <a href="/app" className="api-card-link-l">Learn more &rarr;</a>
          </div>

          {/* Card 2 */}
          <div className="api-card-l reveal reveal-scale reveal-active">
            <div className="benefit-icon-box" style={{ marginBottom: '20px' }}>
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.9 1.9 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 012 2z"/></svg>
            </div>
            <h3 className="api-card-title-l">WhatsApp API</h3>
            <p className="api-card-desc-l">Official WhatsApp Business API for notifications, alerts & chat.</p>
            <a href="/app" className="api-card-link-l">Learn more &rarr;</a>
          </div>

          {/* Card 3 */}
          <div className="api-card-l reveal reveal-scale reveal-active">
            <div className="benefit-icon-box" style={{ marginBottom: '20px' }}>
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 className="api-card-title-l">OTP & Verification</h3>
            <p className="api-card-desc-l">Fast and reliable OTP for logins, signups and secure verifications.</p>
            <a href="/app" className="api-card-link-l">Learn more &rarr;</a>
          </div>
        </div>
      </section>

      {/* Dashboard & Features Grid Section */}
      <section className="sect-l sect-l-offset" style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="features-split-grid">
          {/* Left: Features Bullet List */}
          <div className="reveal reveal-left reveal-active">
            <span className="hero-tag-l" style={{ marginBottom: '12px', display: 'inline-block' }}>BZTEL CAPABILITIES</span>
            <h2 className="hero-title-l" style={{ fontSize: '2.2rem', color: 'var(--text-dark)', marginBottom: '24px', lineHeight: 1.2 }}>
              Manage campaigns from a sleek, intuitive console
            </h2>
            <div className="feature-bullets-list">
              <div className="feature-bullet-item">
                <div className="feature-bullet-icon-box">
                  <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="feature-bullet-content">
                  <h4>Automated Birthday Campaigns</h4>
                  <p>Upload a group of contacts and let our scheduler automatically dispatch personalized greetings on their special day.</p>
                </div>
              </div>
              <div className="feature-bullet-item">
                <div className="feature-bullet-icon-box">
                  <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20H7m0 0v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="feature-bullet-content">
                  <h4>Smart Contact Groups</h4>
                  <p>Organize customers, VIPs, and employees. Store dynamic field data like custom names to personalize bulk SMS templates.</p>
                </div>
              </div>
              <div className="feature-bullet-item">
                <div className="feature-bullet-icon-box">
                  <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="feature-bullet-content">
                  <h4>Detailed Delivery Metrics</h4>
                  <p>Track delivery counts, fail logs, latency status, and outgoing credit costs directly in your console dashboard.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: CSS Mockup Dashboard Panel */}
          <div className="reveal reveal-right reveal-active">
            <div className="mock-dashboard-wrapper">
              <div className="mock-dashboard-header">
                <div className="mock-header-user">
                  <div className="mock-user-avatar">AD</div>
                  <div className="mock-user-name">Aliko Dangote</div>
                </div>
                <div className="mock-header-balance">
                  ₦245,500.00
                </div>
              </div>

              <div className="mock-dashboard-metric-row">
                <div className="mock-metric-card">
                  <span className="mock-metric-lbl">Total Dispatched</span>
                  <div className="mock-metric-val">148,250</div>
                </div>
                <div className="mock-metric-card">
                  <span className="mock-metric-lbl">Delivery Rate</span>
                  <div className="mock-metric-val" style={{ color: '#10b981' }}>99.82%</div>
                </div>
              </div>

              <div className="mock-logs-box">
                <div className="mock-logs-title">Recent SMS Campaigns</div>
                <div className="mock-log-item">
                  <div>
                    <strong>VIP Promo Broadcast</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '2px' }}>To 12,400 recipients</div>
                  </div>
                  <span className="mock-badge success">Delivered</span>
                </div>
                <div className="mock-log-item">
                  <div>
                    <strong>June OTP Verification</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '2px' }}>Recipient: +234805551234</div>
                  </div>
                  <span className="mock-badge success">Delivered</span>
                </div>
                <div className="mock-log-item">
                  <div>
                    <strong>Birthday Automation</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '2px' }}>Sender ID: BZTel</div>
                  </div>
                  <span className="mock-badge pending">Queued</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="sect-l" id="faqs" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="sect-header-l reveal reveal-active">
          <span className="hero-tag-l" style={{ display: 'block', textAlign: 'center', marginBottom: '8px' }}>QUESTIONS & ANSWERS</span>
          <h2 className="sect-title-l" style={{ textAlign: 'center' }}>Frequently Asked Questions</h2>
          <p className="sect-subtitle-l" style={{ textAlign: 'center' }}>Everything you need to know about our communication platform.</p>
        </div>

        <div className="faq-accordion-wrapper">
          {/* FAQ Item 1 */}
          <div className={`faq-item-card ${activeFaq === 0 ? 'active' : ''}`}>
            <button className="faq-header-btn" onClick={() => setActiveFaq(activeFaq === 0 ? null : 0)}>
              <span className="faq-question-txt">How does BZTel ensure SMS delivery rates?</span>
              <svg className="faq-chevron-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="faq-panel-content">
              <p className="faq-answer-txt">
                We establish direct SS7 pipeline connections to primary telecommunication operators (like MTN, Airtel, Glo) and maintain fallback channels. This bypasses intermediate route brokers, reducing packet drops and ensuring a 99.9% transmission delivery rate.
              </p>
            </div>
          </div>

          {/* FAQ Item 2 */}
          <div className={`faq-item-card ${activeFaq === 1 ? 'active' : ''}`}>
            <button className="faq-header-btn" onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}>
              <span className="faq-question-txt">Which local currencies are supported for billing?</span>
              <svg className="faq-chevron-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="faq-panel-content">
              <p className="faq-answer-txt">
                BZTel fully supports local billing in US Dollar ($), Ghanaian Cedi (GH₵), and Nigerian Naira (₦). Rates are computed dynamically based on the active currency selector, and regional gateways allow instant wallet top-ups.
              </p>
            </div>
          </div>

          {/* FAQ Item 3 */}
          <div className={`faq-item-card ${activeFaq === 2 ? 'active' : ''}`}>
            <button className="faq-header-btn" onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}>
              <span className="faq-question-txt">How do Birthday Campaigns automatically work?</span>
              <svg className="faq-chevron-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="faq-panel-content">
              <p className="faq-answer-txt">
                When you create a Birthday Campaign in the dashboard, our daemon scheduler monitors your designated contact group daily. It automatically extracts birthdays, formats the template with personalized merge tags, and dispatches the SMS at the configured hour.
              </p>
            </div>
          </div>

          {/* FAQ Item 4 */}
          <div className={`faq-item-card ${activeFaq === 3 ? 'active' : ''}`}>
            <button className="faq-header-btn" onClick={() => setActiveFaq(activeFaq === 3 ? null : 3)}>
              <span className="faq-question-txt">Are there any limits on how many messages I can send?</span>
              <svg className="faq-chevron-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="faq-panel-content">
              <p className="faq-answer-txt">
                No. BZTel's queue architecture handles both low-volume individual transactional OTP messages and large bulk notification broadcasts with ease. Our infrastructure auto-scales delivery throughput based on account tier settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bold Bottom CTA Banner */}
      <section className="cta-banner-container reveal reveal-scale reveal-active">
        <div className="cta-gradient-card">
          <h2 className="cta-card-title">Connect and scale your communications today</h2>
          <p className="cta-card-subtitle">
            Create a free account in less than 2 minutes. Get free trial credits to test our APIs, no credit card required.
          </p>
          <a href="/app" className="cta-card-btn">
            Create Free Account &rarr;
          </a>
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

      {/* Script for Scroll animations and live chat widget */}
      <Script src="/js/landing-animations.js" strategy="afterInteractive" />

      {/* iOS Sandbox Push SMS Alert Toast (Interactive visual feed) */}
      {showPushAlert && (
        <div id="sandbox-sms-push" style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', width: '340px', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', color: 'white', justifyContent: 'center' }}>
            <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.85rem', color: '#fff' }}>MESSAGES (BZTel)</strong>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>now</span>
            </div>
            <div id="sandbox-push-text" style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{pushText}</div>
          </div>
        </div>
      )}
    </>
  );
}
