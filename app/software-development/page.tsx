'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

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
      <Header activePage="software" />

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
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                  * Please provide only high-level information necessary to assess your project. Do not share sensitive details, credentials, or private keys.
                </span>
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

      <Footer />
    </>
  );
}
