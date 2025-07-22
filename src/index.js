import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import roles from './assets/roles.json';

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
        {roles.map(role => (
          <div key={role.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
            <h3>{role.name} ({role.team})</h3>
            <p>{role.ability}</p>
          </div>
        ))}
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

