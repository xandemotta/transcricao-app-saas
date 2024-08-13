import React, { useState } from 'react';
import ChatSelector from './ChatSelector';
import Chat2 from './Chat2';

function Chat3({ userId }) {
  const [selectedChat, setSelectedChat] = useState(null);

  const handleSelectChat = (conversa) => {
    setSelectedChat(conversa);
  };

  const handleNewChat = () => {
    setSelectedChat(null);
  };

  return (
    <div>
      <ChatSelector userId={userId} onSelectChat={handleSelectChat} />
      {selectedChat !== null ? (
        <Chat2 selectedChat={selectedChat} onNewChat={handleNewChat} />
      ) : (
        <Chat2 selectedChat={null} onNewChat={handleNewChat} />
      )}
    </div>
  );
}

export default Chat3;
