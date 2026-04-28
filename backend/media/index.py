import json
import os
import base64
import psycopg2
import boto3

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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


def handler(event: dict, context) -> dict:
    """Загрузка и получение медиафайлов для постов (карусель изображений)"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if event.get('httpMethod') == 'GET':
        params = event.get('queryStringParameters') or {}
        post_id = params.get('post_id')
        if not post_id:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'post_id required'})}

        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute("""
                SELECT id, post_id, filename, cdn_url, file_type, sort_order, created_at
                FROM media_files WHERE post_id = %s ORDER BY sort_order
            """, (post_id,))
            files = [{
                'id': r[0], 'post_id': r[1], 'filename': r[2], 'cdn_url': r[3],
                'file_type': r[4], 'sort_order': r[5], 'created_at': r[6].isoformat() if r[6] else None,
            } for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'files': files})}
        finally:
            cur.close()
            conn.close()

    elif event.get('httpMethod') == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'upload')

        if action == 'upload':
            post_id = body.get('post_id')
            file_base64 = body.get('file_base64', '')
            filename = body.get('filename', 'image.jpg')

            if not post_id or not file_base64:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'post_id and file_base64 required'})}

            # Decode and upload to S3
            file_data = base64.b64decode(file_base64)
            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'jpg'
            content_type = f'image/{ext}' if ext != 'jpg' else 'image/jpeg'
            key = f'posts/{post_id}/{filename}'

            s3 = get_s3()
            s3.put_object(Bucket='files', Key=key, Body=file_data, ContentType=content_type)

            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

            # Save to DB
            conn = get_conn()
            cur = conn.cursor()
            try:
                cur.execute("""
                    SELECT COALESCE(MAX(sort_order), -1) + 1 FROM media_files WHERE post_id = %s
                """, (post_id,))
                sort_order = cur.fetchone()[0]

                cur.execute("""
                    INSERT INTO media_files (post_id, filename, cdn_url, file_type, sort_order)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, post_id, filename, cdn_url, file_type, sort_order, created_at
                """, (post_id, filename, cdn_url, 'image', sort_order))
                conn.commit()
                row = cur.fetchone()

                # Update post image_urls
                cur.execute("""
                    UPDATE posts SET image_urls = array_append(COALESCE(image_urls, '{}'), %s)
                    WHERE id = %s
                """, (cdn_url, post_id))
                conn.commit()

                file_obj = {
                    'id': row[0], 'post_id': row[1], 'filename': row[2], 'cdn_url': row[3],
                    'file_type': row[4], 'sort_order': row[5],
                    'created_at': row[6].isoformat() if row[6] else None,
                }
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'file': file_obj})}
            finally:
                cur.close()
                conn.close()

    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Bad request'})}
