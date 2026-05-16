# 🚀 Kariyer Mimarı AI — TÜBİTAK 2209-A Ana Proje

![TÜBİTAK 2209-A](https://img.shields.io/badge/TÜBİTAK-2209--A-red?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_2.0_Flash-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**Kariyer Mimarı AI**, üniversite öğrencilerinin kariyer yönelimlerini derinlemesine analiz etmek amacıyla **İki Faktörlü (İlgi ve Kişilik) Psikometrik Modelin** Üretken Yapay Zekâ (LLM) ile sentezlendiği kurumsal ve akademik bir araştırma platformudur. 

Bu proje, **TÜBİTAK 2209-A Üniversite Öğrencileri Araştırma Projeleri Destekleme Programı** kapsamında desteklenmiş olup, canlı sürümüne [kariyermimari.tech](https://kariyermimari.tech) adresinden ulaşılabilmektedir.

## 📌 Proje Amacı ve Bilimsel Altyapı
Geleneksel kariyer rehberliği sistemleri (örn. sadece Holland-RIASEC envanteri) genellikle çok geniş ve yüzeysel meslek kategorileri sunar. Bu proje; "Kural Tabanlı" geleneksel algoritmalar ile **RIASEC + OCEAN + LLM Sentezi**ne dayalı yenilikçi yapay zekâ yaklaşımlarını deneysel olarak karşılaştırır. Sistem, kullanıcı tatminini, veri tutarlılığını ve öneri detay seviyesini bilimsel metodolojilerle ölçmeyi hedefler.

## ✨ Öne Çıkan Özellikler
- **Conversational UI (Sohbet Odaklı Akış):** Sıkıcı ve doğrusal anket formları yerine kullanıcıyı sıkmayan, ChatGPT benzeri dinamik ve responsive (duyarlı) bir onboarding arayüzü.
- **Gelişmiş A/B Deney Motoru:** Kullanıcıları arka planda otomatik olarak Kontrol (Grup A - Kural Tabanlı) ve Deney (Grup B - Doğrudan AI) gruplarına izole etme mantığı.
- **Post-Survey Reveal Stratejisi:** Kontrol grubundaki kullanıcıların anket sonrasında motivasyonunu artırmak ve CRO optimizasyonunu sağlamak amacıyla, süreç sonunda gerçek yapay zekâ analiz rapor kilidini açma mekanizması.
- **Korumalı Admin & KVKK Uyumlu Export:** `x-admin-password` tabanlı middleware ve sessionStorage korumalı akademik yönetim paneli. Supabase verilerini (participants, feedback, test_results) birleştirerek akademik analizlere uygun, KVKK uyumlu CSV dışa aktarım desteği.
- **Masaüstü & Mobil UI Optimizasyonu:** Masaüstünde dinamik daraltılabilir yan menü (collapsible sidebar), mobil cihazlarda ise `100dvh` dikey sabitleme ve güvenli alt boşluk (safe-area) entegrasyonu.

## 🛠️ Teknoloji Yığını (Tech Stack) & Altyapı
- **Frontend:** Vanilla JavaScript (Modüler mimari), HTML5, Tailwind CSS
- **Backend:** Node.js, Express.js (Vercel Serverless ve Rewrites uyumlu)
- **Veritabanı:** Supabase (PostgreSQL / İlişkisel şema tasarımı)
- **AI Entegrasyonu:** Google Gemini 2.0 Flash (Groq fallback katmanlı ve kota yönetimli)
- **DevOps/Dağıtım:** Vercel entegrasyonu ve otomatik sistem durumu doğrulayan `GET /api/health` kontrol rotası.

## 📚 Geliştirici Dokümantasyonu
Sistem mimarisi, ilişkisel veri tabanı şemaları, API rotaları ve kapsamlı A/B test test raporları için `docs/` klasörünü inceleyebilirsiniz:
- [Proje Bağlamı ve Supabase Veri Şeması](./docs/PROJECT_CONTEXT.md)
- [Geliştirici ve Dağıtım Günlüğü](./docs/DAILY_LOG.md)

---
_Proje Yürütücüsü: Atakan Bıyıkoğlu | Akademik Danışmanlık ve Kurum: Kırşehir Ahi Evran Üniversitesi_