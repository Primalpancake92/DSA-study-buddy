CREATE TABLE IF NOT EXISTS section_notes (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id integer NOT NULL CHECK (module_id BETWEEN 1 AND 17),
    section_id text NOT NULL CHECK (char_length(section_id) BETWEEN 1 AND 120),
    content text NOT NULL DEFAULT '' CHECK (char_length(content) <= 20000),
    version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
    is_deleted boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, module_id, section_id),
    CHECK (NOT is_deleted OR content = '')
);
