// src/Login.js
import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
`;

const Input = styled.input`
  margin-top: 1rem;
  padding: 0.5rem;
  font-size: 1rem;
  width: 100%;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  font-size: 1rem;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  &:hover {
    background-color: #0056b3;
  }
`;

const Login = ({ onLogin }) => {
  const [clienteId, setClienteId] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5002/verificar_acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: clienteId, senha })
      });

      if (!response.ok) throw new Error('Credenciais inválidass');

      const data = await response.json();
      if (data.token) {
        onLogin(data.token);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Container>
      <h2>Login</h2>
      <Input
        type="text"
        placeholder="Cliente ID"
        value={clienteId}
        onChange={(e) => setClienteId(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />
      <Button onClick={handleLogin}>Login</Button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </Container>
  );
};

export default Login;
