import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './config.css';

function ConfigApp() {
  const [inputValue, setInputValue] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [validationStatus, setValidationStatus] = useState(''); // 'valid', 'error', or ''
  const [twitchReady, setTwitchReady] = useState(false);

  useEffect(() => {
    // Function to initialize Twitch extension
    const initTwitch = () => {
      if (window.Twitch && window.Twitch.ext) {
        setTwitchReady(true);
        window.Twitch.ext.onAuthorized((auth) => {
          console.log('Twitch extension authorized for config');
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
      setValidationMessage('❌ Please enter character names before saving');
      setValidationStatus('error');
      return;
    }

    if (!twitchReady) {
      setValidationMessage('❌ Twitch extension not ready. Please wait and try again.');
      setValidationStatus('error');
      return;
    }

    try {
      // Parse the character list
      const characters = inputValue.split(',').map(char => {
        return char.trim().replace(/^["']|["']$/g, '');
      }).filter(char => char.length > 0);

      if (characters.length === 0) {
        setValidationMessage('❌ No valid characters found to save');
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
      setValidationMessage('❌ Error saving configuration: ' + err.message);
      setValidationStatus('error');
    }
  };

  const handleTestValidation = () => {
    console.log('Test validation clicked');
    console.log('Input value:', inputValue);
  };

  return (
    <div className="extension-container">
      <div className="config-container">
        <h2>Blood on the Clocktower - Config</h2>
        
        <div className="config-form-group">
          <label htmlFor="characterInput" className="config-label">
            Paste your character list:
          </label>
          <textarea 
            id="characterInput"
            value={inputValue}
            onChange={handleInputChange}
            placeholder='Paste comma-separated character names like: "noble","librarian","pixie","empath"'
            className="config-textarea"
          />
          
          {validationMessage && (
            <div className={`config-validation-message ${validationStatus}`}>
              {validationMessage}
            </div>
          )}
          
          <div className="config-example-box">
            <strong>Example format:</strong>
            <pre className="config-example">
              "noble","librarian","pixie","empath","villageidiot","gossip","alsaahir"
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
          
          <button 
            onClick={handleTestValidation}
            className="config-test-btn"
            type="button"
          >
            Test Validation
          </button>
        </div>

        <div className="config-footer">
          <div>Twitch Ready: {twitchReady ? '✅' : '❌'}</div>
          <div>Input Length: {inputValue.length}</div>
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