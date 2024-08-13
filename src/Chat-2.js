import React, { useState } from 'react';
import axios from 'axios';

function Chat2() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        { message: input },  // Envia apenas a última mensagem do usuário
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

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <b>{msg.role === 'user' ? 'Você: ' : 'GPT: '}</b>{msg.content}
          </div>
        ))}
        {loading && <p>Carregando...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Enviar</button>
    </div>
  );
}

export default Chat2;
