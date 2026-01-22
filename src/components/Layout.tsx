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

  return (
    <div className="layout">
      <Navigation />
      <main className="main-content">{children}</main>
      <footer className="footer">
        <div className="container">
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
