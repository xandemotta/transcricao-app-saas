import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaBars, FaTimes } from 'react-icons/fa'; // Importando os ícones de hambúrguer e X
import Home from './Home';
import MP3ToText from './MP3ToText';
import Login from './Login';
import Chat from './Chat';
import Features from './Features';
import CriarConta from './CriarConta';
import { TranscriptionProvider } from './TranscriptionContext';
import Chat2 from './Chat-2';
import Chat3 from './ChatSelector';
import VideoUpload from './VideoUpload'; // Importando o componente de upload de vídeo

const AppContainer = styled.div`
  margin: 0;
  padding: 0;
  height: 100vh;
  display: flex;
  overflow-y: auto;
  position: relative;

  ::-webkit-scrollbar {
    width: 0;
    background: transparent;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const Sidebar = styled.div`
  width: 250px;
  background-color: #007bff;
  color: white;
  padding: 1rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  transform: ${(props) => (props.open ? 'translateX(0)' : 'translateX(-100%)')};
  transition: transform 1s ease;  /* Desliza para a esquerda em 1 segundo */
  z-index: 20;

  @media (min-width: 769px) {
    position: sticky;
    transform: translateX(0); /* Sempre visível em telas maiores */
    display: flex;
  }
`;

const Overlay = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: ${(props) => (props.show ? 'block' : 'none')};
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5); /* Fundo escurecido */
    z-index: 15;
  }
`;

const MenuButton = styled.button`
  display: none;
  position: fixed; /* Mudança de absolute para fixed */
  top: 1rem;
  left: 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  z-index: 30;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Content = styled.div`
  flex-grow: 1;
  padding: 2rem;
  background-color: #f5f5f5;
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 600px;

  @media (max-width: 768px) {
    min-width: 100%;
    padding: 1rem;
    margin-left: 0; /* Remove qualquer margem adicional */
  }
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
  const [menuOpen, setMenuOpen] = useState(false); // Estado para controlar o menu
  const userId = 1; // Substitua isso pela lógica real de recuperação de ID de usuário

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

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <Router>
      <AppContainer>
        {authToken ? (
          <>
            <MenuButton onClick={toggleMenu}>
              {menuOpen ? <FaTimes /> : <FaBars />} {/* Troca entre FaBars e FaTimes */}
            </MenuButton>
            <Overlay show={menuOpen} onClick={toggleMenu} />
            <Sidebar open={menuOpen}>
              <h1>Menu</h1>
              <NavLink to="/" onClick={toggleMenu}>Home</NavLink>
              <NavLink to="/mp3-to-text" onClick={toggleMenu}>MP3 para Texto</NavLink>
              <NavLink to="/features" onClick={toggleMenu}>Features</NavLink>
              <NavLink to="/chat-2" onClick={toggleMenu}>Chat 2</NavLink>
              <NavLink to="/upload-video" onClick={toggleMenu}>Upload de Vídeo</NavLink>
              <NavLink to="/criar-conta" onClick={toggleMenu}>Criar Conta</NavLink>
              <button onClick={() => {
                handleLogout();
                toggleMenu();
              }}>Logout</button>
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
                    path="/features" 
                    element={<Features />} 
                  />
                  <Route 
                    path="/chat-2" 
                    element={<Chat2 messages={messages} addMessage={addMessage} token={authToken} />} 
                  />
                  <Route 
                    path="/chat-3" 
                    element={<Chat3 userId={userId} addMessage={addMessage} token={authToken} />} 
                  />
                  <Route 
                    path="/upload-video" 
                    element={<VideoUpload token={authToken} />} 
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
