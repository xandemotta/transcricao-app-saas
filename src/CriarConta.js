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
  background-color: #28a745;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  &:hover {
    background-color: #218838;
  }
`;

const CriarConta = () => {
  const [clienteId, setClienteId] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [error, setError] = useState('');

  const handleCreateAccount = async () => {
    if (senha !== confirmSenha) {
      setError('As senhas não coincidem');
      return;
    }

    try {
        const response = await fetch('http://localhost:5002/criar-conta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cliente_id: clienteId, senha })
        });
      
        if (!response.ok) throw new Error('Erro ao criar conta');
      
        const data = await response.json();
        // Lógica de sucesso, como redirecionar para a página de login
      } catch (error) {
        setError(error.message);
      }
      
  };

  return (
    <Container>
      <h2>Criar Conta</h2>
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
      <Input
        type="password"
        placeholder="Confirmar Senha"
        value={confirmSenha}
        onChange={(e) => setConfirmSenha(e.target.value)}
      />
      <Button onClick={handleCreateAccount}>Criar Conta</Button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </Container>
  );
};

export default CriarConta;
