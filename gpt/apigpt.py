# 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
from openai import OpenAI

client = OpenAI(
    api_key="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"
)

stream = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "voce consegue",
        }
    ],
    model="gpt-3.5-turbo",
    stream= True,
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")
