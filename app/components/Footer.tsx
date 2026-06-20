export default function Footer() {
  return (
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
  );
}
