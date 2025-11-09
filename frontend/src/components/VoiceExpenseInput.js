import React, { useState, useEffect } from 'react';
import { Button, Alert, Badge, Form } from 'react-bootstrap';
import { Mic, MicMute, ArrowUp, ArrowDown } from 'react-bootstrap-icons';

const VoiceExpenseInput = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [detectedType, setDetectedType] = useState('');
  const [transcript, setTranscript] = useState('');
  const [quickText, setQuickText] = useState('');

  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);

  useEffect(() => {
    // Check security requirements for speech recognition
    const isSecure = window.isSecureContext && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
    const hasSpeechSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (!isSecure) {
      setError("Voice input requires HTTPS for security. Using quick text entry mode.");
      setIsVoiceAvailable(false);
      return;
    }

    if (!hasSpeechSupport) {
      setError("Voice input not supported in this browser. Using quick text entry mode.");
      setIsVoiceAvailable(false);
      return;
    }

    // If we get here, voice should be available
    setIsVoiceAvailable(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
  
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-IN'; // Changed to Indian English

  recognition.onstart = () => {
    console.log('Speech recognition started');
    setIsListening(true);
    setError('');
    setTranscript('');
  };

  recognition.onresult = (event) => {
    console.log('Speech recognition result received');
    const currentTranscript = event.results[0][0].transcript;
    setTranscript(currentTranscript);
    
    const { type, cleanedTranscript } = detectTransactionType(currentTranscript);
    setDetectedType(type);
    onResult(cleanedTranscript, type);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    
    // More specific error handling
    if (event.error === 'not-allowed') {
      setError('Microphone access denied. Please allow microphone permissions in your browser.');
    } else if (event.error === 'network') {
      setError('Speech recognition requires a stable internet connection and HTTPS. Please ensure you\'re on HTTPS and try again.');
    } else if (event.error === 'audio-capture') {
      setError('No microphone found. Please check your microphone connection.');
    } else if (event.error === 'service-not-allowed') {
      setError('Speech service not available in your region or browser. Try a different browser or use quick text entry.');
    } else if (event.error === 'language-not-supported') {
      setError('Selected language (en-IN) not supported. Try a different browser or use quick text entry.');
    } else {
      setError(`Speech recognition error: ${event.error}. Use quick text entry instead.`);
    }
    setIsListening(false);
  };

  recognition.onend = () => {
    console.log('Speech recognition ended');
    setIsListening(false);
    setTimeout(() => {
      setDetectedType('');
      setTranscript('');
    }, 3000);
  };

  if (isListening) {
    try {
      recognition.start();
    } catch (err) {
      setError('Failed to start speech recognition. Use text input below.');
      setIsListening(false);
    }
  }

  return () => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        // Ignore stop errors
      }
    }
  };
}, [isListening, onResult]);

  const detectTransactionType = (text) => {
    const lowerText = text.toLowerCase();
    console.log('Processing text:', text);
    
    // Strong income indicators
    const incomeKeywords = [
      'salary', 'income', 'received', 'got', 'earned', 'bonus', 'payment', 
      'refund', 'credited', 'deposit', 'gift', 'reward', 'dividend', 'interest',
      'profit', 'freelance', 'client', 'money received', 'cashback', 'reimbursement'
    ];
    
    // Strong expense indicators
    const expenseKeywords = [
      'spent', 'paid', 'bought', 'purchased', 'shopped', 'ordered', 'booked',
      'subscription', 'bill', 'fee', 'charge', 'cost', 'price', 'rent',
      'food', 'lunch', 'dinner', 'breakfast', 'coffee', 'tea', 'snacks',
      'groceries', 'transport', 'bus', 'train', 'metro', 'taxi', 'auto', 'petrol',
      'entertainment', 'movie', 'shopping', 'clothes', 'health', 'hospital'
    ];
    
    // Check for income keywords
    const isIncome = incomeKeywords.some(keyword => lowerText.includes(keyword));
    
    // Check for expense keywords  
    const isExpense = expenseKeywords.some(keyword => lowerText.includes(keyword));
    
    // Determine type
    let detectedType = 'expense'; // Default
    
    if (isIncome && !isExpense) {
      detectedType = 'income';
    } else if (isExpense && !isIncome) {
      detectedType = 'expense';
    } else if (isIncome && isExpense) {
      // If both found, check context
      if (lowerText.includes('received') || lowerText.includes('credited') || lowerText.includes('salary')) {
        detectedType = 'income';
      } else {
        detectedType = 'expense';
      }
    }
    
    console.log('Detected type:', detectedType);
    
    // Clean the transcript
    let cleanedTranscript = text;
    const phrasesToRemove = [
      'i received', 'i got', 'received', 'got paid', 'salary of', 'income of',
      'i spent', 'i paid', 'spent on', 'paid for', 'bought', 'purchased'
    ];
    
    phrasesToRemove.forEach(phrase => {
      const regex = new RegExp(phrase, 'gi');
      cleanedTranscript = cleanedTranscript.replace(regex, '').trim();
    });
    
    return {
      type: detectedType,
      cleanedTranscript: cleanedTranscript || text
    };
  };

  const toggleListening = () => {
    setError('');
    setDetectedType('');
    setTranscript('');
    setIsListening(!isListening);
  };

  // Manual quick entry as fallback
  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickText.trim()) return;

    const { type, cleanedTranscript } = detectTransactionType(quickText);
    setDetectedType(type);
    onResult(cleanedTranscript, type);
    setQuickText('');
    
    // Auto-clear detection
    setTimeout(() => setDetectedType(''), 3000);
  };

  return (
    <div className="mb-3">
      {/* Voice Input Section - Only show if available */}
      {isVoiceAvailable && (
        <>
          <div className="d-flex align-items-center gap-3 mb-2">
            <Button
              variant={isListening ? "danger" : "outline-primary"}
              onClick={toggleListening}
              className="d-flex align-items-center"
            >
              {isListening ? <MicMute className="me-2" /> : <Mic className="me-2" />}
              {isListening ? "Stop Recording" : "Voice Input"}
            </Button>
          
            {isListening && (
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Listening...</span>
              </div>
            )}
            
            {detectedType && (
              <Badge 
                bg={detectedType === 'income' ? 'success' : 'danger'} 
                className="d-flex align-items-center"
              >
                {detectedType === 'income' ? <ArrowUp className="me-1" /> : <ArrowDown className="me-1" />}
                Auto-detected: {detectedType}
              </Badge>
            )}
          </div>
          
          {/* Live Transcript Display */}
          {transcript && (
            <Alert variant="info" className="mt-2">
              <strong>Heard:</strong> "{transcript}"
            </Alert>
          )}
          
          {/* Status Messages */}
          {isListening && !transcript && (
            <div className="mt-2 text-muted">
              <div>🎤 <strong>Listening...</strong> Speak clearly into your microphone</div>
              <div className="small mt-1">
                <strong>Try saying:</strong> "Salary 50000" or "Lunch 250 at restaurant"
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Quick Text Entry - More prominent when voice unavailable */}
      <div className={`mt-3 ${!isVoiceAvailable ? 'border p-3 rounded bg-light' : ''}`}>
        {!isVoiceAvailable && (
          <div className="text-primary mb-2">
            <strong>💡 Quick Text Entry Mode</strong>
            <div className="small text-muted">Enter transactions in the format: "Salary 50000" or "Lunch 250"</div>
          </div>
        )}
        <Form onSubmit={handleQuickSubmit}>
          <div className="d-flex gap-2">
            <Form.Control
              type="text"
              placeholder="Type: 'Salary 50000' or 'Lunch 250'"
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              className={!isVoiceAvailable ? 'form-control-lg' : 'form-control-sm'}
            />
            <Button 
              variant={!isVoiceAvailable ? "primary" : "outline-secondary"} 
              type="submit" 
              className={!isVoiceAvailable ? '' : 'btn-sm'}
            >
              Quick Add
            </Button>
          </div>
        </Form>
      </div>
      
      {/* Error Display - Only show for transient errors when voice is available */}
      {isVoiceAvailable && error && (
        <Alert variant="warning" className="mt-2">
          {error}
          <div className="small mt-1">
            <strong>Tip:</strong> Use the quick text entry above as backup
          </div>
        </Alert>
      )}
      
      {/* Help Text - Show relevant examples based on mode */}
      <div className="text-muted small mt-2">
        <strong>{isVoiceAvailable ? 'Voice & Text Examples:' : 'Text Examples:'}</strong>
        <div>• "<strong>Salary 50000</strong>" → Auto income</div>
        <div>• "<strong>Lunch 250 at restaurant</strong>" → Auto expense</div>
        <div>• "<strong>Received 15000 from client</strong>" → Auto income</div>
      </div>
    </div>
  );
};

export default VoiceExpenseInput;