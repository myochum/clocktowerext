import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import './config.css';
import roles from './assets/roles.json';
import defaultScripts from './assets/defaultScripts.json';

// Constants
const VALIDATION_MESSAGES = {
  EMPTY_SCRIPT: '❌ Please enter script before saving',
  INVALID_JSON_ARRAY: '❌ Script must be a JSON array',
  NO_CHARACTERS: '❌ No valid characters found in script',
  INVALID_CHARACTERS: '❌ Invalid character found in script: ',
  INVALID_JSON: '❌ Invalid JSON format. Please check your script syntax.',
  SAVE_ERROR: '❌ Error saving configuration: ',
  SAVE_SUCCESS: '✅ Configuration saved successfully!'
};

const TWITCH_CHECK_INTERVAL = 100;
const TWITCH_TIMEOUT = 10000;

function ConfigApp() {
  const [scriptState, setScriptState] = useState({
    inputValue: '',
    selectedDefault: '',
    savedScript: {}
  });
  const [validation, setValidation] = useState({
    message: '',
    status: ''
  });
  const [twitchState, setTwitchState] = useState({
    ready: false,
    isDarkMode: false
  });

  // Helper functions
  const normalizeCharacterId = useCallback((item) => {
    const id = typeof item === 'string' ? item : item.id;
    return id.replace(/[^a-zA-Z]/g, '').toLowerCase();
  }, []);

  // Validate characters. TODO: Remove to support homebrew characters
  const validateCharacters = useCallback((characters) => {
    if (characters.length === 0) {
      return VALIDATION_MESSAGES.NO_CHARACTERS;
    }

    const invalidCharacters = characters.filter(item => !roles[item]);
    if (invalidCharacters.length > 0) {
      return `${VALIDATION_MESSAGES.INVALID_CHARACTERS}${invalidCharacters.join(', ')}`;
    }

    return null;
  }, []);

  const createConfigFormat = useCallback((scriptData, characters) => {
    const metaItem = scriptData[0];
    
    const configFormatted = {
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
      if (role && configFormatted.roles[role.team]) {
        configFormatted.roles[role.team].push(characterId);
      }
    });

    return configFormatted;
  }, []);

  const setValidationError = useCallback((message) => {
    setValidation({ message, status: 'error' });
  }, []);

  const setValidationSuccess = useCallback((message) => {
    setValidation({ message, status: 'valid' });
  }, []);

  // Twitch initialization effect
  useEffect(() => {
    const initTwitch = () => {
      if (!window?.Twitch?.ext) return false;

      setTwitchState(prev => ({ ...prev, ready: true }));

      window.Twitch.ext.onAuthorized((auth) => {
        console.log('Twitch extension authorized');
        const content = window.Twitch.ext.configuration?.broadcaster?.content;
        if (content?.length > 0) {
          try {
            const savedScript = JSON.parse(content);
            setScriptState(prev => ({ ...prev, savedScript }));
            console.log('Saved script loaded:', savedScript);
          } catch (error) {
            console.error('Failed to parse saved script:', error);
          }
        }
      });

      window.Twitch.ext.onContext((context) => {
        console.log('Twitch extension context:', context);
        setTwitchState(prev => ({ ...prev, isDarkMode: context.theme === 'dark' }));
      });

      return true;
    };

    // Try immediate initialization
    if (initTwitch()) return;

    // Fallback: poll for Twitch availability
    const checkTwitch = setInterval(() => {
      if (initTwitch()) {
        clearInterval(checkTwitch);
      }
    }, TWITCH_CHECK_INTERVAL);

    const timeout = setTimeout(() => {
      clearInterval(checkTwitch);
    }, TWITCH_TIMEOUT);

    return () => {
      clearInterval(checkTwitch);
      clearTimeout(timeout);
    };
  }, []);

  // Event handlers
  const handleDefaultScriptChange = useCallback((ev) => {
    const selectedScript = ev.target.value;
    const script = JSON.stringify(defaultScripts[selectedScript]);
    
    setScriptState(prev => ({
      ...prev,
      selectedDefault: selectedScript,
      inputValue: script
    }));
  }, []);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setScriptState(prev => ({
        ...prev,
        inputValue: event.target.result
      }));
    };
    reader.readAsText(file);
  }, []);

  const handleInputChange = useCallback((e) => {
    setScriptState(prev => ({
      ...prev,
      inputValue: e.target.value
    }));
  }, []);

  const handleSave = useCallback(() => {
    console.log('Save button clicked');

    // Basic validation
    if (!scriptState.inputValue.trim()) {
      setValidationError(VALIDATION_MESSAGES.EMPTY_SCRIPT);
      return;
    }

    // Parse JSON with explicit error handling
    let scriptData;
    try {
      scriptData = JSON.parse(scriptState.inputValue);
    } catch (err) {
      setValidationError(VALIDATION_MESSAGES.INVALID_JSON);
      return;
    }
    
    if (!Array.isArray(scriptData)) {
      setValidationError(VALIDATION_MESSAGES.INVALID_JSON_ARRAY);
      return;
    }

    // Extract and normalize character IDs (skip first meta object)
    const characters = scriptData
      .slice(1) // Skip first element (meta object)
      .map(normalizeCharacterId);

    // Validate characters
    const validationError = validateCharacters(characters);
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    // Create configuration format
    const configFormatted = createConfigFormat(scriptData, characters);
    console.log('Config format:', configFormatted);

    // Save to Twitch (wrap only the potentially failing API call)
    try {
      const version = Date.now().toString();
      console.log('Version:', version);
      window.Twitch.ext.configuration.set(
        'broadcaster',
        version,
        JSON.stringify(configFormatted)
      );
    } catch (err) {
      console.error('Twitch API error:', err);
      setValidationError(`${VALIDATION_MESSAGES.SAVE_ERROR}${err.message}`);
      return;
    }

    // Update local state
    setScriptState(prev => ({ ...prev, savedScript: configFormatted }));

    // Show success message
    setValidationSuccess(`${VALIDATION_MESSAGES.SAVE_SUCCESS} (${characters.length} characters)`);
    console.log('Save successful');
  }, [scriptState.inputValue, twitchState.ready, normalizeCharacterId, validateCharacters, createConfigFormat, setValidationError, setValidationSuccess]);

  const scriptOptions = useMemo(() => {
    return Object.keys(defaultScripts).map((scriptName) => (
      <option key={scriptName} value={scriptName}>
        {scriptName}
      </option>
    ));
  }, []);

  return ( 
    <div className={`extension-container${twitchState.isDarkMode ? ' dark' : ''}`}>
      <div className="config-container">
        <div className="header">  
          <h1>Configure displayed script</h1>
          <div className="config-current">
            <em>Current script:</em> &nbsp;{scriptState.savedScript.name}&nbsp; (
              {
              Object.values(scriptState.savedScript.roles || {}).reduce((total, roleArray) => total + roleArray.length, 0)
              } characters)
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
            <select value={scriptState.selectedDefault} onChange={handleDefaultScriptChange}>
              <option value="" disabled>Select an edition...</option>
              {scriptOptions}
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
              value={scriptState.inputValue}
              onChange={handleInputChange}
              className="config-textarea"
              placeholder="Paste your JSON script here..."
            />
          </div>
          <div className="config-buttons">
            <button 
              onClick={handleSave}
              className="config-save-btn"
              disabled={!twitchState.ready}
            >
              Save Configuration
            </button>
          </div>
          <div className="config-validation">
            {validation.message && (
              <div className={`config-validation-message ${validation.status}`}>
                {validation.message}
              </div>
            )}
          </div>
        </div>
        <details className="config-faq">
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
        <details className="config-faq">
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