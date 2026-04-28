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
    """CRUD для постов: list, get, create, update, delete, stats"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'list')

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'GET':
            if action == 'stats':
                cur.execute("""
                    SELECT
                        (SELECT COUNT(*) FROM posts) AS total_posts,
                        (SELECT COUNT(*) FROM posts WHERE status = 'scheduled') AS scheduled_posts,
                        (SELECT COUNT(*) FROM scheduled_posts WHERE status = 'published' AND published_at::date = CURRENT_DATE) AS published_today,
                        (SELECT COUNT(*) FROM social_accounts WHERE is_connected = TRUE) AS connected_platforms
                """)
                row = cur.fetchone()
                data = {
                    'total_posts': row[0],
                    'scheduled_posts': row[1],
                    'published_today': row[2],
                    'connected_platforms': row[3],
                }
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(data)}

            elif action == 'get':
                post_id = params.get('id')
                cur.execute("""
                    SELECT id, title, content, status, source_url, source_title, image_urls, created_at, updated_at
                    FROM posts WHERE id = %s
                """, (post_id,))
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}
                post = _row_to_post(row)
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'post': post})}

            else:  # list
                cur.execute("""
                    SELECT id, title, content, status, source_url, source_title, image_urls, created_at, updated_at
                    FROM posts ORDER BY created_at DESC LIMIT 100
                """)
                posts = [_row_to_post(row) for row in cur.fetchall()]
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'posts': posts})}

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = body.get('action', 'create')

            if action == 'create':
                cur.execute("""
                    INSERT INTO posts (title, content, status, source_url, source_title, image_urls)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, title, content, status, source_url, source_title, image_urls, created_at, updated_at
                """, (
                    body.get('title'),
                    body.get('content', ''),
                    body.get('status', 'draft'),
                    body.get('source_url'),
                    body.get('source_title'),
                    body.get('image_urls'),
                ))
                conn.commit()
                post = _row_to_post(cur.fetchone())
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'post': post})}

            elif action == 'update':
                post_id = body.get('id')
                fields = []
                values = []
                for key in ['title', 'content', 'status', 'source_url', 'source_title', 'image_urls']:
                    if key in body:
                        fields.append(f'{key} = %s')
                        values.append(body[key])
                fields.append('updated_at = NOW()')
                values.append(post_id)
                cur.execute(f"""
                    UPDATE posts SET {', '.join(fields)} WHERE id = %s
                    RETURNING id, title, content, status, source_url, source_title, image_urls, created_at, updated_at
                """, values)
                conn.commit()
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'post': _row_to_post(row)})}

            elif action == 'delete':
                post_id = body.get('id')
                cur.execute('UPDATE posts SET status = %s WHERE id = %s', ('failed', post_id))
                conn.commit()
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

    finally:
        cur.close()
        conn.close()

    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Bad request'})}


def _row_to_post(row):
    return {
        'id': row[0],
        'title': row[1],
        'content': row[2],
        'status': row[3],
        'source_url': row[4],
        'source_title': row[5],
        'image_urls': list(row[6]) if row[6] else [],
        'created_at': row[7].isoformat() if row[7] else None,
        'updated_at': row[8].isoformat() if row[8] else None,
    }
