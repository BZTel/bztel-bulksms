'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {/* Main Container */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px 100px 24px' }}>
        {/* Header Title Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
            Legal Documentation
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.025em', background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '12px' }}>
            Terms & Conditions
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            Last Updated: August 3, 2026. Please read these terms carefully before using BZTel services.
          </p>
        </div>

        {/* Content Box */}
        <div style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '40px', lineHeight: '1.7', color: '#cbd5e1' }}>
          
          {/* Section 1 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', fontSize: '0.85rem', fontWeight: 700 }}>1</span>
              Acceptance of Terms
            </h2>
            <p>
              By accessing, registering, or utilizing the messaging, API, voice, or custom software services provided by <strong>BZTel LTD</strong> ("BZTel", "we", "us", or "our"), you ("User", "Client", or "Account Holder") agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must discontinue use of our platform immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', fontSize: '0.85rem', fontWeight: 700 }}>2</span>
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
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', fontSize: '0.85rem', fontWeight: 700 }}>3</span>
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
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', fontSize: '0.85rem', fontWeight: 700 }}>4</span>
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
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', fontSize: '0.85rem', fontWeight: 700 }}>5</span>
              Sender IDs & Verification
            </h2>
            <p>
              Custom Sender IDs must be submitted for administrative review and approval prior to broadcast usage. Registered Sender IDs must accurately reflect your registered business entity or legal brand name. Fraudulent or impersonating Sender IDs will be rejected.
            </p>
          </section>

          {/* Section 6 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', fontSize: '0.85rem', fontWeight: 700 }}>6</span>
              Limitation of Liability
            </h2>
            <p>
              BZTel will not be liable for any indirect, incidental, consequential, or punitive damages arising from gateway delays caused by telecommunication carriers, network congestion, or client configuration errors. Our total aggregate liability shall not exceed the total amount paid by you for credits in the preceding 30 days.
            </p>
          </section>

          {/* Section 7 */}
          <section style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', fontSize: '0.85rem', fontWeight: 700 }}>7</span>
              Contact Information
            </h2>
            <p style={{ marginBottom: '8px' }}>
              If you have questions, concerns, or legal inquiries regarding these Terms & Conditions, please contact us:
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '16px', fontSize: '0.9rem' }}>
              <p style={{ margin: '0 0 4px 0' }}><strong>BZTel LTD</strong></p>
              <p style={{ margin: '0 0 4px 0', color: '#94a3b8' }}>Email: <a href="mailto:clientservice@bztel.net" style={{ color: '#818cf8', textDecoration: 'none' }}>clientservice@bztel.net</a></p>
              <p style={{ margin: '0', color: '#94a3b8' }}>WhatsApp: <a href="https://wa.me/2348149346429" target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'none' }}>+234 814 934 6429</a></p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
