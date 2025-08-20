import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './config.css';
import roles from './assets/roles.json';
import scripts from './assets/defaultScripts.json';

function ConfigApp() {
  const [inputValue, setInputValue] = useState('');
  const [option, setOption] = useState('');
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

  const onChange = (ev) => {
    const val = ev.target.value;
    setOption(val);

    const script = JSON.stringify(scripts[val]);
    setInputValue(script);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputValue(event.target.result);
      };
      reader.readAsText(file);
    }
  };

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

      // Extract character IDs (skip first meta object)
      // Handle both formats:
      // Format v1: [{"id": "_meta", ...}, {"id": "character"}, ...]
      // Format v2: [{"id": "_meta", ...}, "character1", "character2", ...]
      const characters = scriptData
        .slice(1) // Skip first element (meta object)
        .map(item => {
          // Return the character ID (either the string itself or the id property)
          //Remove any non-letter values and lowercase the rest 
          return typeof item === 'string' ? item.replace(/[^a-zA-Z]/g, '').toLowerCase() : item.id.replace(/[^a-zA-Z]/g, '').toLowerCase();
        })

      if (characters.length === 0) {
        setValidationMessage('❌ No valid characters found in script');
        setValidationStatus('error');
        return;
      }

      const invalidCharacters = characters.filter(item => roles[item] === undefined);
      if (invalidCharacters.length > 0) {
        setValidationMessage('❌ Invalid character found in script: ' + invalidCharacters.join(', '));
        setValidationStatus('error');
        return;
      }

      // Transform to test_config format (categorized by team)
      // Extract meta data from first element
      const metaItem = scriptData[0];
      
      const configFormated = {
        name: metaItem?.name || "",
        author: metaItem?.author || "",
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
        const role = roles[characterId];
        if (role && configFormated.roles[role.team]) {
          configFormated.roles[role.team].push(characterId);
        }
      });
      console.log('Config format:', configFormated);
      
      // Save to Twitch
      const version = Date.now().toString();
      console.log('Version:', version);
      window.Twitch.ext.configuration.set(
        'broadcaster',
        version,
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
        <div className="header">  
          <h1>Configure displayed script</h1>
          <p>Update your current script by using one of the options below. Note that your viewers may need to refresh the stream to see the updates.</p>
          <p>If no script is currently saved, the extension will not display.</p>
        </div>
        <div className="config-form">
          <div className="form-base3">
            <label htmlFor="base3" className="config-label">
              Choose one of the Base 3 editions:
            </label>
            <select value={option} onChange={onChange}>
              <option selected="selected" value="" disabled>Select an edition...</option>
              {Object.entries(scripts).map(([scriptName, scriptRoles]) => (
                <option value={scriptName}>
                  {scriptName}
                </option>
              ))}
            </select>
          </div>
          <div className="config-upload">
            <label htmlFor="fileInput" className="config-label">
              Or upload/paste a custom script:
            </label>
            <input 
              type="file"
              id="fileInput"
              accept=".json,.txt"
              onChange={handleFileUpload}
              className="config-file-input"
            />
          </div>
          <div className="config-input">
            <textarea 
              id="characterInput"
              value={inputValue}
              onChange={handleInputChange}
              className="config-textarea"
              placeholder="Paste your JSON script here..."
            />
          </div>
          <div className="config-buttons">
            <button 
              onClick={handleSave}
              className="config-save-btn"
            >
              Save Configuration
            </button>
          </div>
          <div classname="config-validation">
            {validationMessage && (
            <div className={`config-validation-message ${validationStatus}`}>
              {validationMessage}
            </div>
            )}
          </div>
        </div>
        <details classname="config-faq">
        <summary>What script formats are accepted?</summary>
          <p>This extension accepts the JSON formats from the official site as well as botcscripts.com.</p>
          <p>See the following examples:</p>  
          <pre className="config-example">
{`[
  {"id": "_meta", "name": "No Greater Joy", "author": "Steven Medway"},
  {"id": "clockmaker"}, {"id": "investigator"}, {"id": "empath"}, 
  {"id": "chambermaid"}, {"id": "artist"}, {"id": "sage"}, {"id": "drunk"},
  {"id": "klutz"}, {"id": "scarletwoman"}, {"id": "baron"}, {"id": "imp"}
]`}
        </pre>
        <pre className="config-example">
{`[
  {"id": "_meta", "name": "No Greater Joy", "author": "Steven Medway"},
  "clockmaker", "investigator", "empath", "chambermaid", "artist", "sage",
  "drunk", "klutz", "scarletwoman", "baron", "imp"
]`}
          </pre>
        </details>
        <details classname="config-faq">
          <summary>Are homebrew characters supported?</summary>
          <p>At this point, homebrew characters are not supported.</p>
        </details>


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