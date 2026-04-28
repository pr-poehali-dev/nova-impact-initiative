import json
import os
import psycopg2
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

AI_RSS_FEEDS = [
    ('Hugging Face Blog', 'https://huggingface.co/blog/feed.xml'),
    ('VentureBeat AI', 'https://venturebeat.com/category/ai/feed/'),
    ('MIT Technology Review', 'https://www.technologyreview.com/feed/'),
    ('The Verge AI', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml'),
    ('AI News', 'https://www.artificialintelligence-news.com/feed/'),
]

AI_KEYWORDS = [
    'gpt', 'llm', 'gemini', 'claude', 'openai', 'mistral', 'llama', 'neural', 'diffusion',
    'transformer', 'искусственный интеллект', 'нейросеть', 'generative', 'foundation model',
    'chatbot', 'agi', 'multimodal', 'fine-tuning', 'embedding', 'agent', 'runway', 'midjourney',
    'stable diffusion', 'anthropic', 'deepmind', 'sora', 'grok'
]


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def fetch_rss(url: str):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=8) as resp:
            content = resp.read()
        root = ET.fromstring(content)
        items = []
        for item in root.iter('item'):
            title_el = item.find('title')
            desc_el = item.find('description')
            link_el = item.find('link')
            pub_el = item.find('pubDate')
            title = title_el.text if title_el is not None else ''
            desc = desc_el.text if desc_el is not None else ''
            link = link_el.text if link_el is not None else ''
            pub_date = None
            if pub_el is not None and pub_el.text:
                try:
                    from email.utils import parsedate_to_datetime
                    pub_date = parsedate_to_datetime(pub_el.text)
                except Exception:
                    pass
            if title:
                items.append({'title': title, 'summary': desc[:500] if desc else '', 'url': link, 'published_at': pub_date})
        return items[:15]
    except Exception:
        return []


def calc_trend_score(title: str, summary: str) -> int:
    text = (title + ' ' + summary).lower()
    score = 0
    for kw in AI_KEYWORDS:
        if kw in text:
            score += 10
    if any(w in text for w in ['breaking', 'new', 'launch', 'release', 'announce', 'unveil', 'новый', 'запуск']):
        score += 15
    return min(score, 100)


def handler(event: dict, context) -> dict:
    """Получение и парсинг AI новостей из RSS источников"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    conn = get_conn()
    cur = conn.cursor()

    try:
        if event.get('httpMethod') == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = body.get('action')

            if action == 'fetch':
                fetched_count = 0
                for source_name, url in AI_RSS_FEEDS:
                    items = fetch_rss(url)
                    for item in items:
                        score = calc_trend_score(item['title'], item.get('summary', ''))
                        # Check duplicate by url
                        if item['url']:
                            cur.execute('SELECT id FROM news_items WHERE url = %s', (item['url'],))
                            if cur.fetchone():
                                continue
                        cur.execute("""
                            INSERT INTO news_items (title, summary, url, published_at, trend_score, is_trending)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, (
                            item['title'][:500],
                            item.get('summary', '')[:1000],
                            item['url'],
                            item.get('published_at'),
                            score,
                            score >= 30,
                        ))
                        fetched_count += 1
                conn.commit()
                # Return fresh items
                cur.execute("""
                    SELECT n.id, n.source_id, n.title, n.summary, n.url, n.published_at,
                           n.is_trending, n.trend_score, n.fetched_at, s.title as source_title
                    FROM news_items n
                    LEFT JOIN news_sources s ON n.source_id = s.id
                    ORDER BY n.trend_score DESC, n.fetched_at DESC LIMIT 30
                """)
                items_result = [_row_to_item(r) for r in cur.fetchall()]
                return {
                    'statusCode': 200,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'items': items_result, 'fetched': fetched_count}),
                }

        # GET - return existing news
        params = event.get('queryStringParameters') or {}
        limit = int(params.get('limit', 20))
        cur.execute("""
            SELECT n.id, n.source_id, n.title, n.summary, n.url, n.published_at,
                   n.is_trending, n.trend_score, n.fetched_at, s.title as source_title
            FROM news_items n
            LEFT JOIN news_sources s ON n.source_id = s.id
            ORDER BY n.trend_score DESC, n.fetched_at DESC LIMIT %s
        """, (limit,))
        items_result = [_row_to_item(r) for r in cur.fetchall()]
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'items': items_result}),
        }
    finally:
        cur.close()
        conn.close()


def _row_to_item(row):
    return {
        'id': row[0],
        'source_id': row[1],
        'title': row[2],
        'summary': row[3],
        'url': row[4],
        'published_at': row[5].isoformat() if row[5] else None,
        'is_trending': row[6],
        'trend_score': row[7],
        'fetched_at': row[8].isoformat() if row[8] else None,
        'source_title': row[9],
    }
