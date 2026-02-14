// RIASEC Calculation and Recommendation Logic

const CAREER_MAPPINGS = {
    'R': {
        title: 'Gerçekçi (Realistic)',
        traits: 'Pratik, maddeci, mekanik yetenekleri olan.',
        careers: ['Hardware Engineer', 'System Administrator', 'Network Engineer', 'Robotics Technician', 'Data Center Technician', 'Field Service Engineer']
    },
    'I': {
        title: 'Araştırmacı (Investigative)',
        traits: 'Analitik, entelektüel, bilimsel merakı olan.',
        careers: ['Software Engineer', 'Data Scientist', 'Cybersecurity Analyst', 'AI Researcher', 'Database Administrator', 'Cloud Architect']
    },
    'A': {
        title: 'Sanatçı (Artistic)',
        traits: 'Yaratıcı, hayal gücü geniş, estetik kaygısı olan.',
        careers: ['UI/UX Designer', 'Frontend Developer', 'Game Designer', '3D Modeler', 'AR/VR Developer', 'Digital Product Designer']
    },
    'S': {
        title: 'Sosyal (Social)',
        traits: 'Yardımsever, insan odaklı, iletişim becerisi yüksek.',
        careers: ['Tech Evangelist', 'IT Support Specialist', 'Scrum Master', 'Technical Recruiter', 'Community Manager', 'Developer Advocate']
    },
    'E': {
        title: 'Girişimci (Enterprising)',
        traits: 'İkna kabiliyeti yüksek, lider, dışa dönük.',
        careers: ['Product Manager', 'Tech Entrepreneur', 'Sales Engineer', 'IT Project Manager', 'CTO', 'Business Analyst']
    },
    'C': {
        title: 'Düzenli (Conventional)',
        traits: 'Düzenli, detaycı, verilerle çalışmayı seven.',
        careers: ['QA Engineer', 'DevOps Engineer', 'Compliance Analyst', 'Technical Writer', 'Data Analyst', 'Software Tester']
    }
};

exports.calculateScores = (answers) => {
    // Initialize scores
    let riasec = { 'R': 0, 'I': 0, 'A': 0, 'S': 0, 'E': 0, 'C': 0 };
    let ocean = { 'Openness': 0, 'Conscientiousness': 0, 'Extraversion': 0, 'Agreeableness': 0, 'Neuroticism': 0 };

    // Calculate based on answers
    answers.forEach(ans => {
        // Only count 'true' answers
        if (ans.answer === true) {
            // RIASEC Mapping
            const riasecMap = {
                'Realistic': 'R',
                'Investigative': 'I',
                'Artistic': 'A',
                'Social': 'S',
                'Enterprising': 'E',
                'Conventional': 'C'
            };

            // OCEAN Mapping
            const oceanMap = {
                'Openness': 'Openness',
                'Conscientiousness': 'Conscientiousness',
                'Extraversion': 'Extraversion',
                'Agreeableness': 'Agreeableness',
                'Neuroticism': 'Neuroticism'
            };
            
            if (riasecMap[ans.type]) {
                riasec[riasecMap[ans.type]]++;
            } else if (oceanMap[ans.type]) {
                ocean[oceanMap[ans.type]]++;
            }
        }
    });

    return { riasec, ocean };
};

exports.generateRuleBasedReport = (allScores) => {
    const scores = allScores.riasec; // Use only RIASEC for rule-based
    // Sort scores from highest to lowest
    const sortedTypes = Object.entries(scores)
        .sort(([,a], [,b]) => b - a)
        .map(([key]) => key);

    const top3 = sortedTypes.slice(0, 3); // Get top 3 types (e.g., ['I', 'R', 'C'])

    let report = `### Kariyer Analiz Raporun Hazır! 🎯 (Teknoloji Odaklı)\n\n`;
    report += `Yaptığımız analize göre senin baskın teknoloji karakter kodun: **${top3.join('')}**\n\n`;

    top3.forEach((type, index) => {
        const info = CAREER_MAPPINGS[type];
        report += `**${index + 1}. ${info.title}**: ${info.traits}\n`;
    });

    report += `\n### Sana Uygun Olabilecek Teknoloji Rolleri:\n`;
    
    // Combine careers from top 2 types
    const primaryCareers = CAREER_MAPPINGS[top3[0]].careers.slice(0, 3);
    const secondaryCareers = CAREER_MAPPINGS[top3[1]].careers.slice(0, 2);
    
    [...primaryCareers, ...secondaryCareers].forEach(career => {
        report += `- ${career}\n`;
    });

    report += `\n*(Not: Bu sonuçlar kural tabanlı bir analizdir.)*`;

    return report;
};
