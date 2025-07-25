import React, { useState } from 'react';
import './ConfigPage.css';

function ConfigPage() {
  const [inputValue, setInputValue] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

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
    <div className="config-container">
      <div className="config-form-group">
        <label htmlFor="characterInput">Paste your character list:</label>
        <textarea 
          id="characterInput"
          value={inputValue}
          onChange={handleInputChange}
          placeholder='Paste comma-separated character names like: "noble","librarian","pixie","empath"'
          className="config-textarea"
        />
        
        {validationMessage && (
          <div className="config-validation-status">
            {validationMessage}
          </div>
        )}
        
        <div className="config-example">
          <strong>Example format:</strong>
          <pre>"noble","librarian","pixie","empath","villageidiot","gossip","alsaahir"</pre>
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

      <div className="config-debug" style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <div>Input Length: {inputValue.length}</div>
        <div>Simple test version</div>
      </div>
    </div>
  );
}

export default ConfigPage; 