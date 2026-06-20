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
              <a href="mailto:admin@bztel.net" style={{ color: 'var(--accent-purple)', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px', display: 'inline-block' }}>admin@bztel.net</a>
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
