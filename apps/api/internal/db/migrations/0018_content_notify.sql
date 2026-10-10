-- The API caches question responses in memory (internal/cache). Whenever
-- question content changes, by the API, the seed tool, another API instance
-- or by hand, Postgres announces it on the content_changed channel and every
-- API instance listening drops its cache (db.Listen).
CREATE OR REPLACE FUNCTION notify_content_changed() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('content_changed', TG_TABLE_NAME);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['questions', 'question_options', 'question_option_translations',
                           'question_tags', 'question_translations', 'tags']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_content_changed ON %I', t, t);
    EXECUTE format('CREATE TRIGGER %I_content_changed AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON %I
                    FOR EACH STATEMENT EXECUTE FUNCTION notify_content_changed()', t, t);
  END LOOP;
END $$;
