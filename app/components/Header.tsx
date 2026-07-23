'use client';

import { useState } from 'react';

interface HeaderProps {
  activePage?: 'home' | 'bulk-sms' | 'software' | 'pricing' | 'contact' | 'email-blast' | 'whatsapp' | 'voice';
}

export default function Header({ activePage }: HeaderProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
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
                <a href="https://wa.me/23058609686" target="_blank" rel="noopener noreferrer" className="top-bar-value-l">
                  +230 5860 9686<span className="hide-mobile-text-l"> (WhatsApp Only)</span>
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
                <a href="mailto:clientservice@bztel.net" className="top-bar-value-l">
                  clientservice@bztel.net
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <header className={`navbar-l ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="logo-l" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
          <svg className="logo-l-icon" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="logo-l-text">BZTel</span>
        </div>

        <button 
          className="nav-toggle-btn-l" 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle Menu"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            {isMobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <ul className="nav-menu-l">
          <li><a href="/" className={`nav-link-l ${activePage === 'home' ? 'active' : ''}`}>Home</a></li>
          <li><a href="/bulk-sms" className={`nav-link-l ${activePage === 'bulk-sms' ? 'active' : ''}`}>Bulk SMS</a></li>
          <li><a href="/software-development" className={`nav-link-l ${activePage === 'software' ? 'active' : ''}`}>Software Development</a></li>
          <li><a href="/pricing" className={`nav-link-l ${activePage === 'pricing' ? 'active' : ''}`}>Pricing</a></li>
          <li><a href="/contact" className={`nav-link-l ${activePage === 'contact' ? 'active' : ''}`}>Contact Us</a></li>
        </ul>

        <div className="nav-actions-l">
          <a href="/app" className="nav-login-btn">Log in</a>
          <a href="/app" className="btn-l btn-l-primary" style={{ borderRadius: 'var(--border-radius-sm)', padding: '8px 18px' }}>Sign Up</a>
        </div>
      </header>
    </>
  );
}
