<!--
DAILY LOG KURALLARI VE ŞABLONU (LLM'ler ve Geliştiriciler İçin)

SIRALAMA: Daima ters kronolojik (En yeni tarih en üstte).

DİL VE TON: Profesyonel, net ve deklaratif. Yaptım, Ekledim, Commit bekliyor gibi birinci tekil şahıs veya sohbet dili KULLANILAMAZ.

YAPI: Her gün için YYYY-MM-DD başlığı atılmalı. Altında şu kategoriler kullanılmalı: Özellikler (Features), Hata Düzeltmeleri (Fixes), Mimari ve Altyapı (Chores).

DETAY SEVİYESİ: Yapılan işlemler ve sistemdeki etkileri teknik detaylarıyla birlikte, kapsamlı ve profesyonel maddeler halinde yazılmalıdır. Bilgi kaybı yaşanmamalı, ancak günlük/hatıra defteri gibi de yazılmamalıdır.
-->

# Daily Log

## 2026-04-27

### Özellikler (Features)

- Admin veri dışa aktarma kabiliyeti sisteme eklendi: `GET /api/admin/export-csv` rotası tanımlandı ve `src/controllers/experimentController.js` ile `src/routes/api.js` üzerinden uçtan uca entegre edildi.
- CSV üretim akışı Supabase kaynaklarıyla ilişkilendirildi; `participants`, `feedback` ve `test_results` verileri birleştirilerek akademik analize uygun tek çıktı seti üretildi.
- RIASEC ve OCEAN skorlarının CSV çıktısına dahil edilmesi için `recommendationService.calculateScores` akışına dayalı hesaplama katmanı dışa aktarma sürecine bağlandı.
- Admin panelinde CSV indirme deneyimi tamamlandı: `public/admin.html` içerisine indirme eylemi eklendi, `public/js/admin.js` ile tokenlı istek, Blob oluşturma ve istemci tarafı dosya indirme akışı devreye alındı.

### Hata Düzeltmeleri (Fixes)

- `public/js/main.js` içindeki hatalı `try/catch` blokları ve tekil `catch` kalıntısı temizlenerek istemci tarafı sözdizimi bütünlüğü sağlandı.
- Kullanıcıya görünen metinlerdeki bozuk Türkçe karakterler düzeltildi; düzeltmeler yalnızca görünür metin katmanına uygulandı.
- Service Worker davranışı revize edilerek API yanıtlarının önbellekten yanlış/eskimiş dönme riski azaltıldı; `/api`, `/submit`, `/start` yolları için cache dışı davranış uygulandı.

### Mimari ve Altyapı (Chores)

- `public/service-worker.js` içinde `skipWaiting()` ve `clients.claim()` etkinleştirilerek yeni SW sürümünün istemcilere daha hızlı devri sağlandı.
- HTML gezinme isteklerinde network-first stratejisi uygulanarak istemci tarafında stale içerik servis edilmesi engellendi.
- `public/index.html` içindeki ana CSS/JS referanslarına sürüm parametresi (`?v=1.0.1`) eklenerek tarayıcı cache invalidation süreci kontrollü hale getirildi.
- `.vscode/settings.json` içinde `json.schemaDownload.enable: false` tanımlanarak geliştirme ortamındaki uzak şema indirme kaynaklı tanılama gürültüsü azaltıldı.
- Doğrulama çalışmaları tamamlandı: `npm run build` çalıştırıldı ve Express API için beklenen "compile step gerekmiyor" sonucu alındı.
- CSV dışa aktarma şeması KVKK gerekliliklerine uygun olacak şekilde sınırlandırıldı; kişisel isim alanları dışarıda bırakıldı, çıktı alanları teknik olarak `id, tarih, bolum, hedef, deney_grubu, tatmin_puani, riasec_skorlari, ocean_skorlari` olarak sabitlendi.

## 2026-04-08

### Özellikler (Features)

- A/B deneyinde kullanıcı ikna stratejisi genişletildi; tatmin anketi mesajları grup bazında farklılaştırıldı ve ödül/teşvik metinleri akışa entegre edildi.
- `askSatisfactionSurvey()` akışı grup bilgisini (`experiment_group`) okuyarak kişiselleştirilmiş anket dili üretecek şekilde geliştirildi.
- Geçmiş analiz akışı yeniden kurgulandı; kullanıcı geçmiş bir analizi açtığında rapor önizleme, bağlamsal yönlendirme mesajları ve export teklif adımı tek bir deneyimde birleştirildi.
- History modal seçim eyleminin yazımı ve görsel dili Türkçe odaklı ve daha açıklayıcı hale getirildi.
- Admin ve Analytics dashboard yetenekleri genişletildi; gizli `/admin` rotası, grup bazlı memnuniyet/demografi grafikleri ve metrik endpointleri platforma eklendi.
- PWA yetenekleri etkinleştirildi; `manifest.json` ve `service-worker.js` ile yüklenebilirlik ve çevrimdışı çalışma altyapısı devreye alındı.
- LinkedIn paylaşım akışı eklendi; sonuç ekranından paylaşım CTA’sı ve hashtag odaklı paylaşım metni üretimi sağlandı.
- Dağıtım hazırlıkları tamamlandı; `vercel.json` tanımlandı, Open Graph ve Twitter Card meta etiketleri eklendi, OG görseli doğrulandı.

### Hata Düzeltmeleri (Fixes)

- Geçmiş analiz önizlemesinde beyaz ekran/akış kilidi üreten DOM hatası giderildi.
- Kök neden: `chatMessages.innerHTML = ''` kullanımı `#typing-indicator` elemanını DOM’dan kaldırdığı için `insertBefore` çağrısı `NotFoundError` üretiyordu.
- Düzeltme: mesaj temizleme akışı, `typing-indicator` korunacak şekilde seçici silme mantığına taşındı; mesaj ekleme zinciri stabil hale getirildi.
- Önizleme etkileşimindeki yazım/etiket tutarsızlıkları giderildi ve kullanıcı yönlendirmeleri netleştirildi.

### Mimari ve Altyapı (Chores)

- Test ve doğrulama scriptleri için organizasyon standardı tanımlandı; scriptlerin `tests/` klasöründe toplanması kuralı benimsendi.
- Kök dizinin üretim kodu odaklı tutulması için test çalıştırma standardı (`node tests/<script>.js`) belirlendi.
- `npm run build` ve `node tests/validate_ux_changes.js` doğrulamalarıyla UX hedefleri ve akış bütünlüğü kontrol edildi.
- Yayınlama öncesi meta/SEO katmanı güncellenerek sosyal paylaşım önizlemelerinin tutarlılığı artırıldı.
- `ADMIN_TOKEN` mekanizmasıyla admin uç noktalarının erişim güvenliği güçlendirildi.

## 2026-04-06

### Özellikler (Features)

- A/B deney akışında Grup A için post-survey "AI rapor kilidi açma" deneyimi eklendi.
- `POST /api/unlock-ai-report` rotası ve `unlockAiReport` kontrol katmanı devreye alındı.
- Kilit açma akışında `participantId` üzerinden profil verisi (`department`, `current_goal`) ve RIASEC/OCEAN test yanıtları toplanarak gerçek AI kariyer önerisi üretimi sağlandı.
- Üretilen AI çıktısı hem istemciye döndürüldü hem de `recommendations` tablosuna kalıcı olarak yazıldı.
- Rapor sonrası kullanıcıya PDF ve harici LLM promptu teklif eden export akışı eklendi; onaylanan durumda iki aksiyon aynı adımda çalışacak şekilde tasarlandı.
- `#pdf-export-template` ile marka odaklı PDF şablonu oluşturuldu; profil bilgileri, psikometrik özet ve rapor içeriği tek dokümanda sunuldu.
- Geçmiş analizlerden yeniden export senaryosu geliştirildi; geçmiş kayıtlarda `exportContext` saklanarak aynı raporun tekrar üretilebilirliği sağlandı.

### Hata Düzeltmeleri (Fixes)

- Geçmiş kayıtlarla uyumluluk için fallback normalize mekanizması eklendi; eksik profil/skor alanlarında akışın kırılması engellendi.
- Geçmiş analizlerde doğrudan indirme yerine önizleme odaklı deneyime geçilerek kullanıcı eylem sıralaması tutarlı hale getirildi.

### Mimari ve Altyapı (Chores)

- `style.css` içinde A4 odaklı baskı stilleri tanımlanarak PDF çıktılarında görsel standardizasyon sağlandı.
- Uzun sohbet maliyeti yerine prompt devri yaklaşımı ile platform içi hesaplama maliyeti dengelendi.
- Grup A deney hedeflerini destekleyen ödülleme/hediye kurgusu, memnuniyet anketi sonrası akışa mimari olarak bağlandı.

## 2026-04-03

### Özellikler (Features)

- Veritabanı şeması dokümantasyonu güncellendi; `PROJECT_CONTEXT.md` mevcut şemayı standart biçimde yansıtacak şekilde yeniden düzenlendi.
- Şema hizalama için `migrations/2026-04-03_schema_alignment.sql` oluşturuldu.
- Migrasyon kapsamı genişletildi: `test_results.result_text` kaldırma, `test_type` backfill + NOT NULL, feedback skor kısıtları ve performans indeksleri tanımlandı.
- `recommendations.source_model` alanının insert sırasında doldurulması sağlanarak backend veri bütünlüğü artırıldı.
- Arayüzde akademik branding çalışmaları devreye alındı: başlık/alt başlık dönüşümü, gelişmiş karşılama mesajı ve "Proje Hakkında" modal entegrasyonu tamamlandı.
- Sidebar ve chat deneyimi yeniden düzenlendi: logo, favicon, AI avatarı, footer yerleşimi, tipografi ölçekleri ve buton hiyerarşisi optimize edildi.
- PDF export ve local history altyapısı eklendi; analiz sonuçlarının localStorage üzerinde saklanması, geçmişten yeniden açılması ve PDF’e dönüştürülmesi sağlandı.
- Gece iterasyonunda sidebar yapısı sadeleştirildi; footer aksiyonları, buton düzeni ve history modal davranışları minimal tasarıma göre yeniden kurgulandı.

### Hata Düzeltmeleri (Fixes)

- `test_results_test_type_check` kısıtının `MIXED` değerini reddetme problemi tespit edilerek migrasyona constraint genişletme hotfix’i eklendi.
- `about-link` ile `about-btn` seçici uyumsuzluğu giderildi; modal tetikleme akışı doğru elemana bağlandı.
- Kullanılmayan CSS kuralları (`.about-link`, `.sidebar-actions`) temizlenerek stil çakışmaları ve bakım yükü azaltıldı.

### Mimari ve Altyapı (Chores)

- `test_results.test_type` dağılımı (`MIXED=23`, `OCEAN=6`, `RIASEC=6`) ve constraint kabul listesi doğrulanarak veri göçünün tutarlılığı teyit edildi.
- Günlük kayıt yapısı tek dosyada gün bazlı izlenebilir olacak şekilde standardize edildi.
- Sidebar yerleşiminde `sidebar-top` ve `sidebar-footer` görevleri ayrıştırıldı; `margin-top: auto` ve `flex` düzeniyle alt alan sabitlemesi sağlandı.
- History modal aksiyonları sadeleştirilerek kullanıcı etkileşimleri tek bir ana amaca (PDF odaklı çıktı) yönlendirildi.

## 2026-04-02

### Özellikler (Features)

- Chat akışına 1-5 aralığında tatmin anketi eklendi.
- `POST /api/submit-feedback` endpoint’i devreye alındı.
- `feedback` tablosuna `detail_score` ve `satisfaction_score` alanlarını kapsayan kayıt akışı tanımlandı.
- `submitTest` akışı güncellenerek `test_results.test_type` alanının dolu yazılması ve rapor metninin `recommendations` tablosuna kaydedilmesi sağlandı.

### Hata Düzeltmeleri (Fixes)

- Eski kayıtlardaki `test_type = null` durumu analiz edildi; yeni kayıtların dolu alanla ilerlemesi sağlandı.

### Mimari ve Altyapı (Chores)

- `test_results`, `recommendations` ve `feedback` tabloları için RLS durumunun kapalı olduğu doğrulandı.
- Uçtan uca simülasyon testi ile anketten kayıt katmanına kadar tüm akış doğrulandı.
