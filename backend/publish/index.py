import json
import os
import psycopg2
import urllib.request
import urllib.parse

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def publish_telegram(content: str, image_urls: list) -> tuple:
    token = os.environ.get('TG_BOT_TOKEN', '')
    channel_id = os.environ.get('TG_CHANNEL_ID', '')
    if not token or not channel_id:
        return False, 'TG_BOT_TOKEN или TG_CHANNEL_ID не настроены'

    try:
        if image_urls:
            url = f'https://api.telegram.org/bot{token}/sendPhoto'
            payload = json.dumps({
                'chat_id': channel_id,
                'photo': image_urls[0],
                'caption': content[:1024],
                'parse_mode': 'HTML',
            }).encode()
        else:
            url = f'https://api.telegram.org/bot{token}/sendMessage'
            payload = json.dumps({
                'chat_id': channel_id,
                'text': content[:4096],
                'parse_mode': 'HTML',
            }).encode()

        req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
        if result.get('ok'):
            return True, str(result['result']['message_id'])
        return False, result.get('description', 'Unknown error')
    except Exception as e:
        return False, str(e)


def publish_vk(content: str, image_urls: list) -> tuple:
    token = os.environ.get('VK_ACCESS_TOKEN', '')
    group_id = os.environ.get('VK_GROUP_ID', '')
    if not token or not group_id:
        return False, 'VK_ACCESS_TOKEN или VK_GROUP_ID не настроены'

    try:
        params = {
            'owner_id': f'-{group_id}',
            'message': content[:10000],
            'access_token': token,
            'v': '5.131',
        }
        url = 'https://api.vk.com/method/wall.post?' + urllib.parse.urlencode(params)
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
        if 'response' in result:
            return True, str(result['response']['post_id'])
        return False, result.get('error', {}).get('error_msg', 'Unknown error')
    except Exception as e:
        return False, str(e)


def publish_instagram(content: str, image_urls: list) -> tuple:
    token = os.environ.get('IG_ACCESS_TOKEN', '')
    user_id = os.environ.get('IG_USER_ID', '')
    if not token or not user_id:
        return False, 'IG_ACCESS_TOKEN или IG_USER_ID не настроены'
    if not image_urls:
        return False, 'Instagram требует изображение'

    try:
        # Step 1: Create container
        create_url = f'https://graph.facebook.com/v18.0/{user_id}/media'
        payload = json.dumps({
            'image_url': image_urls[0],
            'caption': content[:2200],
            'access_token': token,
        }).encode()
        req = urllib.request.Request(create_url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())

        container_id = result.get('id')
        if not container_id:
            return False, str(result)

        # Step 2: Publish
        publish_url = f'https://graph.facebook.com/v18.0/{user_id}/media_publish'
        pub_payload = json.dumps({'creation_id': container_id, 'access_token': token}).encode()
        req2 = urllib.request.Request(publish_url, data=pub_payload, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req2, timeout=15) as resp2:
            pub_result = json.loads(resp2.read())

        if 'id' in pub_result:
            return True, pub_result['id']
        return False, str(pub_result)
    except Exception as e:
        return False, str(e)


def publish_dzen(content: str, title: str) -> tuple:
    token = os.environ.get('DZEN_OAUTH_TOKEN', '')
    channel_id = os.environ.get('DZEN_CHANNEL_ID', '')
    if not token or not channel_id:
        return False, 'DZEN_OAUTH_TOKEN или DZEN_CHANNEL_ID не настроены'

    try:
        url = 'https://dzen.ru/api/v3/publisher/articles'
        payload = json.dumps({
            'channel_id': channel_id,
            'title': title or content[:80],
            'content': {'blocks': [{'type': 'paragraph', 'data': {'text': content}}]},
        }).encode()
        req = urllib.request.Request(url, data=payload, headers={
            'Authorization': f'OAuth {token}',
            'Content-Type': 'application/json',
        }, method='POST')
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
        article_id = result.get('id') or result.get('article_id')
        if article_id:
            return True, str(article_id)
        return False, str(result)
    except Exception as e:
        return False, str(e)


def handler(event: dict, context) -> dict:
    """Публикация поста в выбранные социальные сети"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    post_id = body.get('post_id')
    platforms = body.get('platforms', [])
    content = body.get('content', '')
    title = body.get('title', '')
    image_urls = body.get('image_urls', [])

    # Load post from DB if post_id given
    if post_id and not content:
        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute('SELECT content, title, image_urls FROM posts WHERE id = %s', (post_id,))
            row = cur.fetchone()
            if row:
                content, title = row[0], row[1] or ''
                image_urls = list(row[2]) if row[2] else []
        finally:
            cur.close()
            conn.close()

    results = {}
    errors = {}

    for platform in platforms:
        if platform == 'telegram':
            ok, info = publish_telegram(content, image_urls)
        elif platform == 'vk':
            ok, info = publish_vk(content, image_urls)
        elif platform == 'instagram':
            ok, info = publish_instagram(content, image_urls)
        elif platform == 'dzen':
            ok, info = publish_dzen(content, title)
        else:
            ok, info = False, 'Unknown platform'

        results[platform] = ok
        if not ok:
            errors[platform] = info

    # Update post status in DB
    if post_id and any(results.values()):
        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute("UPDATE posts SET status = 'published' WHERE id = %s", (post_id,))
            conn.commit()
        finally:
            cur.close()
            conn.close()

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({'results': results, 'errors': errors}),
    }
