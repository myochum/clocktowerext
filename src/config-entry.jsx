import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function ConfigApp() {
  const [inputValue, setInputValue] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
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
    alert('Save clicked - input: ' + inputValue);
  };

  const handleTestValidation = () => {
    console.log('Test validation clicked');
    console.log('Input value:', inputValue);
  };

  return (
    <div className="extension-container">
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2>Blood on the Clocktower - Config</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="characterInput" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Paste your character list:
          </label>
          <textarea 
            id="characterInput"
            value={inputValue}
            onChange={handleInputChange}
            placeholder='Paste comma-separated character names like: "noble","librarian","pixie","empath"'
            style={{ 
              width: '100%', 
              minHeight: '120px', 
              padding: '12px', 
              border: '2px solid #e0e0e0', 
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: '"Courier New", monospace'
            }}
          />
          
          {validationMessage && (
            <div style={{ 
              marginTop: '10px', 
              padding: '8px 12px', 
              borderRadius: '4px', 
              backgroundColor: '#d4edda', 
              color: '#155724' 
            }}>
              {validationMessage}
            </div>
          )}
          
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '6px',
            borderLeft: '4px solid #9147ff'
          }}>
            <strong>Example format:</strong>
            <pre style={{ margin: '10px 0 0 0', fontSize: '12px' }}>
              "noble","librarian","pixie","empath","villageidiot","gossip","alsaahir"
            </pre>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleSave}
            style={{ 
              padding: '12px 24px', 
              background: '#9147ff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Save Configuration
          </button>
          
          <button 
            onClick={handleTestValidation}
            style={{ 
              padding: '12px 24px', 
              background: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            type="button"
          >
            Test Validation
          </button>
        </div>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
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