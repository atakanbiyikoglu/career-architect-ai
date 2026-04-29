const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

// Initialize Groq client
const groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const buildCareerPrompt = (participantProfile, riasecScores, oceanScores) => `
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

const getFallbackResponse = () => `
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

exports.generateCareerAdvice = async (participantProfile, riasecScores, oceanScores) => {
    const prompt = buildCareerPrompt(participantProfile, riasecScores, oceanScores);
    
    // Try Groq first
    try {
        console.log("[AI Service] Groq API çağrısı başlatılıyor...");
        const groqResponse = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1024
        });
        
        const content = groqResponse.choices[0]?.message?.content;
        if (content) {
            console.log("[AI Service] ✅ Groq başarılı yanıt döndü");
            return content;
        }
    } catch (groqError) {
        console.error("[AI Service] Groq hatasını yakaladı:", {
            message: groqError?.message,
            code: groqError?.code,
            name: groqError?.name,
            status: groqError?.status
        });
    }
    
    // Fallback to Gemini
    try {
        console.log("[AI Service] Gemini'ye fallback yapılıyor...");
        const geminiResponse = await geminiModel.generateContent(prompt);
        const content = geminiResponse.response.text();
        
        if (content) {
            console.log("[AI Service] ✅ Gemini başarılı yanıt döndü");
            return content;
        }
    } catch (geminiError) {
        console.error("[AI Service] Gemini hatasını yakaladı:", {
            message: geminiError?.message,
            code: geminiError?.code,
            name: geminiError?.name
        });
    }
    
    // Final fallback to mock response
    console.error("[AI Service] Hem Groq hem Gemini başarısız. Fallback yanıt döndürülüyor.");
    return getFallbackResponse();
};
