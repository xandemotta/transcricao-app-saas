const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const Transcription = require('./src/models/Transcription');
const fs = require('fs');
const { SpeechClient } = require('@google-cloud/speech');
const path = require('path');
const morgan = require('morgan');
const fileType = require('file-type');
const stream = require('stream');
const wav = require('node-wav');
const axios = require('axios');

require('dotenv').config();
const OpenAI = require('openai'); // Use require em vez de import

// Inicialização do cliente OpenAI com a chave da API
const openai = new OpenAI({
  organization: "org-EMMNBjUzGgIFF6nILZ5A0MHc",
  project: "proj_sDfWqBecUcIe7POcT3gJr9PR",
  apiKey: process.env.OPENAI_API_KEY,  // Certifique-se de que a variável de ambiente OPENAI_API_KEY está configurada corretamente
});

async function generateResponse() {
  try {
    // Criação de uma conclusão de chat com o modelo GPT-4
    const response = await openai.chat.completions.create({
      model: "gpt-4",  // Ajuste o modelo para "gpt-4" ou "gpt-4-turbo" conforme necessário
      messages: [
        {
          role: "system",
          content: "Você é um especialista de programação, fullstack.",  // Definindo o contexto do assistente
        },
      ],
      temperature: 1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // Exibindo a resposta no console
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Erro ao gerar a resposta:', error.message);
  }
}

// Executa a função para gerar uma resposta
//generateResponse();


ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const upload = multer();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

const client = new SpeechClient();
// server.js
let conversationHistory = [];  // Armazena o histórico completo da conversa como um array de objetos
let messageCount = 1;  // Contador para enumerar as mensagens

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // Adiciona a nova mensagem do usuário ao histórico
    conversationHistory.push({ number: messageCount, role: "Usuário", content: message });
    messageCount++;

    // Cria o contexto a ser enviado para a IA
    let context = conversationHistory.map(msg => `${msg.number}. ${msg.role}: ${msg.content}`).join("\n");

    // Chama a API da OpenAI com o histórico completo
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4",
        messages: [
          { role: "system", content: "Você é um assistente que responde conforme o histórico de mensagens." },
          { role: "user", content: context }
        ],
        temperature: 0.7,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const assistantResponse = response.data.choices[0].message.content;

    // Adiciona a resposta da IA ao histórico
    conversationHistory.push({ number: messageCount, role: "Assistente", content: assistantResponse });
    messageCount++;

    // Retorna a resposta para o frontend
    res.json({ message: assistantResponse });
  } catch (error) {
    console.error('Erro ao comunicar com a API da OpenAI:', error.message);
    res.status(500).send('Erro ao comunicar com a API da OpenAI');
  }
});

// Converter MP3 para WAV
function convertMp3ToWav(mp3Buffer) {
    return new Promise((resolve, reject) => {
        const tempFilePath = path.join(__dirname, 'temp.wav');
        const bufferStream = new stream.PassThrough();
        bufferStream.end(mp3Buffer);

        ffmpeg(bufferStream)
            .inputFormat('mp3')
            .output(tempFilePath)
            .on('end', () => {
                fs.readFile(tempFilePath, (err, data) => {
                    if (err) return reject(err);
                    fs.unlink(tempFilePath, () => {});
                    resolve(data);
                });
            })
            .on('error', (err) => {
                console.error('Erro no ffmpeg:', err.message);
                reject(new Error('Erro no ffmpeg: ' + err.message));
            })
            .run();
    });
}

// Transcrição de áudio
async function transcribeAudio(audioBuffer) {
  try {
    const audioBytes = audioBuffer.toString('base64');
    const result = wav.decode(audioBuffer);
    const sampleRate = result.sampleRate;

    const request = {
      audio: { content: audioBytes },
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: sampleRate,
        languageCode: 'pt-BR', // Usando o código de idioma que você precisa
      },
    };

    console.log('Enviando solicitação para Google Speech-to-Text API...');

    const [response] = await client.recognize(request);

    console.log('Resposta da API recebida:', response);

    if (response.results && response.results.length > 0) {
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      console.log('Transcrição gerada:', transcription.trim());
      return transcription.trim();
    } else {
      console.error('Nenhum resultado de transcrição disponível.');
      return '';
    }
  } catch (error) {
    console.error('Erro na transcrição:', error.message);
    throw new Error('Erro na transcrição do áudio.');
  }
}





// Rota para transcrição de arquivos
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de áudio fornecido.' });
    }

    const audioBuffer = req.file.buffer;
    const type = await fileType.fromBuffer(audioBuffer);

    let transcriptionText;
    if (type && type.mime === 'audio/wav') {
      transcriptionText = await transcribeAudio(audioBuffer);
    } else if (type && type.mime === 'audio/mpeg') {
      const wavBuffer = await convertMp3ToWav(audioBuffer);
      transcriptionText = await transcribeAudio(wavBuffer);
    } else {
      return res.status(400).json({ error: 'Formato de arquivo não suportado. Envie um arquivo MP3 ou WAV.' });
    }

    // Adicione um log antes de salvar
    if (!transcriptionText) {
      console.error('Transcrição falhou, campo vazio.');
      return res.status(500).json({ error: 'Falha ao gerar a transcrição.' });
    }

    const transcription = await Transcription.create({ text: transcriptionText });
    res.json({ transcription: transcription.text });
  } catch (error) {
    console.error(`Erro ao processar o áudio: ${error.message}`);
    res.status(500).json({ error: `Erro ao processar o áudio: ${error.message}` });
  }
});


// Serve o React app
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', req.path));
});

app.listen(5002, () => {
    console.log('Servidor rodando em http://localhost:5002');
});
