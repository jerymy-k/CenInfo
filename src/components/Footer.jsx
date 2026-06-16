export default function Footer() {
  return (
    <footer className="simple-footer">
      <div className="simple-footer-inner">
        <div className="simple-footer-brand">
          <span className="simple-footer-logo">CenInfo</span>
          <p>
            Cinema web app for discovering movies, series, trailers, and favorites.
          </p>
        </div>

        <div className="simple-footer-contact" aria-label="Contact links">
          <a href="mailto:karimimoha0@gmail.com">Email</a>
          <a href="https://github.com/jerymy-k" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/mohamed-elkerymy/" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
      </div>

      <div className="simple-footer-bottom">
        <p>© 2026 CenInfo. All rights reserved.</p>
        <p>Created by ELKERYMY Mohamed.</p>
      </div>
    </footer>
  );
}
