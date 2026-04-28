import json
import os
import psycopg2
import urllib.request

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

PLATFORM_PROMPTS = {
    'telegram': 'Пиши для Telegram канала: живой язык, можно использовать эмодзи, хэштеги в конце. До 1500 символов.',
    'vk': 'Пиши для ВКонтакте: дружелюбный тон, хэштеги, призыв к действию. До 1000 символов.',
    'instagram': 'Пиши для Instagram: эмоционально, с эмодзи, сильные хэштеги в конце. До 2000 символов.',
    'dzen': 'Пиши для Яндекс Дзен: статья с заголовком, подзаголовками, информативно и развёрнуто. До 3000 символов.',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_openai_key(cur) -> str:
    cur.execute("SELECT value FROM app_settings WHERE key = 'openai_api_key'")
    row = cur.fetchone()
    return row[0] if row else os.environ.get('OPENAI_API_KEY', '')


def call_openai(api_key: str, prompt: str, system: str) -> dict:
    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': prompt},
        ],
        'max_tokens': 1000,
        'temperature': 0.8,
    }).encode()

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
    return result


def handler(event: dict, context) -> dict:
    """Генерация текста поста через OpenAI на основе новости или темы"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    conn = get_conn()
    cur = conn.cursor()

    try:
        api_key = get_openai_key(cur)
        if not api_key:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'OpenAI API ключ не настроен. Добавьте его в Настройках.'}),
            }

        body = json.loads(event.get('body') or '{}')
        news_id = body.get('news_id')
        topic = body.get('topic', '')
        platform = body.get('platform', 'telegram')

        news_context = ''
        if news_id:
            cur.execute('SELECT title, summary, url FROM news_items WHERE id = %s', (news_id,))
            row = cur.fetchone()
            if row:
                news_context = f'Новость: {row[0]}\nСуть: {row[1] or ""}\nИсточник: {row[2] or ""}'

        platform_hint = PLATFORM_PROMPTS.get(platform, PLATFORM_PROMPTS['telegram'])

        system_prompt = f"""Ты — эксперт по контент-маркетингу в сфере ИИ и нейросетей.
Твоя задача — создавать вирусный, интересный контент на русском языке для аудитории, интересующейся AI.
{platform_hint}
Всегда возвращай JSON: {{"title": "заголовок поста", "content": "полный текст поста"}}"""

        user_prompt = ''
        if news_context:
            user_prompt = f'Напиши пост на основе этой новости:\n{news_context}'
        elif topic:
            user_prompt = f'Напиши пост на тему: {topic}'
        else:
            user_prompt = 'Напиши пост о последних трендах в мире ИИ'

        result = call_openai(api_key, user_prompt, system_prompt)
        text = result['choices'][0]['message']['content'].strip()

        try:
            if text.startswith('```'):
                text = text.split('```')[1]
                if text.startswith('json'):
                    text = text[4:]
            parsed = json.loads(text)
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({'title': parsed.get('title', ''), 'content': parsed.get('content', text)}),
            }
        except Exception:
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({'title': '', 'content': text}),
            }

    finally:
        cur.close()
        conn.close()
