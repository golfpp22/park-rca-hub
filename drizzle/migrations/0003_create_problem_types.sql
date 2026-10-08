CREATE TABLE public.problem_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.problem_types TO authenticated;
GRANT ALL ON public.problem_types TO service_role;
ALTER TABLE public.problem_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read problem_types" ON public.problem_types FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "admin write problem_types" ON public.problem_types FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));