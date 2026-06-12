'use client';

import { useState } from 'react';

export default function SoftwareDevelopmentPage() {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [scope, setScope] = useState('Web Application Development');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const subject = `Project Brief: ${companyName} - ${scope}`;
      const message = `Company Name: ${companyName}\nProject Scope: ${scope}\n\nProject Details & Goals:\n${details}`;

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactName,
          email: workEmail,
          subject,
          message
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setErrorMsg(data.error || 'Failed to submit project brief. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting project brief:', err);
      setErrorMsg('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
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
          <li><a href="/" className="nav-link-l">Home</a></li>
          <li><a href="/bulk-sms" className="nav-link-l">Bulk SMS</a></li>
          <li><a href="/software-development" className="nav-link-l active">Software Development</a></li>
          <li><a href="/pricing" className="nav-link-l">Pricing</a></li>
          <li><a href="/contact" className="nav-link-l">Contact Us</a></li>
        </ul>

        <div className="nav-actions-l">
          <a href="/app" className="nav-login-btn">Log in</a>
          <a href="/app" className="btn-l btn-l-primary" style={{ borderRadius: 'var(--border-radius-sm)', padding: '8px 18px' }}>Sign Up</a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-l" style={{ paddingTop: '150px', background: 'radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 50%), var(--bg-light)', display: 'block' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }} className="reveal reveal-scale reveal-active">
          <span className="hero-tag-l">ENGINEERING SERVICES</span>
          <h1 className="hero-title-l" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '20px', lineHeight: 1.1 }}>Custom Software Engineering</h1>
          <p className="hero-subtitle-l" style={{ fontSize: '1.15rem', color: 'var(--text-slate)', maxWidth: '700px', margin: '0 auto 36px', lineHeight: 1.6 }}>Build scalable applications, modern SaaS consoles, and responsive mobile systems tailored exactly to your business logic. We convert complex requirements into robust code bases.</p>
          <a href="#workflow" className="btn-l btn-l-secondary" style={{ padding: '12px 28px', marginRight: '12px' }}>Our Process</a>
          <a href="#consult-form" className="btn-l btn-l-primary" style={{ padding: '12px 28px' }}>Discuss Your Project</a>
        </div>
      </section>

      {/* Services Detail */}
      <section className="sect-l sect-l-offset">
        <div className="sect-header-l reveal reveal-active">
          <h2 className="sect-title-l" style={{ textAlign: 'center' }}>Our Development Expertise</h2>
          <p className="sect-subtitle-l" style={{ textAlign: 'center' }}>We design, build, and deploy production-grade software using modern architectures.</p>
        </div>

        <div className="api-grid-l" style={{ maxWidth: '1100px' }}>
          {/* Service Card 1 */}
          <div className="api-card-l reveal reveal-scale reveal-active">
            <h3 className="api-card-title-l">Web App Development</h3>
            <p className="api-card-desc-l" style={{ fontSize: '0.85rem' }}>Single Page Apps (SPAs) and Progressive Web Apps built with premium frontend architectures, responsive grid layouts, and high-performance caching layers.</p>
          </div>

          {/* Service Card 2 */}
          <div className="api-card-l reveal reveal-scale reveal-active">
            <h3 className="api-card-title-l">Mobile Applications</h3>
            <p className="api-card-desc-l" style={{ fontSize: '0.85rem' }}>Native and cross-platform mobile apps for iOS and Android, focusing on fluid user interfaces, native utility features, and smooth offline performance.</p>
          </div>

          {/* Service Card 3 */}
          <div className="api-card-l reveal reveal-scale reveal-active">
            <h3 className="api-card-title-l">SaaS Product Engineering</h3>
            <p className="api-card-desc-l" style={{ fontSize: '0.85rem' }}>Multi-tenant cloud architectures featuring role access gates, secure subscription billing, real-time activity metrics, and transactional database backups.</p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="sect-l" id="workflow">
        <div className="sect-header-l reveal reveal-active">
          <span className="hero-tag-l">DEVELOPMENT WORKFLOW</span>
          <h2 className="hero-title-l" style={{ color: 'var(--text-dark)', textAlign: 'center' }}>How We Turn Ideas into Code</h2>
        </div>

        <div className="api-grid-l" style={{ maxWidth: '1100px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="reveal reveal-scale reveal-active" style={{ background: 'var(--bg-offset)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: 'var(--border-radius-md)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>01</div>
            <strong style={{ color: 'var(--text-dark)', display: 'block', fontSize: '0.95rem', marginBottom: '8px' }}>Discover & Plan</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, display: 'block' }}>Map functional requirements, database dependencies, and UI flowcharts before writing code.</span>
          </div>
          <div className="reveal reveal-scale reveal-active" style={{ background: 'var(--bg-offset)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: 'var(--border-radius-md)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>02</div>
            <strong style={{ color: 'var(--text-dark)', display: 'block', fontSize: '0.95rem', marginBottom: '8px' }}>Design & Prototype</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, display: 'block' }}>Create high-fidelity visual mockups and interactive wireframes to verify design layouts.</span>
          </div>
          <div className="reveal reveal-scale reveal-active" style={{ background: 'var(--bg-offset)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: 'var(--border-radius-md)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>03</div>
            <strong style={{ color: 'var(--text-dark)', display: 'block', fontSize: '0.95rem', marginBottom: '8px' }}>Build & Refine</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, display: 'block' }}>Write clean, commented, and modular codebase modules backed by comprehensive unit tests.</span>
          </div>
          <div className="reveal reveal-scale reveal-active" style={{ background: 'var(--bg-offset)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: 'var(--border-radius-md)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>04</div>
            <strong style={{ color: 'var(--text-dark)', display: 'block', fontSize: '0.95rem', marginBottom: '8px' }}>Deploy & Scale</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, display: 'block' }}>Ship to cloud hosting networks, configure auto-scaling, and monitor metrics in watch mode.</span>
          </div>
        </div>
      </section>

      {/* Intake Project brief Form */}
      <section className="sect-l sect-l-offset" id="consult-form">
        <div className="sect-header-l reveal reveal-active" style={{ marginBottom: '30px' }}>
          <h2 className="sect-title-l" style={{ textAlign: 'center' }}>Discuss Your Project</h2>
          <p className="sect-subtitle-l" style={{ textAlign: 'center' }}>Tell us about your technical requirements and our engineering team will outline a solution timeline.</p>
        </div>

        <div className="contact-container reveal reveal-scale reveal-active" style={{ background: '#ffffff', border: '1px solid var(--border-color)', padding: '40px', borderRadius: 'var(--border-radius-lg)', maxWidth: '600px', margin: '0 auto', boxShadow: 'var(--shadow-lg)' }}>
          {success ? (
            <div style={{ color: 'var(--success-color)', fontWeight: 700, textAlign: 'center', fontSize: '0.95rem', padding: '20px 0' }}>
              ✓ Brief submitted successfully! Our lead architect will evaluate your requirements and contact you within 24 hours.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Company Inc." 
                  required 
                  style={{ background: 'var(--bg-offset)' }} 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <div className="form-group flex-1" style={{ flex: 1 }}>
                  <label>Contact Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Jane Doe" 
                    required 
                    style={{ background: 'var(--bg-offset)' }} 
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>
                <div className="form-group flex-1" style={{ flex: 1 }}>
                  <label>Work Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="jane@company.com" 
                    required 
                    style={{ background: 'var(--bg-offset)' }} 
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px' }}>Estimated Project Scope</label>
                <select 
                  className="form-control" 
                  style={{ background: 'var(--bg-offset)', padding: '10px 14px', fontSize: '0.9rem', width: '100%' }}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  <option value="Web Application Development">Web Application Development</option>
                  <option value="Mobile Application (iOS/Android)">Mobile Application (iOS/Android)</option>
                  <option value="SaaS Platform Engineering">SaaS Platform Engineering</option>
                  <option value="API System Integration">API System Integration</option>
                  <option value="UI/UX Design & Prototyping">UI/UX Design & Prototyping</option>
                </select>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Project Details & Goals</label>
                <textarea 
                  className="form-control" 
                  placeholder="Provide a brief overview of what you want to build..." 
                  required 
                  style={{ background: 'var(--bg-offset)', minHeight: '100px', width: '100%' }}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                ></textarea>
              </div>
              {errorMsg && (
                <div style={{ color: 'var(--error-color)', fontWeight: 600, fontSize: '0.85rem', marginTop: '10px' }}>
                  ⚠ {errorMsg}
                </div>
              )}
              <button 
                type="submit" 
                className="btn-l btn-l-primary btn-block" 
                style={{ border: 'none', padding: '12px', marginTop: '20px', cursor: 'pointer' }}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Project Brief'}
              </button>
            </form>
          )}
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
