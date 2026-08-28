import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { treasuryChecks } from '../../data/financialData';

const { FiCheck, FiShield } = FiIcons;

function TreasuryPanel() {
  return (
    <section className="panel treasury-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Treasury governance</span>
          <h2>Processor health</h2>
        </div>
        <SafeIcon icon={FiShield} className="panel-heading-icon" />
      </div>

      <div className="treasury-list">
        {treasuryChecks.map((check) => (
          <div className="treasury-row" key={check.name}>
            <span className="check-mark"><SafeIcon icon={FiCheck} /></span>
            <div>
              <strong>{check.name}</strong>
              <span>{check.status}</span>
            </div>
            <b>{check.value}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TreasuryPanel;