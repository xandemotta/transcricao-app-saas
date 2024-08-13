import React, { useState, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import TranscriptionContext from './TranscriptionContext';

// Reutilizando o Spinner de MP3ToText.js
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3; /* Light grey */
  border-top: 4px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 25px;
  height: 25px;
  animation: ${spin} 2s linear infinite;
  align-self: flex-end; /* Alinha à direita */
  margin: 0.5rem 0;
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 100%;
  background-color: #f4f4f9;
`;

const ChatDisplay = styled.div`
  flex: 1;
  padding: 1rem 1.5rem;
  overflow-y: auto;
  background-color: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 8px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;  /* Espaçamento entre mensagens */

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const Message = styled.div`
  max-width: 60%;
  padding: 0.8rem 1.2rem;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  display: inline-block;
  background-color: #c1c1c1;  /* Cor dos balões */

  ${({ role }) =>
    role === 'user'
      ? `
        align-self: flex-start;
        &::after {
          content: '';
          position: absolute;
          left: -10px;
          top: 10px;
          width: 0;
          height: 0;
          border-top: 10px solid transparent;
          border-bottom: 10px solid transparent;
          border-right: 10px solid #e0e0e0;
        }
      `
      : `
        align-self: flex-end;
        &::after {
          content: '';
          position: absolute;
          right: -10px;
          top: 10px;
          width: 0;
          height: 0;
          border-top: 10px solid transparent;
          border-bottom: 10px solid transparent;
          border-left: 10px solid #e0e0e0;
        }
      `}

  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  }
`;

const InputContainer = styled.div`
  display: flex;
  padding: 1rem;
  background-color: #ffffff;
  border-top: 1px solid #dddddd;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 0.5rem;
  }
`;

const InputField = styled.input`
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #cccccc;
  border-radius: 20px;
  margin-right: 1rem;
  font-size: 1rem;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);

  &:focus {
    outline: none;
    border-color: #007bff;
  }

  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
`;

const SendButton = styled.button`
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  margin-left: 0.5rem;

  &:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
  }

  &:active {
    background-color: #004494;
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 0.5rem;
  }
`;

const Chat = ({ messages, setMessages }) => {
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { transcription, setTranscription } = useContext(TranscriptionContext);

  const apiKey = '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';
  const handleSendMessage = async (messageContent) => {
    if (!messageContent) return;
  
    const newMessages = [...messages, { role: 'user', content: messageContent }];
    setMessages(newMessages);
    setUserInput('');
    setLoading(true);
    setError(null);
  
    try {
      // Enviar todas as mensagens para manter o contexto
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: newMessages,  // Envia o histórico completo
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (response.data.choices && response.data.choices.length > 0) {
        const reply = response.data.choices[0].message.content;
        setMessages((prevMessages) => [...prevMessages, { role: 'assistant', content: reply }]);
      } else {
        setMessages((prevMessages) => [...prevMessages, { role: 'assistant', content: 'Desculpe, não consegui entender a resposta.' }]);
      }
    } catch (error) {
      console.error('Error communicating with ChatGPT:', error.response ? error.response.data : error.message);
      setError('Ocorreu um erro ao se comunicar com o ChatGPT. Por favor, verifique sua chave de API e tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleSendTranscription = () => {
    if (transcription.trim()) {
      handleSendMessage(transcription.trim());
      setTranscription(''); // Limpar a transcrição após o envio
    }
  };

  return (
    <ChatContainer>
      <ChatDisplay>
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role}>
            <strong>{msg.role === 'user' ? 'Você' : 'Assistente'}:</strong> {msg.content}
          </Message>
        ))}
        {loading && <Spinner />}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </ChatDisplay>
      <InputContainer>
        <InputField
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Digite sua mensagem..."
        />
        <SendButton onClick={() => handleSendMessage(userInput.trim())}>Enviar</SendButton>
        <SendButton onClick={handleSendTranscription}>Enviar Transcrição</SendButton>
      </InputContainer>
    </ChatContainer>
  );
};

export default Chat;
