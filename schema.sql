-- ============================================================
-- KGP App - Schemat bazy danych Supabase
-- Uruchom w SQL Editor: https://supabase.com/dashboard
-- ============================================================

-- 1. Tabela profiles (uzytkownicy z sync code)
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_code text UNIQUE NOT NULL,
  device_info text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabela user_data (wszystkie dane jako JSON)
CREATE TABLE user_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabela photos (metadane zdjec, pliki w Storage)
CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  peak_id int NOT NULL,
  storage_path text NOT NULL,
  photo_type text NOT NULL CHECK (photo_type IN ('summit','stamp','panorama','parking','other')),
  gps_lat double precision,
  gps_lon double precision,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Indeksy
CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_peak_id ON photos(peak_id);
CREATE INDEX idx_profiles_sync_code ON profiles(sync_code);

-- 5. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_data_updated_at BEFORE UPDATE ON user_data FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER photos_updated_at BEFORE UPDATE ON photos FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Storage bucket dla zdjec
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- 7. RLS + polityki dostepu
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on user_data" ON user_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on photos" ON photos FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
