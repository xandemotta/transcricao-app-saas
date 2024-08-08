import tkinter as tk
from tkinter import scrolledtext, font
from openai import OpenAI

# Configurar a API
api_key = "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"
client = OpenAI(api_key=api_key)

# Função para enviar mensagem e obter resposta
def send_message():
    user_input = user_entry.get()
    if user_input.strip() == "":
        return
    
    chat_display.config(state=tk.NORMAL)
    chat_display.insert(tk.END, "Você: " + user_input + "\n", "user")
    
    # Chamada para API do OpenAI usando client.chat.completions.create
    response = client.chat.completions.create(
        messages=[
            {"role": "user", "content": user_input}
        ],
        model="gpt-4",
    )
    
    # Debug: Imprimir a resposta completa
    print(response)  # Adicione isto para verificar a estrutura
    
    # Verificar se a resposta contém 'choices' e extrair o conteúdo
    if response.choices:
        # Acessar o conteúdo da resposta de maneira adequada
        reply = response.choices[0].message.content
        chat_display.insert(tk.END, "Assistente: " + reply + "\n", "assistant")
    else:
        chat_display.insert(tk.END, "Assistente: [Sem resposta]\n", "assistant")
    
    chat_display.config(state=tk.DISABLED)
    chat_display.yview(tk.END)
    user_entry.delete(0, tk.END)

# Configuração da Janela
root = tk.Tk()
root.title("ChatGPT GUI")
root.geometry("600x500")
root.configure(bg="#f5f5f5")

# Definir fonte Poppins
try:
    poppins_font = font.Font(family="Poppins", size=10)
except:
    poppins_font = font.Font(family="Helvetica", size=10)

# Caixa de texto para exibir o chat
chat_display = scrolledtext.ScrolledText(root, wrap=tk.WORD, state='disabled', bg="#ffffff", fg="#333333", font=poppins_font)
chat_display.tag_config("user", foreground="#0066cc", font=poppins_font)
chat_display.tag_config("assistant", foreground="#cc6600", font=poppins_font)
chat_display.pack(pady=20, padx=20, fill=tk.BOTH, expand=True)

# Frame para entrada de texto e botão
input_frame = tk.Frame(root, bg="#f5f5f5")
input_frame.pack(pady=10, padx=20, fill=tk.X)

# Campo de entrada do usuário
user_entry = tk.Entry(input_frame, bg="#e0e0e0", fg="#333333", font=poppins_font)
user_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))

# Botão de enviar
send_button = tk.Button(input_frame, text="Enviar", command=send_message, bg="#0066cc", fg="#ffffff", font=poppins_font)
send_button.pack(side=tk.RIGHT)

# Inicializar a interface gráfica
root.mainloop()
