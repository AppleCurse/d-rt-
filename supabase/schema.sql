-- ============================================================
-- DÜRTÜ — Supabase kurulum betiği (SQL Editor'a yapıştır, çalıştır)
--   1. profiles      → oyuncu kayıdı (bakiye, istatistik, davetler)
--   2. applications  → kapı başvuruları (gerçek kuyruk; okuma herkese kapalı)
-- Sahne arkası notları:
--   • RLS açık: herkes yalnız kendi profilini görür/yazar.
--   • applications'a herkes (anon dahil) YAZABİLİR ama kimse okuyamaz;
--     admin erişimi için service_role anahtarı ya da ek policy gerekir.
-- ============================================================

-- ---------- 1. OYUNCU PROFİLLERİ ----------
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "kendi profilini oku" on public.profiles;
create policy "kendi profilini oku"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "kendi profilini yaz" on public.profiles;
create policy "kendi profilini yaz"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "kendi profilini güncelle" on public.profiles;
create policy "kendi profilini güncelle"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- 2. BAŞVURULAR (kapı kuyruğu) ----------
create table if not exists public.applications (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name       text not null,
  why        text not null,
  type       text,
  budget     text,
  user_id    uuid,
  status     text not null default 'pending'
);

alter table public.applications enable row level security;

drop policy if exists "herkes başvuru bırakabilir" on public.applications;
create policy "herkes başvuru bırakabilir"
  on public.applications for insert
  with check (true);

-- OKUMA YOK: başvurular halka açık değildir; admin paneli service_role ile okur.
-- (anon okuması kasten tanımsız bırakıldı → RLS engeller)

-- ---------- 3. KÜÇÜK KONFOR: updated_at'i tazeleyen tetik ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Kurulum sonrası yapılacak iki ayar:
--  A) Auth → Email:  "Confirm email" demo için KAPALI tutulabilir
--     (aksi halde kayıt posta onayı bekler ve giriş hata verir).
--  B) index.html'de SUPA_URL ve SUPA_ANON satırlarını doldur:
--       Project Settings → API → Project URL + anon public key
-- ============================================================
