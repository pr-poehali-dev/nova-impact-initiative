import json
import os
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

ALLOWED_PLATFORMS = ('telegram', 'vk', 'instagram', 'dzen')

SECRET_FIELDS = {
    'telegram': ['bot_token'],
    'vk': ['access_token'],
    'instagram': ['access_token'],
    'dzen': ['oauth_token'],
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """CRUD настроек социальных аккаунтов и OpenAI ключа"""
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

            # Also return openai status
            cur.execute("SELECT value FROM app_settings WHERE key = 'openai_configured'")
            row = cur.fetchone()
            openai_configured = row[0] == 'true' if row else False

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({'accounts': accounts, 'openai_configured': openai_configured}),
            }

        elif event.get('httpMethod') == 'POST':
            body = json.loads(event.get('body') or '{}')
            platform = body.get('platform')

            # Handle OpenAI API key
            if platform == 'openai':
                api_key = body.get('api_key', '').strip()
                if api_key:
                    cur.execute("""
                        INSERT INTO app_settings (key, value, updated_at)
                        VALUES ('openai_api_key', %s, NOW())
                        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
                    """, (api_key,))
                    cur.execute("""
                        INSERT INTO app_settings (key, value, updated_at)
                        VALUES ('openai_configured', 'true', NOW())
                        ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = NOW()
                    """)
                    conn.commit()
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

            if platform not in ALLOWED_PLATFORMS:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Unknown platform'})}

            is_connected = body.get('is_connected', True)
            account_name = body.get('account_name')

            # Store non-secret metadata + secrets in app_settings
            extra = {}
            for key in ['channel_id', 'group_id', 'ig_user_id']:
                if key in body and body[key]:
                    extra[key] = body[key]

            # Save secret tokens to app_settings
            for secret_field in SECRET_FIELDS.get(platform, []):
                if secret_field in body and body[secret_field]:
                    settings_key = f'{platform}_{secret_field}'
                    cur.execute("""
                        INSERT INTO app_settings (key, value, updated_at)
                        VALUES (%s, %s, NOW())
                        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
                    """, (settings_key, body[secret_field]))

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

    finally:
        cur.close()
        conn.close()

    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Bad request'})}
