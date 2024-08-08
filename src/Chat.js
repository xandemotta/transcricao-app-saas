import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import TranscriptionContext from './TranscriptionContext';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f5f5;
`;

const ChatDisplay = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background-color: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 8px;
`;

const InputContainer = styled.div`
  display: flex;
  padding: 0.5rem;
  background-color: #eeeeee;
  border-top: 1px solid #dddddd;
`;

const InputField = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #cccccc;
  border-radius: 4px;
  margin-right: 0.5rem;
`;

const SendButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: #0056b3;
  }
`;

const Chat = ({ messages, setMessages }) => {
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { transcription, setTranscription } = useContext(TranscriptionContext);

  const apiKey = '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';

  const handleSendMessage = async (messageContent) => {
    const newMessages = [...messages, { role: 'user', content: messageContent }];
    setMessages(newMessages);
    setUserInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [{ role: 'user', content: messageContent }],
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
        setMessages([...newMessages, { role: 'assistant', content: reply }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'Desculpe, não consegui entender a resposta.' }]);
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
          <div key={index} style={{ marginBottom: '1rem' }}>
            <strong>{msg.role === 'user' ? 'Você' : 'Assistente'}:</strong> {msg.content}
          </div>
        ))}
        {loading && <p>Carregando...</p>}
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
