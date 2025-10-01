import './About.scss';

const About = () => {
  return (
    <div className="about">
      <div className="container">
        <section className="about-hero">
          <h1>About Laura</h1>
          <p className="lead text-secondary">
            Your AI companion in the cosmic dream universe
          </p>
        </section>

        <section className="about-content py-lg">
          <div className="grid grid-2">
            <div className="card">
              <h2>🌌 Our Vision</h2>
              <p className="text-secondary">
                Laura represents the fusion of artificial intelligence and cosmic inspiration. 
                We believe in creating beautiful, functional experiences that inspire creativity 
                and innovation.
              </p>
              <p className="text-secondary">
                Our cosmic dream theme reflects the infinite possibilities of technology and 
                the beauty of the universe we explore together.
              </p>
            </div>

            <div className="card">
              <h2>💫 Our Mission</h2>
              <p className="text-secondary">
                To provide a professional, elegant platform that showcases the power of modern 
                web technologies combined with stunning design aesthetics.
              </p>
              <p className="text-secondary">
                We strive to create experiences that are both visually captivating and 
                technically excellent.
              </p>
            </div>
          </div>
        </section>

        <section className="tech-stack py-lg">
          <h2 className="text-center mb-lg">Built With Modern Tech</h2>
          <div className="grid grid-3">
            <div className="card text-center">
              <div className="tech-icon">⚛️</div>
              <h3>React 18</h3>
              <p className="text-secondary">
                Modern React with hooks and functional components
              </p>
            </div>
            <div className="card text-center">
              <div className="tech-icon">🎨</div>
              <h3>SCSS</h3>
              <p className="text-secondary">
                Powerful styling with scss-cosmic-dream theme
              </p>
            </div>
            <div className="card text-center">
              <div className="tech-icon">⚡</div>
              <h3>Vite</h3>
              <p className="text-secondary">
                Lightning-fast build tool and dev server
              </p>
            </div>
            <div className="card text-center">
              <div className="tech-icon">🛣️</div>
              <h3>React Router</h3>
              <p className="text-secondary">
                Smooth client-side navigation
              </p>
            </div>
            <div className="card text-center">
              <div className="tech-icon">📘</div>
              <h3>TypeScript</h3>
              <p className="text-secondary">
                Type-safe code for better development
              </p>
            </div>
            <div className="card text-center">
              <div className="tech-icon">🎯</div>
              <h3>Modern CSS</h3>
              <p className="text-secondary">
                Flexbox, Grid, and animations
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
