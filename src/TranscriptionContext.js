import React, { createContext, useState } from 'react';

const TranscriptionContext = createContext();

export const TranscriptionProvider = ({ children }) => {
  const [transcription, setTranscription] = useState('');

  return (
    <TranscriptionContext.Provider value={{ transcription, setTranscription }}>
      {children}
    </TranscriptionContext.Provider>
  );
};

export default TranscriptionContext;
