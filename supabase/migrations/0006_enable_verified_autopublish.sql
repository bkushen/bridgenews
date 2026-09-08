-- Enable direct publication for the initial verified RSS catalogue.
-- AI stays disabled for these sources until OPENAI_API_KEY is configured.

update public.sources
set auto_publish = true,
    ai_summary_enabled = false,
    ai_classification_enabled = false
where slug in (
  'sbs-news-top','sbs-news-latest','sbs-news-australia','sbs-news-world',
  'daily-mirror-breaking','daily-mirror-business'
);
