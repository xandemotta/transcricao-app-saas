const express = require('express');
const sequelize = require('./src/config/database');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const Transcription = require('./src/models/Transcription');
const Conversa = require('./src/models/Conversas');
const fs = require('fs');
const { SpeechClient } = require('@google-cloud/speech');
const path = require('path');
const morgan = require('morgan');
const fileType = require('file-type');
const stream = require('stream');
const wav = require('node-wav');
const axios = require('axios');
const User = require('./src/models/User');
const cron = require('node-cron');
const { google } = require('googleapis');

require('dotenv').config();
const OpenAI = require('openai');

// Inicialização do cliente OpenAI com a chave da API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const upload = multer();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

const client = new SpeechClient();
const conversations = {};  // Armazena as sessões de conversa na memória

// YouTube API setup (requires OAuth 2.0 setup)
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

// Rota para agendar upload de vídeos
// Rota para agendar upload de múltiplos vídeos
app.post('/api/schedule-upload', upload.array('files'), async (req, res) => {
  const titles = req.body['titles[]'];
  const descriptions = req.body['descriptions[]'];
  const uploadDates = req.body['uploadDates[]'];

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const schedules = [];

  req.files.forEach((file, index) => {
    const filePath = path.join(__dirname, 'uploads', file.filename);
    const schedule = {
      title: titles[index],
      description: descriptions[index],
      filePath: filePath,
      uploadDate: uploadDates[index],
    };
    fs.writeFileSync(`schedules/${uploadDates[index]}_${file.originalname}.json`, JSON.stringify(schedule));
    schedules.push(schedule);

    // Schedule the upload
    cron.schedule('0 0 * * *', () => {
      const today = format(new Date(), 'dd/MM/yyyy');
      if (today === schedule.uploadDate) {
        uploadToYouTube(schedule);
      }
    });
  });

  res.json({ message: 'Uploads agendados com sucesso!', schedules });
});

// Função para realizar o upload para o YouTube
const uploadToYouTube = async (schedule) => {
  try {
    const videoPath = schedule.filePath;
    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: schedule.title,
          description: schedule.description,
          tags: ['tutorial', 'example'],
          categoryId: '22', // Categoria "People & Blogs"
        },
        status: {
          privacyStatus: 'public',
        },
      },
      media: {
        body: fs.createReadStream(videoPath),
      },
    });

    console.log('Upload concluído:', response.data);
  } catch (error) {
    console.error('Erro ao realizar o upload:', error);
  }
};

// Resto do código existente do backend
app.post('/api/chat', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || req.body.userId;
    const message = req.body.message;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID ou User ID não fornecido' });
    }

    if (!conversations[sessionId]) {
      conversations[sessionId] = {
        history: [],
        messageCount: 1
      };
    }

    const conversation = conversations[sessionId];
    conversation.history.push({ number: conversation.messageCount, role: "user", content: message });
    conversation.messageCount++;

    let fullResponse = '';
    let done = false;

    while (!done) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-4",
          messages: [
            { role: "system", content: "Você é um assistente que responde conforme o histórico de mensagens." },
            ...conversation.history.map(msg => ({ role: msg.role, content: msg.content }))
          ],
          temperature: 0.7,
          max_tokens: 426,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          }
        }
      );

      const assistantResponse = response.data.choices[0].message.content;

      fullResponse += assistantResponse;

      if (assistantResponse.endsWith('.') || response.data.choices[0].finish_reason === 'stop') {
        done = true;
      } else {
        conversation.history.push({ number: conversation.messageCount, role: "assistant", content: assistantResponse });
        conversation.messageCount++;
      }
    }

    conversation.history.push({ number: conversation.messageCount, role: "assistant", content: fullResponse });
    conversation.messageCount++;

    await Conversa.create({
      userId: req.body.userId,
      mensagemUsuario: message,
      mensagemAssistente: fullResponse
    });

    res.json({ message: fullResponse, continue: !done });
  } catch (error) {
    console.error('Erro ao comunicar com a API da OpenAI:', error.message);
    res.status(500).send('Erro ao comunicar com a API da OpenAI');
  }
});

app.post('/api/continue', async (req, res) => {
  try {
    const sessionId = req.body.sessionId;

    if (!sessionId || !conversations[sessionId]) {
      return res.status(400).json({ error: 'Session ID inválido ou não encontrado' });
    }

    const conversation = conversations[sessionId];

    let fullResponse = '';
    let done = false;

    while (!done) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-4",
          messages: [
            { role: "system", content: "Você é um assistente que responde conforme o histórico de mensagens." },
            ...conversation.history.map(msg => ({ role: msg.role, content: msg.content }))
          ],
          temperature: 0.7,
          max_tokens: 426,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          }
        }
      );

      const assistantResponse = response.data.choices[0].message.content;

      fullResponse += assistantResponse;

      if (assistantResponse.endsWith('.') || response.data.choices[0].finish_reason === 'stop') {
        done = true;
      } else {
        conversation.history.push({ number: conversation.messageCount, role: "assistant", content: assistantResponse });
        conversation.messageCount++;
      }
    }

    conversation.history.push({ number: conversation.messageCount, role: "assistant", content: fullResponse });
    conversation.messageCount++;

    res.json({ message: fullResponse, continue: !done });
  } catch (error) {
    console.error('Erro ao continuar a geração:', error.message);
    res.status(500).send('Erro ao continuar a geração');
  }
});

app.get('/api/conversas/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Buscando conversas para o userId:", userId); // Log para verificar o userId
    const conversas = await Conversa.findAll({ where: { userId: userId } });
    console.log("Conversas encontradas:", conversas); // Log para verificar o retorno do banco de dados
    res.json({ conversas });
  } catch (error) {
    console.error('Erro ao buscar conversas:', error.message);
    res.status(500).send('Erro ao buscar conversas');
  }
});

app.post('/api/conversas', async (req, res) => {
  // Este endpoint pode ser usado para outras operações, mas não fará inserções no banco de dados para evitar duplicação.
  res.status(201).json({ message: 'Operação de conversa processada com sucesso.' });
});

app.delete('/api/conversas/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID não fornecido' });
    }

    // Deleta todas as conversas associadas ao userId
    await Conversa.destroy({ where: { userId } });

    res.status(200).json({ message: 'Histórico de conversas deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar o histórico de conversas:', error.message);
    res.status(500).send('Erro ao deletar o histórico de conversas');
  }
});

// Funções para transcrição de áudio e manipulação de arquivos
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
        languageCode: 'pt-BR',
      },
    };

    const [response] = await client.recognize(request);

    if (response.results && response.results.length > 0) {
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      return transcription.trim();
    } else {
      return '';
    }
  } catch (error) {
    console.error('Erro na transcrição:', error.message);
    throw new Error('Erro na transcrição do áudio.');
  }
}

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

    if (!transcriptionText) {
      return res.status(500).json({ error: 'Falha ao gerar a transcrição.' });
    }

    const transcription = await Transcription.create({ text: transcriptionText });
    res.json({ transcription: transcription.text });
  } catch (error) {
    console.error(`Erro ao processar o áudio: ${error.message}`);
    res.status(500).json({ error: `Erro ao processar o áudio: ${error.message}` });
  }
});

app.post('/criar-conta', async (req, res) => {
  const { cliente_id, senha } = req.body;

  try {
    const usuarioExistente = await User.findOne({ where: { username: cliente_id } });

    if (usuarioExistente) {
      return res.status(400).json({ error: 'O usuário já existe.' });
    }

    const hashSenha = await bcrypt.hash(senha, 10);

    const novoUsuario = await User.create({
      username: cliente_id,
      password_hash: hashSenha,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({ message: 'Conta criada com sucesso.', user: novoUsuario });
  } catch (error) {
    console.error('Erro ao criar a conta:', error);
    res.status(500).json({ error: 'Erro ao criar a conta.' });
  }
});

app.post('/verificar_acesso', async (req, res) => {
  const { cliente_id, senha } = req.body;

  try {
    const user = await User.findOne({ where: { username: cliente_id } });

    if (user && bcrypt.compareSync(senha, user.password_hash)) {
      const token = `token_for_${cliente_id}`;
      res.json({ token, userId: user.id });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error('Erro durante a verificação de acesso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
