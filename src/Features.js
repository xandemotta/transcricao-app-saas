import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
`;

const FeatureList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const FeatureItem = styled.li`
  font-size: 1.2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  color: #007bff;
  margin-bottom: 0.5rem;
`;

const FeatureDescription = styled.p`
  margin: 0;
  color: #555;
`;

const Features = () => {
  const featureData = [
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
        title: 'Chat inteligente',
        description: 'Nosso chat conta com inteligência artificial gpt4',
    },
    {
        title: 'Banco de dados Seguro',
        description: 'senhas encriptografadas, seus dados seguros',
    }
  ];

  return (
    <Container>
      <h2>Funcionalidades do Aplicativo</h2>
      <FeatureList>
        {featureData.map((feature, index) => (
          <FeatureItem key={index}>
            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
          </FeatureItem>
        ))}
      </FeatureList>
    </Container>
  );
};

export default Features;
