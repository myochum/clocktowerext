import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import roles from './assets/roles.json';

// Helper function to get role icon
const getRoleIcon = (roleId) => {
  try {
    return require(`./assets/icons/${roleId}.png`);
  } catch (error) {
    return null; // Return null if icon doesn't exist
  }
};

function PanelApp() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    window.Twitch.ext.onAuthorized(() => {
      const broadcasterConfig = window.Twitch.ext.configuration.broadcaster;

      if (broadcasterConfig && broadcasterConfig.content) {
        try {
          setConfig(JSON.parse(broadcasterConfig.content));
        } catch (e) {
          console.error("Invalid config JSON:", e);
        }
      }
    });
  }, []);

  // if (!config) return <div>Loading config...</div>;

  return (
    <div>
      {/* <pre>{JSON.stringify(config, null, 2)}</pre> */}
      <div>
        {roles.map(role => {
          const iconSrc = getRoleIcon(role.id);
          return (
            <div key={role.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
              {iconSrc && (
                <img 
                  src={iconSrc} 
                  alt={`${role.name} icon`}
                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0' }}>{role.name}</h3>
                <p style={{ margin: 0 }}>{role.ability}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PanelApp />
  </React.StrictMode>
);

