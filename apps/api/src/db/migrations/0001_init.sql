-- Source of truth for the schema. Keep src/db/schema/index.ts in sync.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  upi_vpa text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id, role)
);

CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  grade text,
  parent_name text,
  parent_phone text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE parent_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  parent_user_id uuid NOT NULL REFERENCES users(id),
  student_id uuid NOT NULL REFERENCES students(id),
  relation text
);

CREATE TABLE batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  subject text NOT NULL,
  grade text,
  schedule text,
  capacity integer,
  teacher_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  student_id uuid NOT NULL REFERENCES students(id),
  batch_id uuid NOT NULL REFERENCES batches(id),
  status text NOT NULL DEFAULT 'active',
  start_date date NOT NULL DEFAULT current_date,
  UNIQUE (student_id, batch_id)
);

CREATE TABLE attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  batch_id uuid NOT NULL REFERENCES batches(id),
  date date NOT NULL,
  marked_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, date)
);

CREATE TABLE attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  session_id uuid NOT NULL REFERENCES attendance_sessions(id),
  student_id uuid NOT NULL REFERENCES students(id),
  status text NOT NULL CHECK (status IN ('present','absent','late','excused')),
  UNIQUE (session_id, student_id)
);

CREATE TABLE fee_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  batch_id uuid NOT NULL REFERENCES batches(id),
  amount integer NOT NULL CHECK (amount > 0),
  frequency text NOT NULL,
  due_day integer NOT NULL CHECK (due_day BETWEEN 1 AND 28),
  late_fee integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE fee_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  student_id uuid NOT NULL REFERENCES students(id),
  plan_id uuid NOT NULL REFERENCES fee_plans(id),
  period text NOT NULL,
  amount_due integer NOT NULL,
  amount_paid integer NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, plan_id, period)
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  fee_record_id uuid NOT NULL REFERENCES fee_records(id),
  amount integer NOT NULL CHECK (amount > 0),
  mode text NOT NULL,
  utr text,
  confirmed_by uuid REFERENCES users(id),
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  fee_record_id uuid NOT NULL REFERENCES fee_records(id),
  channel text NOT NULL,
  sent_by uuid REFERENCES users(id),
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  meta jsonb,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON students (tenant_id);
CREATE INDEX ON batches (tenant_id);
CREATE INDEX ON fee_records (tenant_id, status, due_date);
CREATE INDEX ON attendance_sessions (tenant_id, batch_id, date);

-- Row-level security: every tenant-scoped table is filtered by app.tenant_id.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'students','parent_student_links','batches','enrollments','attendance_sessions',
    'attendance_records','fee_plans','fee_records','payments','reminder_logs','audit_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)
         WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)', t);
  END LOOP;
END $$;

-- Make sure the app role can use everything created above (no-op if the role is absent).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tutionassist_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tutionassist_app;
  END IF;
END $$;
