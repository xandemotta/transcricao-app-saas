const express = require('express');
const sequelize = require('./src/config/database');
const bcrypt = require('bcryptjs');
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
const User = require('./src/models/User');


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
let conversations = {};  // Armazena o histórico de conversas por ID de sessão

app.post('/api/chat', async (req, res) => {
  const sessionId = req.body.sessionId || 'default';  // Identifica a sessão do usuário
  const message = req.body.message;

  if (!conversations[sessionId]) {
    conversations[sessionId] = {
      history: [],
      messageCount: 1
    };
  }

  const conversation = conversations[sessionId];

  // Adiciona a nova mensagem do usuário ao histórico
  conversation.history.push({ number: conversation.messageCount, role: "Usuário", content: message });
  conversation.messageCount++;

  // Cria o contexto a ser enviado para a IA
  let context = conversation.history.map(msg => `${msg.number}. ${msg.role}: ${msg.content}`).join("\n");

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
  conversation.history.push({ number: conversation.messageCount, role: "Assistente", content: assistantResponse });
  conversation.messageCount++;

  // Retorna a resposta para o frontend
  res.json({ message: assistantResponse });
});

// Limpa o histórico da sessão
app.post('/api/clear-chat', (req, res) => {
  const sessionId = req.body.sessionId || 'default';
  delete conversations[sessionId];
  res.json({ success: true });
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

// Sincronizar os modelos com o banco de dados
sequelize.sync({ force: false })
  .then(() => {
    console.log('Tabelas sincronizadas com sucesso.');
  })
  .catch(err => {
    console.error('Erro ao sincronizar tabelas:', err);
  });

const USERS = {
  'root': bcrypt.hashSync('root', 8) 
};

async function criarUsuarioRoot() {
  try {
    const usuarioExistente = await User.findOne({ where: { username: 'root' } });

    if (usuarioExistente) {
      console.log('O usuário "root" já existe.');
      return;
    }

    const usuarioRoot = await User.create({
      username: 'root',
      password_hash: 'hash_senha', // Coloque aqui o hash da senha
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Usuário "root" criado com sucesso:', usuarioRoot);
  } catch (error) {
    console.error('Erro ao criar o usuário root:', error);
  }
}

criarUsuarioRoot();

app.post('/verificar_acesso', async (req, res) => {
  const { cliente_id, senha } = req.body;

  try {
    // Buscando o usuário no banco de dados
    const user = await User.findOne({ where: { username: cliente_id } });

    if (user && bcrypt.compareSync(senha, user.password_hash)) {
      // Senha correta
      const token = `token_for_${cliente_id}`;
      res.json({ token });
    } else {
      // Senha incorreta
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error('Erro durante a verificação de acesso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
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
let messages = [];

app.post('/api/send-to-chat', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }
  messages.push({ role: 'user', content: message });
  console.log(`Message received: ${message}`);
  res.json({ success: true });
});

app.get('/api/get-chat-messages', (req, res) => {
  res.json({ messages });
});
app.post('/criar-conta', async (req, res) => {
  const { cliente_id, senha } = req.body;

  try {
    // Verifica se o usuário já existe
    const usuarioExistente = await User.findOne({ where: { username: cliente_id } });

    if (usuarioExistente) {
      return res.status(400).json({ error: 'O usuário já existe.' });
    }

    // Gera o hash da senha
    const hashSenha = await bcrypt.hash(senha, 10);

    // Cria o novo usuário
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
