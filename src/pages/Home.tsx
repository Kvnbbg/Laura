import { Link } from 'react-router-dom';
import './Home.scss';

const Home = () => {
  return (
    <div className="home">
      <div className="container">
        <section className="hero">
          <h1 className="hero-title float">Welcome to Laura</h1>
          <p className="hero-subtitle">
            AI Float Cosmic Dream - Your Professional Cosmic Companion
          </p>
          <div className="hero-actions">
            <Link to="/about" className="btn btn-primary">
              Learn More
            </Link>
            <Link to="/contact" className="btn btn-secondary">
              Get in Touch
            </Link>
          </div>
        </section>

        <section className="features py-xl">
          <h2 className="text-center mb-lg">Cosmic Features</h2>
          <div className="grid grid-3">
            <div className="card">
              <div className="feature-icon cosmic-glow">🌟</div>
              <h3>Cosmic Design</h3>
              <p className="text-secondary">
                Experience stunning cosmic-inspired design with smooth gradients
                and animations.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon cosmic-glow">⚡</div>
              <h3>Lightning Fast</h3>
              <p className="text-secondary">
                Built with React and Vite for blazing-fast performance and
                instant hot reload.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon cosmic-glow">🎨</div>
              <h3>SCSS Powered</h3>
              <p className="text-secondary">
                Fully styled with scss-cosmic-dream for maintainable and
                beautiful styles.
              </p>
            </div>
          </div>
        </section>

        <section className="cta py-xl">
          <div className="card cta-card text-center">
            <h2>Ready to Start Your Journey?</h2>
            <p className="text-secondary mb-lg">
              Explore the cosmic dream with Laura and discover endless
              possibilities.
            </p>
            <Link to="/contact" className="btn btn-primary">
              Start Now
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
