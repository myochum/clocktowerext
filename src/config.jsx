import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './config.css';
import roles from './assets/roles.json';

function ConfigApp() {
  const [inputValue, setInputValue] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [validationStatus, setValidationStatus] = useState('');
  const [twitchReady, setTwitchReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const initTwitch = () => {
      if (window.Twitch && window.Twitch.ext) {
        setTwitchReady(true);
        window.Twitch.ext.onAuthorized((auth) => {
          console.log('Twitch extension authorized');
        });

        window.Twitch.ext.onContext((context) => {
          console.log('Twitch extension context:', context);
          setIsDarkMode(context.theme === 'dark');
        });
      }
    };

    initTwitch();

    if (!window.Twitch || !window.Twitch.ext) {
      const checkTwitch = setInterval(() => {
        if (window.Twitch && window.Twitch.ext) {
          clearInterval(checkTwitch);
          initTwitch();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkTwitch);
      }, 10000);

      return () => clearInterval(checkTwitch);
    }
  }, []);



  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSave = () => {
    console.log('Save button clicked');
    
    // Basic validation
    if (!inputValue.trim()) {
      setValidationMessage('❌ Please enter script before saving');
      setValidationStatus('error');
      return;
    }

    if (!twitchReady) {
      setValidationMessage('❌ Twitch extension not ready. Please wait and try again.');
      setValidationStatus('error');
      return;
    }

    try {
      // Parse the JSON script
      const scriptData = JSON.parse(inputValue);
      
      if (!Array.isArray(scriptData)) {
        setValidationMessage('❌ Script must be a JSON array');
        setValidationStatus('error');
        return;
      }

      // Extract character IDs (skip _meta objects)
      const characters = scriptData
        .filter(item => item.id && item.id !== '_meta')
        .map(item => item.id);

      if (characters.length === 0) {
        setValidationMessage('❌ No valid characters found in script');
        setValidationStatus('error');
        return;
      }

      const invalidCharacters = characters.filter(item => roles.find(role => role.id === item) === undefined);
      if (invalidCharacters.length > 0) {
        setValidationMessage('❌ Invalid character found in script: ' + invalidCharacters.join(', '));
        setValidationStatus('error');
        return;
      }

      // Transform to test_config format (categorized by team)
      const configFormated = {
        name: scriptData.find(item => item.id === '_meta')?.name || "",
        author: scriptData.find(item => item.id === '_meta')?.author || "",
        roles: {
          townsfolk: [],
          outsider: [],
          minion: [],
          demon: [],
          traveller: [],
          fabled: []
        }
      };

      // Categorize characters by team
      characters.forEach(characterId => {
        const role = roles.find(r => r.id === characterId);
        if (role && configFormated.roles[role.team]) {
          configFormated.roles[role.team].push(characterId);
        }
      });
      console.log('Config format:', configFormated);
      
      // Save to Twitch
      window.Twitch.ext.configuration.set(
        'broadcaster',
        '1',
        JSON.stringify(configFormated)
      );

      // Show success message
      setValidationMessage(`✅ Configuration saved successfully! (${characters.length} characters)`);
      setValidationStatus('valid');

      console.log('Save successful');

    } catch (err) {
      console.error('Save error:', err);
      if (err instanceof SyntaxError) {
        setValidationMessage('❌ Invalid JSON format. Please check your script syntax.');
      } else {
        setValidationMessage('❌ Error saving configuration: ' + err.message);
      }
      setValidationStatus('error');
    }
  };

  return (
    <div className={`extension-container${isDarkMode ? ' dark' : ''}`}>
      <div className="config-container">
        <div className="config-form-group">
          <label htmlFor="characterInput" className="config-label">
            Paste your game script:
          </label>
          <textarea 
            id="characterInput"
            value={inputValue}
            onChange={handleInputChange}
            className="config-textarea"
          />
          
          {validationMessage && (
            <div className={`config-validation-message ${validationStatus}`}>
              {validationMessage}
            </div>
          )}
          
          <div className="config-example-box">
            <strong>Example script:</strong>
            <pre className="config-example">
{`[
  {"id": "_meta", "name": "Trouble Brewing", "author": "The Pandemonium Institute"},
  {"id": "washerwoman"}, {"id": "librarian"}, {"id": "investigator"},
  {"id": "chef"}, {"id": "empath"},
  {"id": "fortuneteller"}, {"id": "undertaker"}, {"id": "monk"},
  {"id": "ravenkeeper"}, {"id": "virgin"}, {"id": "slayer"},
  {"id": "soldier"}, {"id": "mayor"}, {"id": "butler"},
  {"id": "drunk"}, {"id": "recluse"}, {"id": "saint"},
  {"id": "poisoner"}, {"id": "spy"}, {"id": "scarletwoman"},
  {"id": "baron"}, {"id": "imp"}
]`}
            </pre>
          </div>
        </div>
        
        <div className="config-buttons">
          <button 
            onClick={handleSave}
            className="config-save-btn"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigApp />
  </React.StrictMode>
); 