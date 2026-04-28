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


def get_setting(cur, key: str) -> str:
    cur.execute('SELECT value FROM app_settings WHERE key = %s', (key,))
    row = cur.fetchone()
    return row[0] if row else ''


def get_social_extra(cur, platform: str) -> dict:
    cur.execute('SELECT extra_data FROM social_accounts WHERE platform = %s', (platform,))
    row = cur.fetchone()
    if row and row[0]:
        return row[0] if isinstance(row[0], dict) else json.loads(row[0])
    return {}


def publish_telegram(cur, content: str, image_urls: list) -> tuple:
    token = get_setting(cur, 'telegram_bot_token')
    extra = get_social_extra(cur, 'telegram')
    channel_id = extra.get('channel_id', '')
    if not token or not channel_id:
        return False, 'Bot Token или ID канала не настроены. Проверьте Настройки → Telegram.'

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


def publish_vk(cur, content: str, image_urls: list) -> tuple:
    token = get_setting(cur, 'vk_access_token')
    extra = get_social_extra(cur, 'vk')
    group_id = extra.get('group_id', '')
    if not token or not group_id:
        return False, 'Access Token или ID группы не настроены. Проверьте Настройки → ВКонтакте.'

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


def publish_instagram(cur, content: str, image_urls: list) -> tuple:
    token = get_setting(cur, 'instagram_access_token')
    extra = get_social_extra(cur, 'instagram')
    user_id = extra.get('ig_user_id', '')
    if not token or not user_id:
        return False, 'Access Token или ID аккаунта не настроены. Проверьте Настройки → Instagram.'
    if not image_urls:
        return False, 'Instagram требует изображение'

    try:
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


def publish_dzen(cur, content: str, title: str) -> tuple:
    token = get_setting(cur, 'dzen_oauth_token')
    extra = get_social_extra(cur, 'dzen')
    channel_id = extra.get('channel_id', '')
    if not token or not channel_id:
        return False, 'OAuth Token или ID канала не настроены. Проверьте Настройки → Яндекс Дзен.'

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

    conn = get_conn()
    cur = conn.cursor()

    try:
        if post_id and not content:
            cur.execute('SELECT content, title, image_urls FROM posts WHERE id = %s', (post_id,))
            row = cur.fetchone()
            if row:
                content, title = row[0], row[1] or ''
                image_urls = list(row[2]) if row[2] else []

        results = {}
        errors = {}

        for platform in platforms:
            if platform == 'telegram':
                ok, info = publish_telegram(cur, content, image_urls)
            elif platform == 'vk':
                ok, info = publish_vk(cur, content, image_urls)
            elif platform == 'instagram':
                ok, info = publish_instagram(cur, content, image_urls)
            elif platform == 'dzen':
                ok, info = publish_dzen(cur, content, title)
            else:
                ok, info = False, 'Unknown platform'

            results[platform] = ok
            if not ok:
                errors[platform] = info

        if post_id and any(results.values()):
            cur.execute("UPDATE posts SET status = 'published' WHERE id = %s", (post_id,))
            conn.commit()

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'results': results, 'errors': errors}),
        }

    finally:
        cur.close()
        conn.close()
