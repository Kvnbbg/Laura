import { ReactNode } from 'react';
import Navigation from './Navigation';
import ChatWidget from './ChatWidget';
import { getConfig } from '../config/env';
import './Layout.scss';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { appName } = getConfig();
  const appLinks = [
    { name: 'TechAndStream', href: 'https://techandstream.com', note: 'AI tools' },
    { name: 'Train Adventures', href: 'https://kvnbbg.fr', note: 'Kids learning' },
    { name: 'Batbout Maison', href: 'https://kvnbbg.github.io/foodapp-maquette/', note: 'Food ordering' },
    { name: 'La Bobine', href: 'https://kvnbbg-creations.io', note: 'Beatmaker' },
    { name: 'Laura CLI Install', href: '/install-cli', note: 'Go install' },
    { name: 'Laura Repo', href: 'https://github.com/Kvnbbg/Laura', note: 'Public GitHub' },
    { name: 'UbuntuBoost', href: 'https://ubuntu-boost.vercel.app', note: 'Linux toolkit' },
    { name: 'Support', href: 'https://donation-theta-self.vercel.app', note: 'Contact' },
  ];

  return (
    <div className="layout">
      <Navigation />
      <main className="main-content">{children}</main>
      <footer className="footer">
        <div className="container">
          <div className="app-network" aria-label="Other apps by Kevin">
            {appLinks.map((app) => (
              <a key={app.name} href={app.href} target="_blank" rel="noopener noreferrer">
                <span>{app.name}</span>
                <small>{app.note}</small>
              </a>
            ))}
          </div>
          <p className="text-center text-secondary">
            © {new Date().getFullYear()} {appName} - AI Float Cosmic Dream.
            All rights reserved.
          </p>
        </div>
      </footer>
      <ChatWidget />
    </div>
  );
};

export default Layout;
