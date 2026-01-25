import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.scss';

const Navigation = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/chat', label: 'Chat' },
    { to: '/dashboard', label: 'Dashboard' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="navigation">
      <div className="container">
        <div className="nav-shell">
          <div className="nav-left">
            <Link to="/" className="nav-brand gradient-text" onClick={closeMenu}>
              Laura
            </Link>
          </div>
          <nav className="nav-center" aria-label="Primary">
            <ul className="nav-links">
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={isActive(item.to) ? 'active' : ''}
                    aria-current={isActive(item.to) ? 'page' : undefined}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="nav-right">
            <div className="nav-utility">
              <button type="button" className="nav-action-btn">
                Theme
              </button>
              <button type="button" className="nav-action-btn">
                EN
              </button>
              <button type="button" className="nav-action-btn nav-logout">
                Logout
              </button>
            </div>
            <button
              type="button"
              className="nav-toggle"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              Menu
            </button>
          </div>
        </div>
      </div>
      <div className={`nav-mobile ${isMenuOpen ? 'is-open' : ''}`}>
        <div className="container">
          <ul className="nav-mobile-links">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={isActive(item.to) ? 'active' : ''}
                  aria-current={isActive(item.to) ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
