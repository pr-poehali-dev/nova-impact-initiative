import json
import os
import psycopg2
from datetime import datetime

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """Управление расписанием публикаций: получение, создание, отмена"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    conn = get_conn()
    cur = conn.cursor()

    try:
        if event.get('httpMethod') == 'GET':
            params = event.get('queryStringParameters') or {}
            month = params.get('month')  # format: 2024-01

            if month:
                cur.execute("""
                    SELECT sp.id, sp.post_id, sp.platform, sp.scheduled_at, sp.published_at,
                           sp.status, sp.error_message, sp.platform_post_id, sp.created_at,
                           p.title, p.content
                    FROM scheduled_posts sp
                    LEFT JOIN posts p ON sp.post_id = p.id
                    WHERE TO_CHAR(sp.scheduled_at, 'YYYY-MM') = %s
                    ORDER BY sp.scheduled_at
                """, (month,))
            else:
                cur.execute("""
                    SELECT sp.id, sp.post_id, sp.platform, sp.scheduled_at, sp.published_at,
                           sp.status, sp.error_message, sp.platform_post_id, sp.created_at,
                           p.title, p.content
                    FROM scheduled_posts sp
                    LEFT JOIN posts p ON sp.post_id = p.id
                    WHERE sp.scheduled_at >= NOW()
                    ORDER BY sp.scheduled_at LIMIT 50
                """)

            items = [_row_to_schedule(r) for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'items': items})}

        elif event.get('httpMethod') == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = body.get('action')

            if action == 'schedule':
                post_id = body['post_id']
                platforms = body['platforms']
                scheduled_at = body['scheduled_at']

                created = []
                for platform in platforms:
                    cur.execute("""
                        INSERT INTO scheduled_posts (post_id, platform, scheduled_at)
                        VALUES (%s, %s, %s)
                        RETURNING id, post_id, platform, scheduled_at, published_at,
                                  status, error_message, platform_post_id, created_at
                    """, (post_id, platform, scheduled_at))
                    row = cur.fetchone()
                    created.append({
                        'id': row[0], 'post_id': row[1], 'platform': row[2],
                        'scheduled_at': row[3].isoformat(), 'published_at': None,
                        'status': row[5], 'error_message': row[6],
                        'platform_post_id': row[7], 'created_at': row[8].isoformat(),
                    })

                # Update post status to scheduled
                cur.execute("UPDATE posts SET status = 'scheduled' WHERE id = %s", (post_id,))
                conn.commit()

                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'items': created})}

            elif action == 'cancel':
                item_id = body['id']
                cur.execute(
                    "UPDATE scheduled_posts SET status = 'cancelled' WHERE id = %s AND status = 'pending'",
                    (item_id,)
                )
                conn.commit()
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

            elif action == 'run_due':
                # Called by cron to publish scheduled posts
                cur.execute("""
                    SELECT sp.id, sp.post_id, sp.platform, p.content, p.title, p.image_urls
                    FROM scheduled_posts sp
                    JOIN posts p ON sp.post_id = p.id
                    WHERE sp.status = 'pending' AND sp.scheduled_at <= NOW()
                    LIMIT 20
                """)
                due = cur.fetchall()

                results = []
                for row in due:
                    sp_id, post_id, platform, content, title, image_urls = row
                    # Call publish function
                    success = publish_to_platform(platform, content, title, image_urls or [])
                    status = 'published' if success else 'failed'
                    cur.execute("""
                        UPDATE scheduled_posts
                        SET status = %s, published_at = NOW()
                        WHERE id = %s
                    """, (status, sp_id))
                    if status == 'published':
                        cur.execute("UPDATE posts SET status = 'published' WHERE id = %s", (post_id,))
                    results.append({'id': sp_id, 'platform': platform, 'status': status})

                conn.commit()
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'results': results})}

    finally:
        cur.close()
        conn.close()

    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Bad request'})}


def publish_to_platform(platform: str, content: str, title: str, image_urls: list) -> bool:
    """Публикация в соцсеть — делегирует в /publish"""
    try:
        import urllib.request
        base_url = os.environ.get('PUBLISH_URL', '')
        if not base_url:
            return False
        payload = json.dumps({'post_id': 0, 'content': content, 'title': title, 'platforms': [platform]}).encode()
        req = urllib.request.Request(base_url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
        return result.get('results', {}).get(platform, False)
    except Exception:
        return False


def _row_to_schedule(row):
    return {
        'id': row[0],
        'post_id': row[1],
        'platform': row[2],
        'scheduled_at': row[3].isoformat() if row[3] else None,
        'published_at': row[4].isoformat() if row[4] else None,
        'status': row[5],
        'error_message': row[6],
        'platform_post_id': row[7],
        'created_at': row[8].isoformat() if row[8] else None,
        'post_title': row[9] if len(row) > 9 else None,
        'post_content': row[10][:100] if len(row) > 10 and row[10] else None,
    }
