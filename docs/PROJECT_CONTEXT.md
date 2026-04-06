# PROJE BAĞLAMI: Kariyer Yönelim Deneyi (TÜBİTAK 2209-A)

## 1. Proje Kimliği ve Amacı

**Tür:** Bilimsel Karşılaştırma Deneyi (Ticari bir SaaS ürünü değildir).
**Amaç:** Geleneksel kariyer önerileri ile Yapay Zeka (AI) destekli yaklaşım arasındaki kullanıcı tatmin farkını ölçmek.
**Metodoloji:**

- **Kontrol Grubu (Grup A):** Sadece geleneksel **RIASEC** envanteri sonuçlarına dayalı öneriler alır.
- **Deney Grubu (Grup B):** **RIASEC + OCEAN (Büyük Beşli) + LLM Sentezi**ne dayalı öneriler alır.
  **Metrik:** Akışın sonunda toplanan tatmin puanları ve geri bildirim detayları.

## 2. Sohbet Arayüzü (Conversational UI) Vizyonu

**Stratejik Değişiklik:** Klasik form yapıları iptal edilmiştir. Kullanıcı deneyimi, tamamen modern bir mesajlaşma (Chatbot) arayüzü üzerinden ilerleyecektir.

**Akış Senaryosu:**

1.  **Karşılama:** Bot, kullanıcıyı karşılar ve sohbete başlar.
2.  **Tanışma Adımları (Onboarding):** Bot sırasıyla şu bilgileri sorar:
    - İsim
    - Okul
    - Bölüm
    - Kariyer Hedefi / Hayali (Bu veri, Grup B analizi için kritiktir).
3.  **Kayıt:** Tüm cevaplar alındıktan sonra Backend'e (`/api/start-experiment`) gönderilir ve kullanıcı veritabanına kaydedilir.
4.  **Test Modu:** Kayıt başarılı olduktan sonra Bot, RIASEC test sorularını sormaya başlar.

## 3. Teknoloji Stack (Kesin Kurallar)

- **Backend:** Node.js + Express (`server.js` giriş noktası).
- **Frontend:** Saf HTML + Vanilla JavaScript + Tailwind CSS (CDN üzerinden).
  - _Kural:_ **ASLA** React, Vue, Angular vb. framework kullanılmayacak.
- **Veritabanı:** Supabase (PostgreSQL).
  - _Kural:_ **ASLA** ORM (Prisma, Sequelize vb.) kullanılmayacak. Doğrudan `@supabase/supabase-js` kullanılacak.
- **AI/LLM:** Gemini tabanlı analiz servisi aktif.
  - Grup B: Test sonrası doğrudan AI raporu.
  - Grup A: Anket sonrası "Post-Survey Reveal" ile sürpriz AI raporu.

## 4. Proje Yapısı (Monorepo)

- **Kök Dizin**
  - `server.js`: Ana giriş noktası. API rotalarını ve statik dosyaları yönetir.
  - `PROJECT_CONTEXT.md`: Projenin tek gerçek kaynağı (Bu dosya).
  - `DAILY_LOG.md`: Gün gün ayrılmış birleşik çalışma günlüğü.
  - `.env`: Ortam değişkenleri ve gizli anahtarlar.
  - `/src`: Backend kaynak kodları.
    - `/config`: Ayarlar (örn. `supabase.js`).
    - `/controllers`: İş mantığı (örn. `experimentController.js`).
    - `/routes`: API rota tanımları (örn. `api.js`).
  - `/public`: Frontend statik dosyaları.
    - `index.html`: Chat konteyneri ve arayüz iskeleti.
    - `script.js`: Sohbet akışını yöneten "State Machine" mantığı.
    - `style.css`: Tailwind'i destekleyen özel stiller.

## 5. Veritabanı Şeması (Supabase)

PostgreSQL üzerindeki ilişkisel yapı şu şekildedir:

#### `participants` (Katılımcılar)

- `id` (UUID, PK): Benzersiz kimlik.
- `student_name` (Text): Öğrenci adı.
- `school` (Text): Okul bilgisi.
- `department` (Text): Bölüm bilgisi.
- `current_goal` (Text): Kariyer hedefi veya hayali.
- `experiment_group` (Char): 'A' (Kontrol) veya 'B' (Deney).
- `created_at` (Timestamptz): Kayıt zamanı.

#### `test_results` (Test Sonuçları)

- `id` (UUID, PK)
- `participant_id` (UUID, FK -> participants.id)
- `test_type` (Text): 'RIASEC', 'OCEAN' (gerekirse 'MIXED').
- `raw_scores` (JSONB): Ham cevaplar.
- `created_at` (Timestamptz): Kayıt zamanı.

#### `recommendations` (Tavsiyeler)

- `id` (UUID, PK)
- `participant_id` (UUID, FK -> participants.id)
- `generated_text` (Text): Nihai tavsiye metni.
- `source_model` (Text, opsiyonel): Örn. 'rule_based', 'gemini-2.0-flash'.
- `created_at` (Timestamptz): Kayıt zamanı.

#### `feedback` (Geri Bildirim)

- `id` (UUID, PK)
- `participant_id` (UUID, FK -> participants.id)
- `detail_score` (Int): Detay puanı (1-5).
- `satisfaction_score` (Int): Tatmin puanı (1-5).
- `comments` (Text, opsiyonel): Serbest geri bildirim metni.
- `created_at` (Timestamptz): Kayıt zamanı.

## 6. Geliştirme Tarzı ("Vibe Coding")

- **Felsefe:** KISS (Keep It Simple, Stupid). Karmaşık mimariler yerine "çalışan basit kod" önceliklidir.
- **Hata Yönetimi:** Basit `try-catch` blokları.
- **Tasarım:** Temiz, modern, kullanıcı dostu sohbet arayüzü.
- **AI Agent Kuralı:** Kod yazarken her zaman bu dosyadaki teknoloji kısıtlamalarını (No React, No ORM) hatırla.
