const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

exports.generateCareerAdvice = async (participantProfile, riasecScores, oceanScores) => {
    try {
        const prompt = `
Sen Silikon Vadisi standardında bir Teknoloji Kariyer Mimarisin.
Karşındaki: ${participantProfile.department} öğrencisi. Hedefi: ${participantProfile.current_goal}

**VERİLER:**
- RIASEC: ${JSON.stringify(riasecScores)}
- OCEAN: ${JSON.stringify(oceanScores)}

**GÖREVİN:**
Bu öğrenciye nokta atışı bir **"IT / Dijital Kariyer Yolu"** çiz.
Genel terimler (Yazılımcı ol) YASAK. Spesifik ol (Örn: "GoLang Backend Dev", "DevSecOps").

**ANALİZ KURALLARI:**
- Low 'E' + High 'C' + High 'R' -> "Backend Security" veya "DevOps".
- High 'A' + High 'I' -> "Creative Technologist" veya "UX Researcher".

**ÇIKTI FORMATI (Markdown):**
### 🎯 Dijital Kimliğin
(1 Cümle özet)
### 🛠️ Tech Stack Önerisi
(Ana Dil ve Araçlar)
### 🚀 Niş Kariyer Rolleri
(En uygun 3 rol ve nedenleri)
### 💡 Tavsiye
(Hemen başlaması için 1 somut adım)
`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("AI Error:", error.message);
        // MOCK FALLBACK RESPONSE FOR SIMULATION/OFFLINE DEV
        return `
### 🎯 Dijital Kimliğin (SİMÜLASYON)
Yapay zeka servisine erişilemediği için bu örnek cevabı görüyorsun. Normalde buraya kişiselleştirilmiş analiz gelecek.
Senin profilin, teknoloji dünyasında "Sistem Mimarı" olmaya çok uygun.

### 🛠️ Tech Stack Önerisi
- **Ana Dil:** Python, Go
- **Araçlar:** Kubernetes, Docker, AWS

### 🚀 Niş Kariyer Rolleri
1. **Cloud Architect:** Bulut sistemlerini tasarla.
2. **DevSecOps Specialist:** Güvenlik ve operasyonu birleştir.
3. **Backend Developer:** Ölçeklenebilir sistemler kur.

### 💡 Tavsiye
Hemen bir AWS sertifikası çalışmaya başla.
        `;
    }
};
