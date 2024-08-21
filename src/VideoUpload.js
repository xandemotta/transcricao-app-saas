import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

// Definição do tema de cores e fonte
const theme = {
  primaryColor: '#007bff',
  secondaryColor: '#0056b3',
  backgroundColor: '#f7f9fc',
  textColor: '#333',
  borderColor: '#ccc',
  borderRadius: '8px',
  font: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  cardBackgroundColor: '#2196f3',  // Azul mais forte
  cardTextColor: '#fff'  // Texto branco para destacar no fundo azul
};

// Container principal
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background-color: ${theme.backgroundColor};
  min-height: 100vh;
  font-family: ${theme.font};
`;

// Título principal
const Title = styled.h1`
  margin-bottom: 20px;
  color: ${theme.textColor};
  font-size: 24px;
`;

// Estilização do formulário
const Form = styled.form`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// Estilização dos cards
const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  width: 100%;
`;

const Card = styled.div`
  background-color: ${theme.cardBackgroundColor};
  color: ${theme.cardTextColor};
  padding: 20px;
  border-radius: ${theme.borderRadius};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 10px; /* Espaçamento entre os elementos */
`;

// Estilização do título dentro dos cards
const CardTitle = styled.h4`
  margin: 0;
  font-size: 18px;
  color: ${theme.cardTextColor};
`;

// Estilização dos inputs e textarea
const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid ${theme.borderColor};
  border-radius: ${theme.borderRadius};
  font-size: 16px;
  color: ${theme.textColor};
  box-sizing: border-box;

  &:focus {
    border-color: ${theme.primaryColor};
    outline: none;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid ${theme.borderColor};
  border-radius: ${theme.borderRadius};
  font-size: 16px;
  color: ${theme.textColor};
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;

  &:focus {
    border-color: ${theme.primaryColor};
    outline: none;
  }
`;

// Estilização do botão de envio
const Button = styled.button`
  padding: 12px;
  background-color: ${theme.primaryColor};
  color: white;
  border: none;
  border-radius: ${theme.borderRadius};
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 20px;
  width: 100%;

  &:hover {
    background-color: ${theme.secondaryColor};
  }
`;

// Estilização do botão de escolher arquivos
const FileInput = styled.label`
  padding: 12px 20px;
  background-color: ${theme.primaryColor};
  color: white;
  border-radius: ${theme.borderRadius};
  cursor: pointer;
  font-size: 16px;
  display: inline-block;
  margin-bottom: 20px;
  text-align: center;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${theme.secondaryColor};
  }

  input {
    display: none;
  }
`;

// Componente principal de upload de vídeos
const VideoUpload = () => {
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoData, setVideoData] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setVideoFiles(files);
    setVideoData(files.map(() => ({ title: '', description: '', uploadDate: '' })));
  };

  const handleTitleChange = (index, value) => {
    const newVideoData = [...videoData];
    newVideoData[index].title = value;
    setVideoData(newVideoData);
  };

  const handleDescriptionChange = (index, value) => {
    const newVideoData = [...videoData];
    newVideoData[index].description = value;
    setVideoData(newVideoData);
  };

  const handleDateChange = (index, value) => {
    const newVideoData = [...videoData];
    newVideoData[index].uploadDate = value;
    setVideoData(newVideoData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (videoFiles.length === 0) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    const formData = new FormData();
    videoFiles.forEach((file, index) => {
      formData.append('files', file);
      formData.append(`titles[${index}]`, videoData[index].title);
      formData.append(`descriptions[${index}]`, videoData[index].description);
      formData.append(`uploadDates[${index}]`, videoData[index].uploadDate);
    });

    try {
      const response = await axios.post('/api/schedule-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Uploads agendados com sucesso!');
    } catch (error) {
      console.error('Erro ao agendar upload:', error);
      alert('Erro ao agendar upload.');
    }
  };

  return (
    <Container>
      <Title>Agendamento de Upload de videos para Youtube</Title>
      <Form onSubmit={handleSubmit}>
        <FileInput>
          Escolher Arquivos
          <input type="file" accept="video/*" multiple onChange={handleFileChange} />
        </FileInput>
        <CardGrid>
          {videoFiles.map((file, index) => (
            <Card key={index}>
              <CardTitle>Configurações para: {file.name}</CardTitle>
              <Input
                type="text"
                placeholder={`Título para ${file.name}`}
                value={videoData[index]?.title || ''}
                onChange={(e) => handleTitleChange(index, e.target.value)}
              />
              <Textarea
                placeholder={`Descrição para ${file.name}`}
                value={videoData[index]?.description || ''}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
              />
              <Input
                type="date"
                value={videoData[index]?.uploadDate || ''}
                onChange={(e) => handleDateChange(index, e.target.value)}
              />
            </Card>
          ))}
        </CardGrid>
        <Button type="submit">Agendar Upload</Button>
      </Form>
    </Container>
  );
};

export default VideoUpload;
