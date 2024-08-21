import React from 'react';
import styled from 'styled-components';
import { FaStar } from 'react-icons/fa'; // Ícone de estrela

// Container principal com overflow ajustado
const Container = styled.div`
  padding: 2rem;
  background-color: #f8f9fa;
  max-width: 1200px; /* Define uma largura máxima para o conteúdo */
  margin: 0 auto; /* Centraliza o conteúdo */
`;

// Lista de funcionalidades como um contêiner grid para melhor alinhamento
const FeatureList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Configuração da grid responsiva */
  gap: 2rem; /* Espaçamento entre os cards */
  justify-items: center; /* Centraliza os itens dentro da grid */
`;

// Estilização de cada item de funcionalidade
const FeatureItem = styled.div`
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-5px); /* Efeito de elevação ao passar o mouse */
  }
`;

// Estilização do título de cada funcionalidade
const FeatureTitle = styled.h3`
  font-size: 1.8rem;
  color: #007bff;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
`;

// Estilização da descrição de cada funcionalidade
const FeatureDescription = styled.p`
  margin: 0;
  color: #555;
  line-height: 1.6;
`;

// Estilização do rótulo "NEW"
const NewBadge = styled.span`
  background-color: #28a745;
  color: #fff;
  padding: 0.3rem 0.6rem;
  border-radius: 5px;
  font-size: 0.9rem;
  margin-left: 10px;
  display: flex;
  align-items: center;
`;

const Features = () => {
  const featureData = [
    {
      title: 'Agendamento de Upload de Vídeos Unificado',
      description: 'Faça as postagens de seus vídeos em sua plataforma favorita com poucos cliques.',
      isNew: true,
    },
    {
      title: 'Chat 2.0',
      description: 'Cada usuário registrado tem seu próprio histórico do chat, com mensagens salvas. Basta usar o chat e relogar para ver, as mensagens vão continuar lá, permitindo retomar o contexto de um chat inteligente seu, de outro dia, a qualquer instante.',
      isNew: true,
    },
    {
      title: 'Criar Conta',
      description: 'Agora os usuários podem criar suas próprias contas no nosso banco de dados.',
      isNew: true,
    },
    {
      title: 'Reconhecimento de Fala em Tempo Real',
      description: 'Converta fala em texto em tempo real usando a API de Reconhecimento de Fala do navegador.',
    },
    {
      title: 'Upload de Arquivo para Transcrição',
      description: 'Faça upload de arquivos MP3 e obtenha a transcrição em texto.',
    },
    {
      title: 'Enviar Transcrição para o Chat',
      description: 'Envie facilmente seu texto transcrito para uma interface de chat.',
    },
    {
      title: 'Chat Inteligente',
      description: 'Nosso chat conta com inteligência artificial GPT-4.',
    },
    {
      title: 'Banco de Dados Seguro',
      description: 'Senhas criptografadas, seus dados estão seguros.',
    }
  ];

  return (
    <Container>
      <h2>Funcionalidades do Aplicativo</h2>
      <FeatureList>
        {featureData.map((feature, index) => (
          <FeatureItem key={index}>
            <FeatureTitle>
              {feature.title}
              {feature.isNew && (
                <NewBadge>
                  <FaStar style={{ marginRight: '5px' }} />
                  NEW
                </NewBadge>
              )}
            </FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
          </FeatureItem>
        ))}
      </FeatureList>
    </Container>
  );
};

export default Features;
