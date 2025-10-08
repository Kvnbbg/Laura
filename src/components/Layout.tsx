import { ReactNode } from 'react';
import Navigation from './Navigation';
import './Layout.scss';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="layout">
      <Navigation />
      <main className="main-content">{children}</main>
      <footer className="footer">
        <div className="container">
          <p className="text-center text-secondary">
            © 2024 Laura - AI Float Cosmic Dream. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
