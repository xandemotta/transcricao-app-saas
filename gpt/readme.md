Para usar a API do ChatGPT, siga os seguintes passos:

1. **Instalação e importação das bibliotecas**

Antes de começar, certifique-se de ter instalado a biblioteca OpenAI com o comando `pip install openai`. Em seguida, importe com:

```python
Import openai
```

2. **Autenticação**

Para autenticar suas chamadas de API, você precisa obter uma chave de API no dashboard do OpenAI. Em seguida, configure a chave de API como uma variável de ambiente:

```python
openai.api_key = 'seu-api-key'
```

3. **Criação de conversas**

Você criará uma nova conversa para interagir com a API do ChatGPT. Isso é feito através do comando `openai.ChatCompletion.create()`. Você definirá um ID de modelo (`gpt-3.5-turbo` é o mais atual) e fornecerá uma série de mensagens.

O campo de mensagens é uma lista de dicionários de mensagens. Cada mensagem tem um role que pode ser 'system', 'user', ou 'assistant', e o conteúdo, que é o texto da mensagem. A primeira mensagem da conversa geralmente é do 
sistema e fornece instruções para o assistente.

```python
response = openai.ChatCompletion.create(
  model="gpt-3.5-turbo",
  messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Who won the world series in 2020?"},
    ]
)
```
4. **Interpretação dos resultados**

A resposta está contida na variável `response`. Para exibir o texto gerado, você pode utilizar `response['choices'][0]['message']['content']`, que retorna a resposta do assistente.

5. **Continuando a conversa**

Para continuar a conversa, simplesmente estenda a lista de mensagens na conversação.

```python
response = openai.ChatCompletion.create(
  model="gpt-3.5-turbo",
  messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Who won the world series in 2020?"},
        {"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
        {"role": "user", "content": "Who did they beat?"},
    ]
)
```
Este código adicional emula a continuidade da conversa. A conversa pode ter quantas "user" e "assistant" mensagens forem necessárias.

Lembre-se que cada solicitação custa um certo número de tokens, que são unidades de texto. Você deve se certificar de que o número total de tokens na conversa não ultrapasse o limite máximo do modelo (4096 tokens para `gpt-3.5-turbo`).

Além disso, a documentação oficial geralmente contém informações mais detalhadas e atualizadas. Você deve considerar verificá-la na página de API do ChatGPT da OpenAI.