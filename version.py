from flask import Flask, render_template, Response, request, jsonify
from flask_cors import CORS
import pyaudio
from google.cloud import speech_v1p1beta1 as speech
import io
import speech_recognition as sr


app = Flask(__name__)
CORS(app)  # Permite requisições de diferentes origens

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
    return render_template('index.html')

@app.route('/stream')
def stream():
    client = speech.SpeechClient()
    streaming_config = speech.StreamingRecognitionConfig(
        config=speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="pt-BR",  # Ajuste para o idioma desejado
        ),
        interim_results=True,
    )

    requests = (speech.StreamingRecognizeRequest(audio_content=chunk) for chunk in generate_audio_stream())
    responses = client.streaming_recognize(streaming_config, requests)

    def generate():
        try:
            for response in responses:
                for result in response.results:
                    transcript = result.alternatives[0].transcript
                    yield f"data: {transcript}\n\n"
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

if __name__ == "__main__":
    app.run(debug=True)
