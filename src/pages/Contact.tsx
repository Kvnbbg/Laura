import { useState } from 'react';
import './Contact.scss';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    
    // In a real app, you would send the data to a server
    console.log('Form submitted:', formData);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="contact">
      <div className="container">
        <section className="contact-hero">
          <h1>Get in Touch</h1>
          <p className="lead text-secondary">
            Have questions? We'd love to hear from you.
          </p>
        </section>

        <div className="contact-content">
          <div className="grid grid-2">
            <div className="contact-info">
              <div className="card">
                <h2>Contact Information</h2>
                <div className="info-item">
                  <div className="info-icon">📧</div>
                  <div>
                    <h3>Email</h3>
                    <p className="text-secondary">hello@laura-cosmic.com</p>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">💬</div>
                  <div>
                    <h3>Chat</h3>
                    <p className="text-secondary">Available 24/7</p>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">🌍</div>
                  <div>
                    <h3>Location</h3>
                    <p className="text-secondary">Everywhere in the cosmos</p>
                  </div>
                </div>
              </div>

              <div className="card social-links mt-md">
                <h3>Follow Us</h3>
                <div className="social-icons">
                  <a href="#" className="social-icon">🐦</a>
                  <a href="#" className="social-icon">📘</a>
                  <a href="#" className="social-icon">📷</a>
                  <a href="#" className="social-icon">💼</a>
                </div>
              </div>
            </div>

            <div className="contact-form-wrapper">
              <div className="card">
                <h2>Send us a Message</h2>
                {submitted ? (
                  <div className="success-message">
                    <div className="success-icon">✅</div>
                    <h3>Thank you!</h3>
                    <p className="text-secondary">
                      Your message has been sent successfully. We'll get back to you soon!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                      <label htmlFor="name">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="message">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Tell us what's on your mind..."
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full">
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
