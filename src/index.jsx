import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import roles from './assets/roles.json';

const TEST_MODE = true;

// Helper function to get role icon - Vite compatible
const getRoleIcon = (role) => {
  return new URL(`./assets/icons/${role.id}.png`, import.meta.url).href;
};

const getTeamIcon = (role) => {
  return new URL(`./assets/icons/${role.team}.png`, import.meta.url).href;
};

const getRole = (character) => {
  return roles.find(role => role.id === character);
}

function PanelApp() {
  const [config, setConfig] = useState(null);
  const [twitchReady, setTwitchReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Check if this is mobile version
  const isMobile = document.getElementById('root')?.getAttribute('data-mobile') === 'true';
  const isVideo = document.getElementById('root')?.getAttribute('data-video') === 'true';

  useEffect(() => {
    if (TEST_MODE) {
      // ========== TEST MODE: Load test config ==========
      fetch('./test_config.txt')
        .then(response => response.text())
        .then(text => {
          try {
            const scriptData = JSON.parse(text);
            setConfig(scriptData);
            setLoading(false);
          } catch (e) {
            console.error("Error parsing test config:", e);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error("Error loading test config:", err);
          setLoading(false);
        });
    } else {
      // ========== TWITCH MODE: Initialize Twitch extension ==========
      const initTwitch = () => {
        if (window.Twitch && window.Twitch.ext) {
          setTwitchReady(true);
          window.Twitch.ext.onAuthorized((auth) => {
            console.log('Twitch extension authorized');
            
            // Function to load configuration
            const loadConfig = () => {
              const broadcasterConfig = window.Twitch.ext.configuration.broadcaster;
              if (broadcasterConfig && broadcasterConfig.content) {
                try {
                  const newConfig = JSON.parse(broadcasterConfig.content);
                  setConfig(newConfig);
                  console.log('Configuration loaded:', newConfig);
                } catch (e) {
                  console.error("Invalid config JSON:", e);
                  setConfig(null);
                }
              } else {
                setConfig(null);
              }
            };

            // Load initial configuration
            loadConfig();

            // Listen for configuration changes
            window.Twitch.ext.configuration.onChanged(() => {
              console.log('Configuration changed, reloading...');
              loadConfig();
            });

            window.Twitch.ext.onContext((context) => {
              console.log('Twitch extension context:', context);
              setIsDarkMode(context.theme === 'dark');
            });

            // Set loading to false after checking for config
            setLoading(false);
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
          setLoading(false); // Stop loading if Twitch never loads
        }, 10000);

        return () => clearInterval(checkTwitch);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className={`extension-container${isMobile ? ' mobile' : ''}${isVideo ? ' video' : ''}`}>
        <div className="loading-message">Loading...</div>
      </div>
    );
  }

    if (config) {
    return (
      <div className={`extension-container${isMobile ? ' mobile' : ''}${isVideo ? ' video' : ''}${isDarkMode ? ' dark' : ''}`}>
        <div className="container-content">
          {config.name && (
            <div className="script-header">
              <h2 className="script-name">{config.name}</h2>
              {config.author && <p className="script-author">by {config.author}</p>}
            </div>
          )}
          
          {Object.entries(config.roles).map(([teamKey, teamRoles]) => {
            if (!teamRoles || teamRoles.length === 0) return null;
            
            // Capitalize first letter of team name
            const teamName = teamKey.charAt(0).toUpperCase() + teamKey.slice(1);
            
            return (
              <div key={teamKey} className="team-section">
                <h3 className="team-header">{teamName}{teamName === 'Fabled' || teamName === 'Townsfolk' ? '' : 's'}</h3>
                <div className="team-roles">
                  {teamRoles.map((character, index) => {
                    const role = getRole(character);
                    if (role) {
                      const iconSrc = getRoleIcon(role);
                      return (
                        <div key={role.id} className="role-card">
                          {iconSrc && (
                            <img 
                              src={iconSrc} 
                              alt={`${role.name} icon`}
                              className="role-icon"
                              onError={(e) => { 
                                e.target.src = getTeamIcon(role);
                              }}
                            />
                          )}
                          <div className="role-info">
                            <h4 className="role-name">{role.name}</h4>
                            <p className="role-ability">{role.ability}</p>
                          </div>
                        </div>
                      );
                    } else {
                      return <div key={`unknown-${teamKey}-${index}`}/>;
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    return (
      <div className={`extension-container${isMobile ? ' mobile' : ''}${isVideo ? ' video' : ''}`}>
        <div className="empty-message">No character configuration found. Please set up your character list in the extension configuration.</div>
      </div>
    );
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PanelApp />
  </React.StrictMode>
);

