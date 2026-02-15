import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './config.css';
import roles from './assets/roles.json';
import scripts from './assets/defaultScripts.json';

const countAllRoleTypes = (roleGroups = {}) => {
  return Object.values(roleGroups).reduce((total, group) => {
    return total + (Array.isArray(group) ? group.length : 0);
  }, 0);
};

const normalizeCharacterId = (item) => {
  const rawId = typeof item === 'string' ? item : item?.id;
  if (typeof rawId !== 'string') {
    return null;
  }

  return rawId.replace(/[^a-zA-Z]/g, '').toLowerCase();
};

const parseScriptArray = (scriptData) => {
  if (!Array.isArray(scriptData)) {
    throw new Error('Script must be a JSON array');
  }

  const characters = scriptData
    .slice(1)
    .map(normalizeCharacterId)
    .filter(Boolean);

  if (characters.length === 0) {
    throw new Error('No valid characters found in script');
  }

  const invalidCharacters = characters.filter((item) => roles[item] === undefined);
  if (invalidCharacters.length > 0) {
    throw new Error('Invalid character found in script: ' + invalidCharacters.join(', '));
  }

  const metaItem = scriptData[0];
  const configFormatted = {
    name: metaItem?.name || '',
    author: metaItem?.author || '',
    roles: {}
  };

  characters.forEach((characterId) => {
    const role = roles[characterId];
    if (!role?.team) {
      return;
    }

    if (!configFormatted.roles[role.team]) {
      configFormatted.roles[role.team] = [];
    }

    configFormatted.roles[role.team].push(characterId);
  });

  return { configFormatted, characterCount: characters.length };
};

function ConfigApp() {
  const [inputValue, setInputValue] = useState('');
  const [option, setOption] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [validationStatus, setValidationStatus] = useState('');
  const [twitchReady, setTwitchReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [savedConfig, setSavedConfig] = useState(null);
  const [previewConfig, setPreviewConfig] = useState(null);

  useEffect(() => {
    const initTwitch = () => {
      if (window.Twitch && window.Twitch.ext) {
        setTwitchReady(true);
        window.Twitch.ext.onAuthorized((auth) => {
          console.log('Twitch extension authorized');

          const loadSavedConfig = () => {
            const broadcasterConfig = window.Twitch.ext.configuration.broadcaster;

            if (broadcasterConfig?.content) {
              try {
                setSavedConfig(JSON.parse(broadcasterConfig.content));
              } catch (error) {
                console.error('Invalid broadcaster config JSON:', error);
                setSavedConfig(null);
              }
              return;
            }

            setSavedConfig(null);
          };

          loadSavedConfig();
          window.Twitch.ext.configuration.onChanged(loadSavedConfig);
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
      setOption('');
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputValue(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleInputChange = (e) => {
    setOption('');
    setInputValue(e.target.value);
  };

  useEffect(() => {
    if (!inputValue.trim()) {
      setPreviewConfig(null);
      return;
    }

    try {
      const scriptData = JSON.parse(inputValue);
      const { configFormatted } = parseScriptArray(scriptData);
      setPreviewConfig(configFormatted);
    } catch {
      setPreviewConfig(null);
    }
  }, [inputValue]);

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
      const { configFormatted, characterCount } = parseScriptArray(scriptData);
      console.log('Config format:', configFormatted);

      // Save to Twitch
      const version = Date.now().toString();
      console.log('Version:', version);
      window.Twitch.ext.configuration.set(
        'broadcaster',
        version,
        JSON.stringify(configFormatted)
      );
      setSavedConfig(configFormatted);

      // Show success message
      setValidationMessage(`✅ Configuration saved successfully! (${characterCount} characters)`);
      setValidationStatus('valid');

      console.log('Save successful');

    } catch (err) {
      console.error('Save error:', err);
      if (err instanceof SyntaxError) {
        setValidationMessage('❌ Invalid JSON format. Please check your script syntax.');
      } else {
        setValidationMessage('❌ ' + err.message);
      }
      setValidationStatus('error');
    }
  };

  const displayedConfig = previewConfig || savedConfig;
  const displayedScriptName = displayedConfig?.name || 'None';
  const displayedCharacterCount = countAllRoleTypes(displayedConfig?.roles);

  return ( 
    <div className={`extension-container${isDarkMode ? ' dark' : ''}`}>
      <div className="config-container">
        <div className="header">  
          <h1>Configure displayed script</h1>
          <div className="config-current">
            <em>Current script:</em> &nbsp;{displayedScriptName}&nbsp; (
                {displayedCharacterCount}
              &nbsp;characters)
          </div>
          <div className="config-instruct">
            <p>Update your current script by using one of the options below. Note that your viewers may need to refresh the stream to see the updates.</p>
            <p>If no script is currently saved, the extension will not display.</p>
          </div>
        </div>
        <div className="config-form">
          <div className="form-base3">
            <label htmlFor="base3" className="config-label">
              Choose one of the Base 3 editions:
            </label>
            <select value={option} onChange={onChange}>
              <option value="" disabled>Select a script...</option>
              {Object.entries(scripts).map(([scriptName, scriptRoles]) => (
                <option key={scriptName} value={scriptName}>
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
