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

const getRole = (character) => {
  return roles.find(role => role.id === character);
}

function PanelApp() {
  const [config, setConfig] = useState(null);
  const [twitchReady, setTwitchReady] = useState(false);
  const [characterList, setCharacterList] = useState([]);

  //replace with config when not testing
  useEffect(() => {
    fetch('./characters.txt')
      .then(response => response.text())
      .then(text => {
        const characterList = text.trim().split(',').map(c => c.replaceAll("\"", ''));
        setCharacterList(characterList);
      });
  }, []);

  useEffect(() => {
    // Function to initialize Twitch extension
    const initTwitch = () => {
      if (window.Twitch && window.Twitch.ext) {
        setTwitchReady(true);
        window.Twitch.ext.onAuthorized((auth) => {
          console.log('Twitch extension authorized');
          const broadcasterConfig = window.Twitch.ext.configuration.broadcaster;

          if (broadcasterConfig && broadcasterConfig.content) {
            try {
              setConfig(JSON.parse(broadcasterConfig.content));
            } catch (e) {
              console.error("Invalid config JSON:", e);
            }
          }
        });
      }
    };

    // Try to initialize immediately
    initTwitch();

    // If Twitch isn't ready, wait for it
    if (!window.Twitch || !window.Twitch.ext) {
      const checkTwitch = setInterval(() => {
        if (window.Twitch && window.Twitch.ext) {
          clearInterval(checkTwitch);
          initTwitch();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => {
        clearInterval(checkTwitch);
      }, 10000);

      return () => clearInterval(checkTwitch);
    }
  }, []);

  return (
    <div className="extension-container">
      <div>
        {characterList.map(character => {
          const role = getRole(character);
          if (role) {
            const iconSrc = getRoleIcon(role.id);
            return (
              <div key={role.id} className="role-card">
                {iconSrc && (
                  <img 
                    src={iconSrc} 
                    alt={`${role.name} icon`}
                    className="role-icon"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="role-info">
                  <h3 className="role-name">
                    {role.name}
                    <span className="role-team">
                      ({role.team})
                    </span>
                  </h3>
                  <p className="role-ability">
                    {role.ability}
                  </p>
                </div>
              </div>
            );
        } else{
          return (
            <div/>
          );
        }
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

