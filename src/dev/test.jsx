import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { PanelApp } from './index.jsx';

// Simple test wrapper that mocks Twitch and provides test config
function TestWrapper() {
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    // Load test config and mock Twitch API
    fetch('./test_config.txt')
      .then(response => response.text())
      .then(text => {
        const scriptData = JSON.parse(text);
        
        // Mock Twitch extension API
        window.Twitch = {
          ext: {
            onAuthorized: (callback) => {
              callback({ token: 'test-token' });
            },
            configuration: {
              broadcaster: {content: JSON.stringify(scriptData)},
              onChanged: (callback) => {
                // Mock the onChanged callback - call it immediately with test data
                callback();
              }
            },
            onContext: (callback) => {
              callback({ theme: '' });
            }
          }
        };

        setConfigLoaded(true);
      })
      .catch(err => {
        console.error('Error loading test config:', err);
      });
  }, []);

  if (!configLoaded) {
    return (
      <div className="extension-container">
        <div className="loading-message">Loading test configuration...</div>
      </div>
    );
  }

    return <PanelApp />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TestWrapper />);