export default function Footer() {
  return (
    <footer className="footer-l">
      <div className="footer-grid-l">
        <div className="footer-logo-box-l">
          <div className="logo-l" style={{ color: '#ffffff' }}>
            <img src="/bztel-logo.png" alt="BZTel Logo" className="logo-l-icon" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
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
          <a href="/terms">Terms of Service</a>
          <a href="/terms">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
