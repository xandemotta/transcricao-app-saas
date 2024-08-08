// src/MP3ToText.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

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

const FileInput = styled.input`
  margin-top: 1rem;
`;

const MP3ToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [recognizer, setRecognizer] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [fileTranscription, setFileTranscription] = useState('');

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
  }, []);

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

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
      
      // Upload the file to the backend for transcription
      const formData = new FormData();
      formData.append('audio', file);

      try {
        const response = await fetch('http://localhost:5000/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const result = await response.json();
        setFileTranscription(result.transcription);
      } catch (error) {
        console.error('Error uploading file:', error);
        setFileTranscription('Erro ao processar o arquivo de áudio.');
      }
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

      <h2>Converter Arquivo de Áudio para Texto</h2>
      <FileInput type="file" accept="audio/*" onChange={handleFileChange} />
      <TranscriptionBox>
        {fileTranscription || 'Selecione um arquivo de áudio para transcrição...'}
      </TranscriptionBox>
    </Container>
  );
};

export default MP3ToText;
