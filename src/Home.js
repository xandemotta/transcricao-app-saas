// src/Home.js
import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
`;

const Home = () => (
  <Container>
    <h2>Bem-vindo à Página Inicial</h2>
    <p>App Xande</p>
  </Container>
);

export default Home;
