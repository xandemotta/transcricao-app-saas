import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  padding: 2rem;
`;

const Input = styled.input`
  margin-top: 1rem;
  padding: 0.5rem;
  font-size: 1rem;
  width: 100%;
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;  /* Alinha verticalmente os itens */
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  font-size: 1rem;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 1rem;
  &:hover {
    background-color: #0056b3;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  margin-left: 1rem;  /* Margem à esquerda para separar do botão */
  min-width: 200px;   /* Define uma largura mínima para evitar movimento */
  min-height: 24px;   /* Altura mínima para a mensagem de erro */
`;

const Login = ({ onLogin }) => {
  const [clienteId, setClienteId] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
        const response = await fetch('https://c944-143-137-173-27.ngrok-free.app/verificar_acesso', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cliente_id: clienteId, senha })
        });

        if (!response.ok) throw new Error('Credenciais inválidas');

        const data = await response.json();
        if (data.token && data.userId) {
            onLogin(data.token, data.userId);
            localStorage.setItem('authToken', data.token); // Armazena o token no localStorage
            localStorage.setItem('userId', data.userId); // Armazena o userId no localStorage
        }
    } catch (error) {
        setError(error.message);
    }
};


  const handleCreateAccount = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Você precisa estar logado para criar outra conta.');
      return;
    }
    navigate('/criar-conta');
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
      <ButtonContainer>
        <Button onClick={handleLogin}>Login</Button>
        <Button onClick={handleCreateAccount} style={{ backgroundColor: '#28a745' }}>
          Criar Conta
        </Button>
        <ErrorMessage>{error}</ErrorMessage>
      </ButtonContainer>
    </Container>
  );
};

export default Login;
