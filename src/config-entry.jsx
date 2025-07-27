import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './config.css';
import roles from './assets/roles.json';

function ConfigApp() {
  const [inputValue, setInputValue] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [validationStatus, setValidationStatus] = useState('');
  const [twitchReady, setTwitchReady] = useState(false);

  useEffect(() => {
    const initTwitch = () => {
      if (window.Twitch && window.Twitch.ext) {
        setTwitchReady(true);
        window.Twitch.ext.onAuthorized((auth) => {
          console.log('Twitch extension authorized');
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

      console.log('Saving to Twitch:', characters);
      
      // Save to Twitch
      window.Twitch.ext.configuration.set(
        'broadcaster',
        '1',
        JSON.stringify(characters)
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
    <div className="extension-container">
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
  {"id": "_meta", "name": "Kill My Darlings", "author": "Ruth"},
  {"id": "steward"}, {"id": "noble"}, {"id": "pixie"},
  {"id": "highpriestess"}, {"id": "fortuneteller"},
  {"id": "towncrier"}, {"id": "oracle"}, {"id": "juggler"},
  {"id": "nightwatchman"}, {"id": "artist"}, {"id": "huntsman"},
  {"id": "farmer"}, {"id": "cannibal"}, {"id": "butler"},
  {"id": "sweetheart"}, {"id": "damsel"}, {"id": "drunk"},
  {"id": "lunatic"}, {"id": "widow"}, {"id": "poisoner"},
  {"id": "witch"}, {"id": "goblin"}, {"id": "imp"},
  {"id": "vigormortis"}, {"id": "fanggu"}, {"id": "bureaucrat"},
  {"id": "thief"}, {"id": "deviant"}, {"id": "harlot"}
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