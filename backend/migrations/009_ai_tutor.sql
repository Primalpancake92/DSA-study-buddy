CREATE TABLE IF NOT EXISTS tutor_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id integer NOT NULL,
    section_id text NOT NULL CHECK (char_length(section_id) BETWEEN 1 AND 120),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, module_id, section_id),
    UNIQUE (id, user_id)
);
CREATE TABLE IF NOT EXISTS tutor_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL CHECK (char_length(content) <= 64000),
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (conversation_id, user_id) REFERENCES tutor_conversations(id, user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS tutor_messages_history ON tutor_messages(user_id, conversation_id, created_at, id);
CREATE INDEX IF NOT EXISTS tutor_conversations_retention ON tutor_conversations(user_id, updated_at);
CREATE TABLE IF NOT EXISTS tutor_leases (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    token uuid NOT NULL,
    expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS tutor_daily_usage (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day date NOT NULL,
    calls integer NOT NULL DEFAULT 0 CHECK (calls >= 0),
    PRIMARY KEY (user_id, day)
);
-- Content-free tombstones intentionally survive conversation deletion and retention.
CREATE TABLE IF NOT EXISTS tutor_requests (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, request_id)
);
