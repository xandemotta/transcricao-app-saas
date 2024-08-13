import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import styled from 'styled-components';
import Home from './Home';
import MP3ToText from './MP3ToText';
import Login from './Login';
import Chat from './Chat';
import Features from './Features';
import CriarConta from './CriarConta';
import { TranscriptionProvider } from './TranscriptionContext';
import Chat2 from './Chat-2';

const AppContainer = styled.div`
  display: flex;
`;

const Sidebar = styled.div`
  width: 250px;
  background-color: #007bff;
  color: white;
  padding: 1rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: #f5f5f5;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 0.5rem;
  display: block;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  &:hover {
    background-color: #0056b3;
  }
`;

const App = () => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || '');
  const [messages, setMessages] = useState([]);
  
  const handleLogin = (token) => {
    setAuthToken(token);
    localStorage.setItem('authToken', token);
  };

  const handleLogout = () => {
    setAuthToken('');
    localStorage.removeItem('authToken');
    setMessages([]); // Limpa as mensagens ao fazer logout
  };

  const addMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  return (
    <Router>
      <AppContainer>
        {authToken ? (
          <>
            <Sidebar>
              <h1>Menu</h1>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/mp3-to-text">MP3 para Texto</NavLink>
              <NavLink to="/chat">Chat</NavLink>
              <NavLink to="/features">Featuress</NavLink>
              <NavLink to="/chat-2">Chat 2</NavLink>
              <NavLink to="/criar-conta">Criar Conta</NavLink>
              <button onClick={handleLogout}>Logout</button>
            </Sidebar>
            <Content>
              <TranscriptionProvider>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route 
                    path="/mp3-to-text" 
                    element={<MP3ToText addMessage={addMessage} token={authToken} />} 
                  />
                  <Route 
                    path="/chat" 
                    element={<Chat messages={messages} addMessage={addMessage} token={authToken} />} 
                  />
                  <Route 
                    path="/features" 
                    element={<Features messages={messages} addMessage={addMessage} token={authToken} />} 
                  />
                  <Route 
                    path="/chat-2" 
                    element={<Chat2 messages={messages} addMessage={addMessage} token={authToken} />} 
                  />
                  <Route path="/criar-conta" element={<CriarConta />} />
                </Routes>
              </TranscriptionProvider>
            </Content>
          </>
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </AppContainer>
    </Router>
  );
};

export default App;
