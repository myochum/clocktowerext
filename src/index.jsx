import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import roles from './assets/roles.json';

const getRoleIcon = (character) => {
  return new URL(`./assets/icons/${character}.png`, import.meta.url).href;
};

const getTeamIcon = (team) => {
  return new URL(`./assets/icons/${team}.png`, import.meta.url).href;
};

export function PanelApp() {
  // Check if this is mobile version
  const isMobile = document.getElementById('root')?.getAttribute('data-mobile') === 'true';
  const isVideo = document.getElementById('root')?.getAttribute('data-video') === 'true';

  const [config, setConfig] = useState(null);
  const [twitchReady, setTwitchReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [collapsedState, setCollapsedState] = useState(isVideo ? 'collapse' : 'expanded');
  const toggleCollapsed = () => { 
    setCollapsedState(collapsedState.includes('collapse') ? 'expanded' : 'collapse animate'); 
  };
  


  useEffect(() => {
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
      <div className={`extension-container ${collapsedState}${isMobile ? ' mobile' : ''}${isVideo ? ' video' : ''}${isDarkMode ? ' dark' : ''}`}>
        {isVideo && <div className="collapse-tab" onClick={toggleCollapsed}>
            <div className="helper-text">
              <span>CHARACTERS</span>
            </div>
        </div>}
        <div className="container-content">
          <div className="header-container">
            {config.name && (
              <div className="script-header">
                <h2 className="script-name">{config.name}</h2>
                {config.author && <p className="script-author">by {config.author}</p>}
              </div>
            )}
          </div>

          {Object.entries(config.roles).map(([teamKey, teamRoles]) => {
            if (!teamRoles || teamRoles.length === 0) return null;
            
            // Capitalize first letter of team name
            const teamName = teamKey.charAt(0).toUpperCase() + teamKey.slice(1);
            
            return (
              <div key={teamKey} className="team-section">
                <h3 className="team-header">{teamName}{teamName === 'Fabled' || teamName === 'Townsfolk' ? '' : 's'}</h3>
                <div className="team-roles">
                  {teamRoles.map((character, index) => {
                    const role = roles[character];
                    if (role) {
                      const iconSrc = getRoleIcon(character);
                      return (
                        <div key={character} className="role-card">
                          {iconSrc && (
                            <img 
                              src={iconSrc} 
                              alt={`${character} icon`}
                              className="role-icon"
                              onError={(e) => { 
                                e.target.src = getTeamIcon(role.team);
                              }}
                            />
                          )}
                          <div className="role-info">
                            <h4 className="role-name">{role.name || character}</h4>
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
        <div className="empty-message">No characters have been uploaded.</div>
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
