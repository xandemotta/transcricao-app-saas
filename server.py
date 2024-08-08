from flask import Flask, Response, request, jsonify, send_from_directory
from flask_cors import CORS
import pyaudio
import io
import speech_recognition as sr
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)  # Permite requisições de diferentes origens

# Dados fictícios para simulação (normalmente, isso viria de um banco de dados)
USERS = {
    'root': generate_password_hash('root')  # Substitua por armazenamento seguro
}

# Variável global para armazenar mensagens
messages = []

# Endpoint para autenticar o usuário
@app.route('/verificar_acesso', methods=['POST'])
def verificar_acesso():
    data = request.get_json()
    cliente_id = data.get('cliente_id')
    senha = data.get('senha')
    
    if cliente_id in USERS and check_password_hash(USERS[cliente_id], senha):
        token = f'token_for_{cliente_id}'  # Substitua por geração real de tokens
        return jsonify({'token': token}), 200
    else:
        return jsonify({'error': 'Credenciais inválidas'}), 401

# Função para verificar o token
def verificar_token(token):
    return token.startswith('token_for_') and token in [f'token_for_{user}' for user in USERS]

# Endpoint protegido
@app.route('/protegido', methods=['GET'])
def protegido():
    auth_header = request.headers.get('Authorization')
    
    if auth_header and verificar_token(auth_header):
        return jsonify({'message': 'Você tem acesso ao conteúdo protegido!'}), 200
    else:
        return jsonify({'error': 'Acesso negado'}), 403

def generate_audio_stream():
    audio = pyaudio.PyAudio()
    stream = audio.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=16000,
        input=True,
        frames_per_buffer=1024
    )

    try:
        while True:
            audio_data = stream.read(1024)
            yield audio_data
    except Exception as e:
        print(f"Erro ao capturar áudio: {e}")
    finally:
        stream.stop_stream()
        stream.close()
        audio.terminate()

@app.route('/')
def index():
    return send_from_directory('build', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Serve arquivos estáticos da pasta build
    return send_from_directory('build', path)

@app.route('/stream')
def stream():
    def generate():
        try:
            for response in generate_audio_stream():
                # Seu código para processar o áudio em tempo real
                yield f"data: {response}\n\n"
        except Exception as e:
            yield f"data: Erro: {e}\n\n"

    return Response(generate(), mimetype='text/event-stream')

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']

        if audio_file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Ler o conteúdo do arquivo
        audio_content = audio_file.read()
        audio_io = io.BytesIO(audio_content)

        # Usar o reconhecedor de fala
        recognizer = sr.Recognizer()

        with sr.AudioFile(audio_io) as source:
            audio_data = recognizer.record(source)
            transcription = recognizer.recognize_google(audio_data, language='pt-BR')

        return jsonify({'transcription': transcription})

    except sr.UnknownValueError:
        return jsonify({'error': 'Não consegui entender o áudio'}), 500
    except sr.RequestError as e:
        return jsonify({'error': f'Erro na solicitação do serviço de reconhecimento: {e}'}), 500
    except Exception as e:
        print(f"Erro ao processar o áudio: {e}")
        return jsonify({'error': f'Erro ao processar o áudio: {e}'}), 500

@app.route('/api/send-to-chat', methods=['POST'])
def send_to_chat():
    global messages  # Garantir que estamos modificando a variável global
    data = request.get_json()
    message = data.get('message')
    if not message:
        return jsonify({'error': 'No message provided'}), 400
    messages.append({'role': 'user', 'content': message})
    print(f'Message received: {message}')
    return jsonify({'success': True}), 200

@app.route('/api/get-chat-messages', methods=['GET'])
def get_chat_messages():
    global messages  # Garantir que estamos acessando a variável global
    return jsonify({'messages': messages}), 200

@app.errorhandler(404)
def handle_404(error):
    return send_from_directory('build', 'index.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
