import { Link, useLocation } from 'react-router-dom';
import './Navigation.scss';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navigation">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="nav-brand gradient-text">
            Laura
          </Link>
          <ul className="nav-links">
            <li>
              <Link
                to="/"
                className={isActive('/') ? 'active' : ''}
                aria-current={isActive('/') ? 'page' : undefined}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className={isActive('/about') ? 'active' : ''}
                aria-current={isActive('/about') ? 'page' : undefined}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className={isActive('/contact') ? 'active' : ''}
                aria-current={isActive('/contact') ? 'page' : undefined}
              >
                Contact
              </Link>
            </li>
            <li>
              <Link
                to="/chat"
                className={isActive('/chat') ? 'active' : ''}
                aria-current={isActive('/chat') ? 'page' : undefined}
              >
                Chat
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
