import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  background-color: #f4f4f9;
  border-radius: 10px;
  max-width: 600px;
  margin: auto;
`;

const FileInput = styled.input`
  margin-bottom: 1rem;
`;

const TitleInput = styled.input`
  margin-bottom: 1rem;
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 5px;
  border: 1px solid #ccc;
`;

const DescriptionInput = styled.textarea`
  margin-bottom: 1rem;
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 5px;
  border: 1px solid #ccc;
`;

const ScheduleButton = styled.button`
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  margin-left: 0.5rem;

  &:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
  }

  &:active {
    background-color: #004494;
    transform: translateY(0);
  }
`;

const VideosTo = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadDate, setUploadDate] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const fileName = selectedFile.name.split('.')[0];
      const [date, ...titleParts] = fileName.split('_');
      setUploadDate(date);
      setTitle(titleParts.join(' '));
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !uploadDate) {
      alert('Todos os campos são necessários.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('uploadDate', uploadDate);

      await axios.post('/api/schedule-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Vídeo agendado com sucesso!');
    } catch (error) {
      console.error('Erro ao agendar o upload do vídeo:', error);
      alert('Erro ao agendar o upload do vídeo.');
    }
  };

  return (
    <UploadContainer>
      <h2>Agendar Upload de Vídeo</h2>
      <FileInput type="file" accept="video/*" onChange={handleFileChange} />
      <TitleInput
        type="text"
        placeholder="Título do vídeo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <DescriptionInput
        rows="5"
        placeholder="Descrição do vídeo"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <ScheduleButton onClick={handleUpload}>Agendar Upload</ScheduleButton>
    </UploadContainer>
  );
};

export default VideosTo;
