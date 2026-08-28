import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiBell, FiChevronDown, FiMenu } = FiIcons;

function Topbar({ connection, onMenu }) {
  return (
    <header className="topbar">
      <button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation">
        <SafeIcon icon={FiMenu} />
      </button>

      <div className="environment">
        <span className={`connection-dot ${connection}`} />
        <span>{connection === 'live' ? 'Edge telemetry live' : 'Protected sample telemetry'}</span>
      </div>

      <div className="topbar-actions">
        <button className="icon-button notification-button" aria-label="Notifications">
          <SafeIcon icon={FiBell} />
          <span className="notification-dot" />
        </button>
        <button className="profile-button" type="button">
          <span className="avatar">CF</span>
          <span className="profile-copy">
            <strong>Chief Financial Officer</strong>
            <small>Master view</small>
          </span>
          <SafeIcon icon={FiChevronDown} />
        </button>
      </div>
    </header>
  );
}

export default Topbar;