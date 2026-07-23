export default function Footer() {
  return (
    <footer className="footer-l">
      <div className="footer-grid-l">
        <div className="footer-logo-box-l">
          <div className="logo-l" style={{ color: '#ffffff' }}>
            <svg className="logo-l-icon" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
  );
}
