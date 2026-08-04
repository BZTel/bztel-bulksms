'use client';

import Footer from '../components/Footer';

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Clean Minimalist Legal Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/bztel-logo.png" alt="BZTel Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.3rem', color: '#0f172a', letterSpacing: '-0.02em' }}>BZTel</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}>
            &larr; Back to Website
          </a>
          <a href="/app" style={{ textDecoration: 'none', background: '#4f46e5', color: '#ffffff', padding: '8px 18px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
            Sign In
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px 100px 24px' }}>
        {/* Header Title Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4f46e5', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
            Legal Documentation
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '12px' }}>
            Terms & Conditions
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            Last Updated: August 3, 2026. Please read these terms carefully before using BZTel services.
          </p>
        </div>

        {/* Content Box */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px', lineHeight: '1.7', color: '#334155', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.06), 0 10px 15px -5px rgba(0, 0, 0, 0.04)' }}>
          
          {/* Section 1 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', fontSize: '0.85rem', fontWeight: 700 }}>1</span>
              Acceptance of Terms
            </h2>
            <p>
              By accessing, registering, or utilizing the messaging, API, voice, or custom software services provided by <strong>BZTel LTD</strong> ("BZTel", "we", "us", or "our"), you ("User", "Client", or "Account Holder") agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must discontinue use of our platform immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', fontSize: '0.85rem', fontWeight: 700 }}>2</span>
              Account Registration & Security
            </h2>
            <p style={{ marginBottom: '10px' }}>
              To access BZTel features, you must create an account by providing accurate, current, and complete information, including your full legal name, valid email address, and consent to these terms.
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>You are responsible for maintaining the confidentiality of your login credentials and API keys.</li>
              <li>Any activity conducted under your account or API credentials will be deemed your sole legal responsibility.</li>
              <li>You agree to notify BZTel immediately at <strong>clientservice@bztel.net</strong> upon suspecting unauthorized access or security breaches.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', fontSize: '0.85rem', fontWeight: 700 }}>3</span>
              Acceptable Use & Anti-Spam Safeguards
            </h2>
            <p style={{ marginBottom: '10px' }}>
              BZTel maintains a strict <strong>Zero-Tolerance Policy</strong> against unsolicited bulk messaging (spam), fraudulent activities, and phishing attempts.
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Recipient Consent:</strong> You must obtain explicit opt-in consent from recipients before sending promotional SMS, WhatsApp, or voice broadcasts.</li>
              <li><strong>Prohibited Content:</strong> Messages containing deceptive bank impersonation, BVN requests, gambling, adult content, fraudulent giveaways, or illegal material are strictly forbidden.</li>
              <li><strong>Automated Filtering:</strong> BZTel employs real-time keyword filtering algorithms. Accounts attempting to transmit flagged anti-phishing terms will face immediate suspension and credit forfeiture.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', fontSize: '0.85rem', fontWeight: 700 }}>4</span>
              Credits, Pricing & Billing
            </h2>
            <p style={{ marginBottom: '10px' }}>
              Services operate on a prepaid credit model. Credits are purchased online via integrated payment channels or verified manual bank transfers.
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Credits deducted for delivered or submitted messages are non-refundable unless a systemic gateway failure occurs on our end.</li>
              <li>Unused promotional or welcome bonus credits carry no monetary cash-out value.</li>
              <li>BZTel reserves the right to modify messaging rates based on mobile network operator tariff changes.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', fontSize: '0.85rem', fontWeight: 700 }}>5</span>
              Sender IDs & Verification
            </h2>
            <p>
              Custom Sender IDs must be submitted for administrative review and approval prior to broadcast usage. Registered Sender IDs must accurately reflect your registered business entity or legal brand name. Fraudulent or impersonating Sender IDs will be rejected.
            </p>
          </section>

          {/* Section 6 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', fontSize: '0.85rem', fontWeight: 700 }}>6</span>
              Limitation of Liability
            </h2>
            <p>
              BZTel will not be liable for any indirect, incidental, consequential, or punitive damages arising from gateway delays caused by telecommunication carriers, network congestion, or client configuration errors. Our total aggregate liability shall not exceed the total amount paid by you for credits in the preceding 30 days.
            </p>
          </section>

          {/* Section 7 */}
          <section style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', fontSize: '0.85rem', fontWeight: 700 }}>7</span>
              Contact Information
            </h2>
            <p style={{ marginBottom: '8px' }}>
              If you have questions, concerns, or legal inquiries regarding these Terms & Conditions, please contact us:
            </p>
            <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', fontSize: '0.9rem', color: '#0f172a' }}>
              <p style={{ margin: '0 0 4px 0', color: '#0f172a' }}><strong>BZTel LTD</strong></p>
              <p style={{ margin: '0 0 4px 0', color: '#475569' }}>Email: <a href="mailto:clientservice@bztel.net" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>clientservice@bztel.net</a></p>
              <p style={{ margin: '0', color: '#475569' }}>WhatsApp: <a href="https://wa.me/2348149346429" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>+234 814 934 6429</a></p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}

