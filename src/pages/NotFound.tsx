import { Link } from 'react-router-dom';
import './NotFound.scss';

const NotFound = () => {
  return (
    <div className="not-found">
      <div className="container">
        <div className="card text-center">
          <h1>404 - Lost in the cosmos</h1>
          <p className="text-secondary">
            We couldn&apos;t find that page. Let&apos;s get you back on track.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">
              Return home
            </Link>
            <Link to="/contact" className="btn btn-secondary">
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
