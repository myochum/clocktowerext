import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

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

  if (!config) return <div>Loading config...</div>;

  return (
    <div>
      <h1>Panel</h1>
      <pre>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PanelApp />
  </React.StrictMode>
);

