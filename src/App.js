// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import styled from 'styled-components';
import Home from './Home';
import MP3ToText from './MP3ToText';

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

const App = () => (
  <Router>
    <AppContainer>
      <Sidebar>
        <h1>Menu</h1>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/mp3-to-text">MP3 para Texto</NavLink>
      </Sidebar>
      <Content>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mp3-to-text" element={<MP3ToText />} />
        </Routes>
      </Content>
    </AppContainer>
  </Router>
);

export default App;
