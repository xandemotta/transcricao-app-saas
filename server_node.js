const express = require('express');
const cors = require('cors'); 
const Transcription = require('./src/models/Transcription');
const sequelize = require('./src/config/database');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const { SpeechClient } = require('@google-cloud/speech');
const path = require('path');
const morgan = require('morgan');
const fileType = require('file-type');
const stream = require('stream');
const wav = require('node-wav'); // Adiciona a dependência para leitura de WAV
const User = require('./src/models/User');



const senha = 'root';
const hash = bcrypt.hashSync(senha, 8); // Gera o hash com um fator de custo 8

console.log('Hash da senha:', hash);


ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const upload = multer();

app.use(cors({
    origin: ['https://7a4c-143-137-173-27.ngrok-free.app', 'http://localhost:5002']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

const client = new SpeechClient();
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
    const senha = 'root'; // A senha que você quer definir
    const hash = bcrypt.hashSync(senha, 8); // Gera o hash da senha

    // Cria o usuário com o hash da senha
    await User.create({
      username: 'root',
      password_hash: hash,
    });

    console.log('Usuário root criado com sucesso.');
  } catch (error) {
    console.error('Erro ao criar o usuário root:', error);
  }
}

// Chame a função ao iniciar o servidor
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

function verificar_token(token) {
  return token.startsWith('token_for_') && Object.keys(USERS).some(user => token === `token_for_${user}`);
}

app.get('/protegido', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && verificar_token(authHeader)) {
    res.json({ message: 'Você tem acesso ao conteúdo protegido!' });
  } else {
    res.status(403).json({ error: 'Acesso negado' });
  }
});

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
  const audioBytes = audioBuffer.toString('base64');

  const result = wav.decode(audioBuffer); // Decodifica o WAV e obtém informações sobre a taxa de amostragem
  const sampleRate = result.sampleRate;

  const request = {
    audio: {
      content: audioBytes,
    },
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: sampleRate, // Use a taxa de amostragem detectada
      languageCode: 'pt-BR',
    },
  };

  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  return transcription;
}

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', req.path));
});

app.listen(5002, () => {
  console.log('Servidor rodando em http://localhost:5002');
});
