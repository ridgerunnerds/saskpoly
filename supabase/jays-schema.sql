-- Blue Jays Daily Reports Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE public.jays_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'daily' CHECK (report_type IN ('daily', 'moneyline', 'hr_props', 'pitcher_props', 'runline')),
  game_date DATE,
  opponent TEXT,
  venue TEXT,
  focus_prob NUMERIC(4,3),
  opp_prob NUMERIC(4,3),
  recommendation TEXT,
  confidence NUMERIC(4,3),
  reliability NUMERIC(4,3),
  details JSONB DEFAULT '{}',
  weather JSONB DEFAULT '{}',
  pitchers JSONB DEFAULT '{}',
  bullpens JSONB DEFAULT '{}',
  records JSONB DEFAULT '{}',
  top_batters JSONB DEFAULT '[]',
  yesterday_review JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(report_date, report_type)
);

ALTER TABLE public.jays_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jays reports are viewable by everyone"
  ON public.jays_reports FOR SELECT USING (true);

CREATE POLICY "Only admins can insert jays reports"
  ON public.jays_reports FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update jays reports"
  ON public.jays_reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX idx_jays_reports_date ON public.jays_reports(report_date DESC);
CREATE INDEX idx_jays_reports_type ON public.jays_reports(report_type);
