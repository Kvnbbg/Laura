import { useEffect, useMemo, useState } from 'react';
import { getConfig } from '../config/env';
import { submitContactForm } from '../services/contactService';
import { getErrorMessage } from '../utils/errors';
import './Contact.scss';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

const Contact = () => {
  const { contactEndpoint } = getConfig();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmitting = status === 'sending';
  const isSuccess = status === 'success';
  const hasError = status === 'error';

  useEffect(() => {
    if (!isSuccess) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFormData({ name: '', email: '', message: '' });
      setStatus('idle');
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [isSuccess]);

  const connectionStatus = useMemo(() => {
    return contactEndpoint
      ? 'Contact form will send messages to your configured endpoint.'
      : 'Contact form is running in local-only mode. Add VITE_CONTACT_ENDPOINT to enable delivery.';
  }, [contactEndpoint]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage(null);

    try {
      await submitContactForm(formData);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <div className="contact">
      <div className="container">
        <section className="contact-hero">
          <h1>Get in Touch</h1>
          <p className="lead text-secondary">
            Have questions? We&apos;d love to hear from you.
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

              <div className="card info-banner mt-md">
                <h3>Connection status</h3>
                <p className="text-secondary">{connectionStatus}</p>
              </div>

              <div className="card social-links mt-md">
                <h3>Follow Us</h3>
                <div className="social-icons">
                  <a href="#" className="social-icon">
                    🐦
                  </a>
                  <a href="#" className="social-icon">
                    📘
                  </a>
                  <a href="#" className="social-icon">
                    📷
                  </a>
                  <a href="#" className="social-icon">
                    💼
                  </a>
                </div>
              </div>
            </div>

            <div className="contact-form-wrapper">
              <div className="card">
                <h2>Send us a Message</h2>
                {isSuccess ? (
                  <div className="success-message" role="status">
                    <div className="success-icon">✅</div>
                    <h3>Thank you!</h3>
                    <p className="text-secondary">
                      Your message has been sent successfully. We&apos;ll get back
                      to you soon!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="contact-form">
                    {hasError && errorMessage ? (
                      <div className="error-message" role="alert">
                        <div className="error-icon">⚠️</div>
                        <div>
                          <h3>We couldn&apos;t send your message</h3>
                          <p className="text-secondary">{errorMessage}</p>
                        </div>
                      </div>
                    ) : null}
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
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
