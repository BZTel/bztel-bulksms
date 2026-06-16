'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(data.message || 'Thank you! Your message has been sent successfully.');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setErrorMsg(data.error || 'Failed to submit message. Please try again.');
      }
    } catch (err) {
      console.error('Contact form submission error:', err);
      setErrorMsg('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
          <li><a href="/contact" className="nav-link-l active">Contact Us</a></li>
        </ul>

        <div className="nav-actions-l">
          <a href="/app" className="nav-login-btn">Log in</a>
          <a href="/app" className="btn-l btn-l-primary" style={{ borderRadius: 'var(--border-radius-sm)', padding: '8px 18px' }}>Sign Up</a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-l" style={{ paddingTop: '150px', background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), var(--bg-light)', display: 'block' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }} className="reveal reveal-scale reveal-active">
          <span className="hero-tag-l">GET IN TOUCH</span>
          <h1 className="hero-title-l" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '20px', lineHeight: 1.1 }}>Let&apos;s Start a Conversation</h1>
          <p className="hero-subtitle-l" style={{ fontSize: '1.15rem', color: 'var(--text-slate)', maxWidth: '700px', margin: '0 auto 36px', lineHeight: 1.6 }}>Have questions about our simulated gateway, credit pricing, or need an enterprise custom software proposal? Our teams are here to help.</p>
        </div>
      </section>

      {/* Contact Us Split Layout */}
      <section className="sect-l sect-l-offset">
        <div className="software-l" style={{ maxWidth: '1100px', display: 'flex', gap: '40px' }}>
          {/* Left: Contact Form */}
          <div className="contact-container reveal reveal-left reveal-active" style={{ background: '#ffffff', border: '1px solid var(--border-color)', padding: '40px', borderRadius: 'var(--border-radius-lg)', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '24px' }}>Send us a message</h3>
            
            {successMsg ? (
              <div style={{ color: 'var(--success-color)', fontWeight: 700, textAlign: 'center', fontSize: '0.95rem', padding: '20px 0' }}>
                ✓ {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="John Doe" 
                    style={{ background: 'var(--bg-offset)' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    required 
                    placeholder="john@company.com" 
                    style={{ background: 'var(--bg-offset)' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="API Pricing inquiry" 
                    style={{ background: 'var(--bg-offset)' }}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea 
                    className="form-control" 
                    required 
                    placeholder="Type your message details..." 
                    style={{ background: 'var(--bg-offset)', minHeight: '100px' }}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  ></textarea>
                </div>
                {errorMsg && (
                  <div style={{ color: 'var(--danger-color)', fontWeight: 600, fontSize: '0.85rem', marginTop: '10px' }}>
                    ⚠ {errorMsg}
                  </div>
                )}
                <button 
                  type="submit" 
                  className="btn-l btn-l-primary btn-block" 
                  style={{ border: 'none', padding: '12px', marginTop: '20px', cursor: 'pointer' }}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Right: Office Info & Hours */}
          <div className="software-content-l reveal reveal-right reveal-active" style={{ paddingLeft: '20px', gap: '24px', display: 'flex', flexDirection: 'column' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '12px' }}>Office Locations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderLeft: '2px solid var(--accent-purple)', paddingLeft: '12px' }}>
                  <strong style={{ color: 'var(--text-dark)', fontSize: '0.9rem', display: 'block' }}>San Francisco (Headquarters)</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>100 Pine Street, San Francisco, CA 94111, USA</span>
                </div>
                <div style={{ borderLeft: '2px solid var(--accent-purple)', paddingLeft: '12px' }}>
                  <strong style={{ color: 'var(--text-dark)', fontSize: '0.9rem', display: 'block' }}>London Office</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>25 Ropemaker Street, London, EC2Y 9LY, UK</span>
                </div>
                <div style={{ borderLeft: '2px solid var(--accent-purple)', paddingLeft: '12px' }}>
                  <strong style={{ color: 'var(--text-dark)', fontSize: '0.9rem', display: 'block' }}>Lagos Office</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>15 Kingsway Road, Ikoyi, Lagos, Nigeria</span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '12px' }}>Helpdesk & Support</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-slate)', lineHeight: 1.5 }}>For general issues and developer questions, email our dispatch desk:</p>
              <a href="mailto:support@bztel.com" style={{ color: 'var(--accent-purple)', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px', display: 'inline-block' }}>support@bztel.com</a>
            </div>

            <div>
              <strong style={{ color: 'var(--text-dark)', fontSize: '0.9rem', display: 'block' }}>Business Hours</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Monday - Friday, 9:00 AM - 6:00 PM (GMT)</span>
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
