import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';

// Reutilizando o Spinner do Chat
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  animation: ${spin} 2s linear infinite;
  align-self: flex-end;
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
  gap: 1rem;

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
  background-color: #c1c1c1;

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

const ClearButton = styled.button`
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  color: white;
  background-color: #dc3545;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  margin-left: 0.5rem;

  &:hover {
    background-color: #c82333;
    transform: translateY(-2px);
  }

  &:active {
    background-color: #bd2130;
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 0.5rem;
  }
`;

function Chat2() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar mensagens do localStorage quando o componente é montado
  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem('chatMessages'));
    if (storedMessages) {
      setMessages(storedMessages);
    }
  }, []);

  // Salvar mensagens no localStorage sempre que forem atualizadas
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        '/api/chat', 
        { message: input }, 
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      const botMessage = response.data.message;
      setMessages([...messages, userMessage, { role: "assistant", content: botMessage }]);
    } catch (error) {
      console.error('Erro ao se comunicar com o servidor:', error.response ? error.response.data : error.message);
      setError('Erro ao se comunicar com o servidor. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
  };

  return (
    <ChatContainer>
      <ChatDisplay>
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role}>
            <strong>{msg.role === 'user' ? 'Você' : 'GPT'}:</strong> {msg.content}
          </Message>
        ))}
        {loading && <Spinner />}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </ChatDisplay>
      <InputContainer>
        <InputField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <SendButton onClick={sendMessage}>Enviar</SendButton>
        <ClearButton onClick={clearMessages}>Limpar Histórico</ClearButton>
      </InputContainer>
    </ChatContainer>
  );
}

export default Chat2;
