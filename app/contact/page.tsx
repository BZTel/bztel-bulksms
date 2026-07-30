'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

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
      <Header activePage="contact" />

      {/* Hero Section */}
      <section className="hero-l" style={{ paddingTop: '150px', background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), var(--bg-light)', display: 'block' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }} className="reveal reveal-scale reveal-active">
          <span className="hero-tag-l">GET IN TOUCH</span>
          <h1 className="hero-title-l" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '20px', lineHeight: 1.1 }}>Let&apos;s Start a Conversation</h1>
          <p className="hero-subtitle-l" style={{ fontSize: '1.15rem', color: 'var(--text-slate)', maxWidth: '700px', margin: '0 auto 36px', lineHeight: 1.6 }}>
            Have questions about our gateway, credit pricing, or custom software proposals? We&apos;re just one message away — reach us directly on WhatsApp or drop us a message below.
          </p>
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
            {/* WhatsApp Contact Card */}
            <div style={{ background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '24px', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg style={{ width: '24px', height: '24px', color: '#16a34a' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.004 2C6.51 2 2.014 6.5 2.014 12c0 2.14.67 4.125 1.82 5.766L2 22l4.392-1.156c1.63.882 3.486 1.383 5.612 1.383 5.493 0 9.99-4.5 9.99-10S17.496 2 12.004 2zm6.273 14.17c-.26.736-1.503 1.345-2.07 1.41-.5.06-1.15.1-3.32-.76-2.77-1.1-4.56-3.93-4.7-4.12-.14-.19-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.26.26-.26.56-.32.74-.32.19 0 .38 0 .54.01.17.01.4.01.62.53.22.53.76 1.85.83 1.98.07.13.11.29.02.48-.09.19-.19.31-.37.52-.18.21-.38.48-.54.65-.18.19-.37.39-.16.74.21.35.94 1.55 2.01 2.5 1.39 1.23 2.56 1.62 2.92 1.8.36.18.57.15.79-.1.21-.24.93-1.08 1.18-1.45.25-.37.5-.31.84-.19.34.12 2.16 1.02 2.53 1.2.37.19.62.28.71.43.09.16.09.91-.17 1.65z"/>
                </svg>
                <strong style={{ color: 'var(--text-dark)', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>WhatsApp Direct Support</strong>
              </div>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-slate)', margin: 0, fontWeight: 500 }}>We are just one message away!</p>
              <a href="https://wa.me/2348149346429" target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', fontWeight: 800, fontSize: '1.15rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                +234 814 934 6429 <span style={{ transition: 'transform 0.2s' }}>→</span>
              </a>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Available Mon - Sun (24/7 Instant Response)</span>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '12px' }}>Helpdesk & Support</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-slate)', lineHeight: 1.5 }}>For general issues and developer questions, email our dispatch desk:</p>
              <a href="mailto:clientservice@bztel.net" style={{ color: 'var(--accent-purple)', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px', display: 'inline-block' }}>clientservice@bztel.net</a>
            </div>

            <div>
              <strong style={{ color: 'var(--text-dark)', fontSize: '0.9rem', display: 'block' }}>Business Hours</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Monday - Friday, 9:00 AM - 6:00 PM (GMT)</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
