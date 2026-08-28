import React from 'react';
import { NavLink } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiActivity, FiCheckSquare, FiHexagon, FiLock, FiShield } = FiIcons;

const navigation = [
  { to: '/', label: 'Executive overview', icon: FiActivity },
  { to: '/approvals', label: 'HITL approval desk', icon: FiCheckSquare }
];

function Sidebar({ open, onClose }) {
  return (
    <>
      <button
        className={`sidebar-scrim ${open ? 'is-open' : ''}`}
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark"><SafeIcon icon={FiHexagon} /></span>
          <div>
            <strong>AXiM</strong>
            <small>CFO Department</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          <span className="nav-label">Command center</span>
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <SafeIcon icon={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="security-card">
          <span className="security-icon"><SafeIcon icon={FiShield} /></span>
          <div>
            <strong>Zero-Trust perimeter</strong>
            <p>Cloudflare Access policy expected upstream.</p>
          </div>
          <SafeIcon icon={FiLock} className="lock-icon" />
        </div>
      </aside>
    </>
  );
}

export default Sidebar;