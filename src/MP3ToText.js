import React, { useState, useEffect, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import TranscriptionContext from './TranscriptionContext';

const Container = styled.div`
  padding: 2rem;
  max-width: 600px;
  margin: auto;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Title = styled.h2`
  font-size: 2rem;
  text-align: center;
  color: #333;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
`;

const TranscriptionBox = styled.div`
  font-size: 1.2rem;
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-top: 1.5rem;
  white-space: pre-wrap;
  min-height: 150px;

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 1rem;
    margin-top: 1rem;
  }
`;

const Button = styled.button`
  padding: 0.8rem 1.5rem;
  font-size: 1.1rem;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
  margin-right: 0.5rem;
  transition: background-color 0.3s, transform 0.2s;
  display: inline-block;

  &:hover {
    background-color: #0056b3;
    transform: translateY(-3px);
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0.7rem 1.2rem;
    margin-top: 0.8rem;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const Select = styled.select`
  padding: 0.6rem;
  font-size: 1rem;
  margin-top: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  max-width: 300px;
  transition: border-color 0.3s;

  &:hover {
    border-color: #007bff;
  }

  @media (max-width: 768px) {
    font-size: 0.95rem;
    padding: 0.5rem;
    margin-top: 0.8rem;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  border: 8px solid #f3f3f3;
  border-top: 8px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: ${spin} 2s linear infinite;
  margin: 2rem auto;
`;

const MP3ToText = ({ addMessage }) => {
  const [isListening, setIsListening] = useState(false);
  const { transcription, setTranscription } = useContext(TranscriptionContext);
  const [recognizer, setRecognizer] = useState(null);
  const [interimText, setInterimText] = useState('');
  const [language, setLanguage] = useState('pt-BR');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event) => {
        let newInterimText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          newInterimText += result[0].transcript;
        }
        setInterimText(newInterimText.trim());

        if (event.results[event.results.length - 1].isFinal) {
          setTranscription((prev) => prev + ' ' + newInterimText.trim());
          setInterimText('');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (isListening) {
          recognition.start();
        }
      };

      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        }
      };

      setRecognizer(recognition);
    } else {
      alert('Web Speech API is not supported in this browser.');
    }
  }, [setTranscription, language]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (interimText) {
        setTranscription((prev) => prev + ' ' + interimText);
        setInterimText('');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [interimText, setTranscription]);

  const toggleListening = () => {
    if (recognizer) {
      if (isListening) {
        recognizer.stop();
      } else {
        recognizer.lang = language;
        recognizer.start();
      }
      setIsListening(!isListening);
    }
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true);
  
      const formData = new FormData();
      formData.append('audio', file);
  
      try {
        const response = await fetch('http://localhost:5002/transcribe', {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error('Erro na transcrição do arquivo.');
        }
  
        const data = await response.json(); // Certifique-se de que está tratando como JSON
        if (data.transcription) {
          setTranscription(data.transcription);
        } else if (data.error) {
          alert(`Erro: ${data.error}`);
        }
      } catch (error) {
        console.error('Erro ao enviar o arquivo:', error);
        alert('Erro ao transcrever o arquivo. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  

  const sendToChat = () => {
    if (addMessage) {
      addMessage({ role: 'user', content: transcription });
      setTranscription('');
    }
  };

  return (
    <Container>
      <Title>Reconhecimento de Fala em Tempo Real</Title>
      <Select value={language} onChange={handleLanguageChange}>
        <option value="pt-BR">Português (Brasil)</option>
        <option value="en-US">Inglês (EUA)</option>
        <option value="es-ES">Espanhol (Espanha)</option>
        <option value="fr-FR">Francês (França)</option>
        <option value="de-DE">Alemão (Alemanha)</option>
      </Select>
      <Button onClick={toggleListening}>
        {isListening ? 'Parar Gravação' : 'Iniciar Gravação'}
      </Button>
      <Button as="label" htmlFor="file-upload">
        Selecionar Arquivo de Áudio
      </Button>
      <FileInput id="file-upload" type="file" accept="audio/mp3" onChange={handleFileChange} />
      {isLoading ? (
        <Spinner />
      ) : (
        <TranscriptionBox>
          {transcription ? transcription : 'Inicie a gravação para ver o texto aqui...'}
        </TranscriptionBox>
      )}
      {!isListening && transcription && (
        <Button onClick={sendToChat}>Enviar para o Chat</Button>
      )}
    </Container>
  );
};

export default MP3ToText;
