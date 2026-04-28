import json
import os
import base64
import time
import psycopg2
import urllib.request
import boto3

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


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def call_groq(prompt: str, system: str) -> str:
    """Вызов Groq API (llama-3.3-70b) для генерации текста"""
    api_key = os.environ.get('GROQ_API_KEY', '')
    if not api_key:
        raise ValueError('GROQ_API_KEY не найден в переменных окружения')

    import urllib.error
    payload = json.dumps({
        'model': 'llama-3.3-70b-versatile',
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': prompt},
        ],
        'max_tokens': 1500,
        'temperature': 0.8,
    }).encode()

    req = urllib.request.Request(
        'https://api.groq.com/openai/v1/chat/completions',
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        raise ValueError(f'Groq API error {e.code}: {body[:300]}')
    return result['choices'][0]['message']['content'].strip()


def make_image_prompt(post_content: str, index: int, total: int) -> str:
    system = (
        "You are an expert at writing image generation prompts. "
        "Based on an AI/tech post, write a short English prompt for FLUX image generator. "
        "Style: futuristic digital art, clean, professional, 4k. "
        "Return ONLY the prompt, no quotes, max 80 words."
    )
    user = (
        f"Create prompt #{index + 1} of {total} for this AI post. "
        f"Each image must show a different visual aspect:\n\n{post_content[:600]}"
    )
    return call_groq(user, system)


def generate_flux_image(prompt: str) -> bytes:
    payload = json.dumps({'prompt': prompt, 'width': 1024, 'height': 1024}).encode()
    req = urllib.request.Request(
        'https://api.poehali.dev/flux/generate',
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        result = json.loads(resp.read())
    image_b64 = result.get('image') or result.get('data') or result.get('b64_json', '')
    if not image_b64:
        raise ValueError(f'No image in response: {list(result.keys())}')
    return base64.b64decode(image_b64)


def upload_to_s3(image_bytes: bytes, filename: str) -> str:
    s3 = get_s3()
    key = f'generated/{filename}'
    s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType='image/png')
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    """Генерация текста поста и изображений карусели через Groq (llama-3.3-70b) + FLUX"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    conn = get_conn()
    cur = conn.cursor()

    try:
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'text')

        # --- Генерация изображений для карусели ---
        if action == 'images':
            post_content = body.get('content', '')
            post_id = body.get('post_id')
            count = min(int(body.get('count', 3)), 5)

            if not post_content:
                return {'statusCode': 400, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'content обязателен'})}

            generated = []
            errors = []

            for i in range(count):
                try:
                    img_prompt = make_image_prompt(post_content, i, count)
                    full_prompt = f"futuristic AI technology, {img_prompt}, digital art, 4k, professional, no text"
                    image_bytes = generate_flux_image(full_prompt)
                    filename = f'ai_{int(time.time())}_{i}.png'
                    cdn_url = upload_to_s3(image_bytes, filename)

                    if post_id:
                        cur.execute("""
                            SELECT COALESCE(MAX(sort_order), -1) + 1 FROM media_files WHERE post_id = %s
                        """, (post_id,))
                        sort_order = cur.fetchone()[0]
                        cur.execute("""
                            INSERT INTO media_files (post_id, filename, cdn_url, file_type, sort_order)
                            VALUES (%s, %s, %s, 'image', %s)
                        """, (post_id, filename, cdn_url, sort_order))
                        cur.execute("""
                            UPDATE posts SET image_urls = array_append(COALESCE(image_urls, '{}'), %s)
                            WHERE id = %s
                        """, (cdn_url, post_id))

                    generated.append({'url': cdn_url, 'prompt': img_prompt})
                except Exception as e:
                    errors.append({'index': i, 'error': str(e)})

            if post_id and generated:
                conn.commit()

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({'images': generated, 'errors': errors}),
            }

        # --- Генерация текста поста ---
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
Создавай вирусный, интересный контент на русском языке для аудитории, интересующейся AI.
{platform_hint}
Всегда возвращай JSON: {{"title": "заголовок", "content": "текст поста"}}"""

        if news_context:
            user_prompt = f'Напиши пост на основе этой новости:\n{news_context}'
        elif topic:
            user_prompt = f'Напиши пост на тему: {topic}'
        else:
            user_prompt = 'Напиши пост о последних трендах в мире ИИ'

        try:
            text = call_groq(user_prompt, system_prompt)
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': f'Ошибка AI: {str(e)}'}),
            }

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