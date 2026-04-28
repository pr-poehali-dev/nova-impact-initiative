
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title TEXT,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    source_url TEXT,
    source_title TEXT,
    image_urls TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scheduled_posts (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('telegram', 'vk', 'instagram', 'dzen')),
    scheduled_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed', 'cancelled')),
    error_message TEXT,
    platform_post_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE social_accounts (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL UNIQUE CHECK (platform IN ('telegram', 'vk', 'instagram', 'dzen')),
    is_connected BOOLEAN DEFAULT FALSE,
    account_name TEXT,
    extra_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE news_sources (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    source_type VARCHAR(20) DEFAULT 'rss' CHECK (source_type IN ('rss', 'api')),
    is_active BOOLEAN DEFAULT TRUE,
    last_fetched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE news_items (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES news_sources(id),
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT,
    published_at TIMESTAMP,
    is_trending BOOLEAN DEFAULT FALSE,
    trend_score INTEGER DEFAULT 0,
    fetched_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE media_files (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id),
    filename TEXT NOT NULL,
    cdn_url TEXT NOT NULL,
    file_type VARCHAR(20) DEFAULT 'image',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_news_items_trend_score ON news_items(trend_score DESC);

INSERT INTO news_sources (title, url, source_type) VALUES
('Hugging Face Blog', 'https://huggingface.co/blog/feed.xml', 'rss'),
('OpenAI News', 'https://openai.com/news/rss.xml', 'rss'),
('MIT Technology Review AI', 'https://www.technologyreview.com/feed/', 'rss'),
('VentureBeat AI', 'https://venturebeat.com/category/ai/feed/', 'rss'),
('AI News', 'https://www.artificialintelligence-news.com/feed/', 'rss');

INSERT INTO social_accounts (platform, is_connected) VALUES
('telegram', FALSE),
('vk', FALSE),
('instagram', FALSE),
('dzen', FALSE);
