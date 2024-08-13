import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ChatSelector({ userId, onSelectChat }) {
  const [conversas, setConversas] = useState([]);

  useEffect(() => {
    const fetchConversas = async () => {
      try {
        const response = await axios.get(`/api/conversas/${userId}`);
        setConversas(response.data.conversas);
      } catch (error) {
        console.error('Erro ao buscar conversas:', error);
      }
    };
    fetchConversas();
  }, [userId]);

  return (
    <div>
      <h3>Selecione uma Conversa</h3>
      <ul>
        {conversas.map((conversa, index) => (
          <li key={index} onClick={() => onSelectChat && onSelectChat(conversa)}>
            Conversa {index + 1}
          </li>
        ))}
      </ul>
      <button onClick={() => onSelectChat && onSelectChat(null)}>Iniciar Nova Conversa</button>
    </div>
  );
}

export default ChatSelector;
