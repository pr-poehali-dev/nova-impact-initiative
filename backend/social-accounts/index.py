import json
import os
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

ALLOWED_PLATFORMS = ('telegram', 'vk', 'instagram', 'dzen')


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """CRUD настроек социальных аккаунтов (без хранения секретных ключей в БД)"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    conn = get_conn()
    cur = conn.cursor()

    try:
        if event.get('httpMethod') == 'GET':
            cur.execute("""
                SELECT id, platform, is_connected, account_name, extra_data, created_at, updated_at
                FROM social_accounts ORDER BY id
            """)
            accounts = []
            for row in cur.fetchall():
                account = {
                    'id': row[0],
                    'platform': row[1],
                    'is_connected': row[2],
                    'account_name': row[3],
                    'extra_data': row[4] or {},
                    'created_at': row[5].isoformat() if row[5] else None,
                    'updated_at': row[6].isoformat() if row[6] else None,
                }
                accounts.append(account)
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'accounts': accounts})}

        elif event.get('httpMethod') == 'POST':
            body = json.loads(event.get('body') or '{}')
            platform = body.get('platform')

            if platform not in ALLOWED_PLATFORMS and platform != 'openai':
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Unknown platform'})}

            is_connected = body.get('is_connected', True)
            account_name = body.get('account_name')

            # Store non-secret metadata only
            extra = {}
            for key in ['channel_id', 'group_id', 'ig_user_id']:
                if key in body and body[key]:
                    extra[key] = body[key]

            # Save secrets to env via naming convention
            # For actual secrets (tokens), save to env secrets store
            if platform in ALLOWED_PLATFORMS:
                cur.execute("""
                    UPDATE social_accounts
                    SET is_connected = %s, account_name = %s, extra_data = %s, updated_at = NOW()
                    WHERE platform = %s
                    RETURNING id, platform, is_connected, account_name, extra_data, created_at, updated_at
                """, (is_connected, account_name, json.dumps(extra) if extra else None, platform))
                conn.commit()
                row = cur.fetchone()
                account = {
                    'id': row[0], 'platform': row[1], 'is_connected': row[2],
                    'account_name': row[3], 'extra_data': row[4] or {},
                    'created_at': row[5].isoformat() if row[5] else None,
                    'updated_at': row[6].isoformat() if row[6] else None,
                }
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'account': account})}

            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

    finally:
        cur.close()
        conn.close()

    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Bad request'})}
