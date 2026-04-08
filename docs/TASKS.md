# Proje Yol Haritası (TÜBİTAK 2209-A)

## Faz 1: Chat Arayüzü ve Temel Veri Toplama (Onboarding)

Bu fazda form yapısı kaldırılacak, yerine sohbet botu gelecek.

- [x] **Veritabanı:** `participants` tablosuna `school`, `department`, `current_goal` sütunlarının eklenmesi. (TAMAMLANDI)
- [x] **Frontend (UI):** `index.html` dosyasının modern, tam ekran "AI Platform" yapısına çevrilmesi. (Sidebar + Main Chat + Geniş Input Alanı).
- [x] **Frontend (Logic):** `script.js` içine konuşma akışını yöneten yapının kurulması. (Sırayla: Ad -> Okul -> Bölüm -> Hedef sorma).
- [x] **Backend:** `/api/start-experiment` endpoint'inin, sohbetten gelen bu yeni verileri kaydedecek şekilde güncellenmesi.

## Faz 2: Psikometrik Test Entegrasyonu (Gamified Chat)

Kullanıcı kaydolduktan sonra test soruları sohbet balonu olarak gelecek.

- [x] **Veri:** RIASEC sorularının JSON formatında hazırlanması (6 tip x 5 soru = 30 soru).
- [x] **Veri:** OCEAN (Beş Faktör) sorularının hazırlanması (Kısa versiyon).
- [x] **Logic:** Chatbot'un soruları tek tek sorması ve kullanıcının butonlarla (Evet/Hayır) cevap vermesi.
- [x] **State:** Cevapların frontend hafızasında (Array) tutulması ve test bitince topluca backend'e gönderilmesi.

## Faz 3: Sonuç Üretimi ve Deney Mantığı (Core)

Veriler toplandıktan sonra grubuna göre analiz üretilmesi.

- [x] **Backend:** Test sonuçlarını kaydeden `/api/submit-test` endpoint'inin yazılması.
- [x] **Backend:** Grup A (Kontrol) için basit, kural tabanlı (Rule-Based) öneri sistemi.
- [x] **Backend:** Grup B (Deney) için LLM (Gemini/OpenAI) servisi entegrasyonu.
- [x] **Prompt Engineering:** Grup B için RIASEC + OCEAN verisini yorumlayan "Kariyer Mentoru" promptunun yazılması.
- [x] **Frontend:** Sonucun kullanıcıya "Yazıyor..." efektiyle gösterilmesi.

## Faz 4: Final ve Raporlama

Deneyin başarısını ölçecek son adımlar.

- [x] **Hibrit Tech Model:** Proje yapısı "Tech-Focused" olarak güncellendi.
- [x] **Veri Optimizasyonu:** RIASEC soruları 18'e düşürüldü (Tech odaklı).
- [x] **Rule-Based (Kural Bazlı) Rapor:** Statik raporlama "Bilişim Meslekleri"ne göre ayarlandı.
- [x] **AI Architect:** Yapay zeka promptu "Teknoloji Kariyer Mimarı" olarak güncellendi.
- [x] **Anket:** Sonuç gösterildikten sonra "Tatmin Anketi" (1-5 Puan) sunulması.

## Faz 5: Grup A Sürpriz Kapanış (Post-Survey Reveal)

Kontrol grubunun deney sonundaki memnuniyetini artırmak için anket sonrası AI hediyesi akışı.

- [x] **Backend:** `/api/unlock-ai-report` endpoint'i eklendi.
- [x] **Backend:** `unlockAiReport` controller'ı ile profil + test verisinden AI raporu üretimi eklendi.
- [x] **Frontend:** `submit-feedback` sonrası grup kontrolü eklendi (Grup B klasik kapanış, Grup A sürpriz reveal).
- [x] **Frontend:** Grup A için "Yapay Zeka Analiz Ediyor..." ara mesajı ve unlock çağrısı entegre edildi.
- [x] **Veri:** Üretilen sürpriz AI raporu `recommendations` tablosuna `source_model=gemini-2.0-flash` ile kaydediliyor.

## Faz 6: Export & Bring Your Own AI (BYO-AI)

PDF ve kopyalanabilir prompt ile platform dışı mentörlük devam akışı.

- [x] **UI:** `index.html` içine gizli `#pdf-export-template` şablonu eklendi.
- [x] **Style:** `style.css` içinde A4 odaklı temiz beyaz PDF/print stilleri eklendi.
- [x] **Chat Akışı:** Rapor sonrası "Evet, PDF ve Komutu Ver / Hayır, Teşekkürler" teklif adımı eklendi.
- [x] **Prompt:** Dinamik alanları dolduran kopyalanabilir ChatGPT/Gemini prompt çıktısı eklendi.
- [x] **History UX:** Geçmişten direkt indirme yerine "Önizle & PDF" chat yönlendirmesi eklendi.
- [x] **History Data:** Geçmiş analiz kayıtlarına `exportContext` saklanarak prompt üretimi desteklendi.

## 🚀 Gelecek Vizyonu / SaaS Dönüşümü (Backlog)

MVP sürümü tamamlanan bu projenin ticari bir ürüne veya ileri seviye bir platforma evrilmesi için planlanan "Show-off" özellikleri şunlardır:

- [x] **Admin & Analytics Dashboard:**
  - `Chart.js` kullanılarak gizli bir `/admin` paneli oluşturulması.
  - Grup A (AI Destekli) ve Grup B (Kural Tabanlı) kullanıcılarının memnuniyet puanlarının (1-5) anlık grafiksel karşılaştırması.
  - Bölümlere ve hedeflere göre katılımcı demografisi pasta grafikleri.

- [x] **PWA (Progressive Web App) Desteği:**
  - `manifest.json` ve `service-worker.js` eklenerek platformun mobil cihazlara "Uygulama" olarak yüklenebilmesi (Add to Home Screen).
  - Offline (çevrimdışı) önbellekleme yetenekleri.

- [x] **API Güvenliği & Rate Limiting:**
  - `express-rate-limit` paketi ile arka arkaya yapılan isteklerin kısıtlanması.
  - Kötü niyetli botların Google Gemini API kotalarını tüketmesini engellemek için IP tabanlı limitasyonlar (örn: 1 saatte max 3 analiz).

- [x] **Sosyal Medya (LinkedIn) Entegrasyonu:**
  - Kullanıcıların analiz sonuçlarını ve AI önerilerini tek tıkla LinkedIn'de paylaşabilmesi.
  - Organik trafiği artırmak için otomatik hashtag ve paylaşım metni oluşturucu.

- [ ] **Akademik Veri Dışa Aktarımı (SPSS/CSV Export):**
  - TÜBİTAK makale süreci için, Admin panelinde toplanan verilerin anonimleştirilerek tek tıkla CSV/Excel formatında indirilmesi.
  - Verilerin doğrudan SPSS gibi akademik analiz programlarına uygun formatta hazırlanması.

- [ ] **Çoklu Dil Desteği (i18n) ve Globalizasyon:**
  - `i18next` benzeri bir yapıyla platformun Türkçe/İngilizce dil seçeneklerine kavuşması.
  - LLM promptlarının kullanıcının dil seçimine göre dinamik olarak değiştirilmesi ve global pazara uyum sağlanması.
