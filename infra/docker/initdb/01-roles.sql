-- Non-superuser role the API connects as. Superusers bypass row-level security,
-- so the API must NOT connect as "postgres".
CREATE ROLE tutionassist_app LOGIN PASSWORD 'tutionassist_app' NOSUPERUSER NOBYPASSRLS;
GRANT CONNECT ON DATABASE tutionassist TO tutionassist_app;
GRANT USAGE ON SCHEMA public TO tutionassist_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tutionassist_app;
