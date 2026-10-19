import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { TopNavigation } from '../common/TopNavigation';
import { Sparkles } from 'lucide-react';
import './AppLayout.css';

export function AppLayout() {
  return (
    <div className="app-shell" data-component="app-layout">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Page Route Viewport */}
      <main className="app-main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="app-footer" data-component="app-footer">
        <div className="container app-footer-inner">
          <div className="footer-left">
            <div className="footer-brand">
              <span className="footer-logo">OS Lab</span>
              <span className="footer-pill">Agentation-Ready</span>
            </div>
            <p className="footer-desc">
              Explore operating system fundamentals through interactive visual simulations. Built with vanilla modular components.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-link-group">
              <span className="footer-group-title">Curriculum</span>
              <Link to="/learn/process-lifecycle">Process Lifecycle</Link>
              <Link to="/learn/cpu-scheduling">CPU Scheduling</Link>
              <Link to="/learn/ram-allocation">RAM Allocation</Link>
              <Link to="/learn/virtual-memory">Virtual Memory</Link>
            </div>
            <div className="footer-link-group">
              <span className="footer-group-title">Hardware & Files</span>
              <Link to="/learn/io-queue">I/O Queue</Link>
              <Link to="/learn/interrupt-handling">Interrupts</Link>
              <Link to="/learn/file-system">File System</Link>
              <Link to="/learn/file-permissions">Permissions</Link>
            </div>
          </div>
        </div>
        <div className="footer-sub-bottom">
          <div className="container sub-bottom-inner">
            <span>© OS Lab — Interactive Educational Platform</span>
            <span className="sub-tag">Designed with clean pastel aesthetics for Computer Science students</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
