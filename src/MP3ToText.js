import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import TranscriptionContext from './TranscriptionContext';

const Container = styled.div`
  padding: 2rem;
`;

const TranscriptionBox = styled.div`
  font-size: 1.2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  max-width: 80%;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  font-size: 1rem;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  &:hover {
    background-color: #0056b3;
  }
`;

const MP3ToText = ({ addMessage }) => {
  const [isListening, setIsListening] = useState(false);
  const { transcription, setTranscription } = useContext(TranscriptionContext);
  const [recognizer, setRecognizer] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            setTranscription((prev) => prev + ' ' + result[0].transcript);
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        setTranscription((prev) => prev + ' ' + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      setRecognizer(recognition);
    } else {
      alert('Web Speech API is not supported in this browser.');
    }
  }, [setTranscription]);

  const toggleListening = () => {
    if (recognizer) {
      if (isListening) {
        recognizer.stop();
      } else {
        recognizer.start();
      }
      setIsListening(!isListening);
    }
  };

  const sendToChat = () => {
    if (addMessage) {
      addMessage({ role: 'user', content: transcription });
      setTranscription(''); // Clear transcription after sending
    }
  };

  return (
    <Container>
      <h2>Reconhecimento de Fala em Tempo Real</h2>
      <Button onClick={toggleListening}>
        {isListening ? 'Parar Gravação' : 'Iniciar Gravação'}
      </Button>
      <TranscriptionBox>
        {transcription || 'Inicie a gravação para ver o texto aqui...'}
      </TranscriptionBox>
      {!isListening && transcription && (
        <Button onClick={sendToChat}>Enviar para o Chat</Button>
      )}
    </Container>
  );
};

export default MP3ToText;
