const supabase = require('../config/supabase');
const recommendationService = require('../services/recommendationService');
const aiService = require('../services/aiService'); // Import AI Service

exports.startExperiment = async (req, res) => {
    try {
        // FRONTEND'DEN GELEN VERİLERİ AL (script.js ile uyumlu)
        const { student_name, school, department, current_goal } = req.body; 

        console.log('📩 Yeni Kayıt İsteği:', { student_name, school, department, current_goal });

        // 1. Rastgele Grup Ataması (A veya B)
        const group = Math.random() < 0.5 ? 'A' : 'B';

        // 2. Supabase'e Kayıt
        const { data, error } = await supabase
            .from('participants')
            .insert([
                { 
                    student_name: student_name, 
                    school: school,
                    department: department,
                    current_goal: current_goal,
                    experiment_group: group 
                }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log(`✅ Kayıt Başarılı! ID: ${data.id} - Grup: ${group}`);

        // 3. Frontend'e Cevap Dön
        res.status(201).json({
            message: 'Deney başlatıldı.',
            participantId: data.id,
            group: data.experiment_group,
            status: 'success'
        });

    } catch (err) {
        console.error('❌ Hata (startExperiment):', err.message);
        res.status(500).json({ error: 'Deney başlatılamadı.', details: err.message });
    }
};

exports.submitTest = async (req, res) => {
    try {
        const { participantId, testAnswers } = req.body;
        console.log('📩 Test Sonuçları Geldi:', { participantId, scores_count: testAnswers?.length || 0 });

        if (!participantId || !Array.isArray(testAnswers) || testAnswers.length === 0) {
            return res.status(400).json({ error: 'participantId ve testAnswers zorunludur.' });
        }

        // Retrieve Participant's Data to Know the Group
        const { data: participant, error: pError } = await supabase
            .from('participants')
            .select('experiment_group, department, current_goal')
            .eq('id', participantId)
            .single();

        if (pError || !participant) {
            throw new Error('Participant not found');
        }

        const group = participant.experiment_group;
        const sourceModel = group === 'A' ? 'rule_based' : 'gemini-2.0-flash';
        console.log(`🔎 Participant ${participantId} is in Group ${group}`);

        // --- Recommendation Generation ---
        const allScores = recommendationService.calculateScores(testAnswers);
        
        // Generate Static Report for EVERYONE (for logging/comparison)
        const staticReport = recommendationService.generateRuleBasedReport(allScores);

        let finalReport = "";

        if (group === 'A') {
            // Group A: Rule-Based Only
            console.log(`🤖 Group A: Returning Rule-Based Report`);
            finalReport = staticReport;
        } else {
            // Group B: AI-Based
            console.log(`🤖 Group B: Generating AI Report...`);
            const aiReport = await aiService.generateCareerAdvice(
                {
                    department: participant.department,
                    current_goal: participant.current_goal
                }, 
                allScores.riasec,
                allScores.ocean
            );
            finalReport = aiReport;
        }

        // Split answers by test type so test_results.test_type is filled correctly.
        const riasecAnswers = testAnswers.filter(a => a.test === 'RIASEC');
        const oceanAnswers = testAnswers.filter(a => a.test === 'OCEAN');

        const testRows = [];
        if (riasecAnswers.length > 0) {
            testRows.push({
                participant_id: participantId,
                test_type: 'RIASEC',
                raw_scores: riasecAnswers
            });
        }
        if (oceanAnswers.length > 0) {
            testRows.push({
                participant_id: participantId,
                test_type: 'OCEAN',
                raw_scores: oceanAnswers
            });
        }

        // Fallback for old payloads that may not include "test" field.
        if (testRows.length === 0) {
            testRows.push({
                participant_id: participantId,
                test_type: 'MIXED',
                raw_scores: testAnswers
            });
        }

        const { error: rError } = await supabase
            .from('test_results')
            .insert(testRows);

        if (rError) {
            throw rError;
        }

        // Save generated report into recommendations table.
        const { error: recError } = await supabase
            .from('recommendations')
            .insert([
                {
                    participant_id: participantId,
                    generated_text: finalReport,
                    source_model: sourceModel
                }
            ]);

        if (recError) {
            throw recError;
        }

        console.log(`✅ Test sonuçları ve öneri kaydı başarılı!`);

        res.status(200).json({
            message: 'Test sonuçları alındı.',
            status: 'success',
            report: finalReport
        });

    } catch (err) {
        console.error('❌ Hata (submitTest):', err);
        res.status(500).json({ error: 'Test sonuçları kaydedilemedi.', details: err.message });
    }
};

exports.submitFeedback = async (req, res) => {
    try {
        const { participantId, satisfaction_score } = req.body;

        if (!participantId || satisfaction_score === undefined || satisfaction_score === null) {
            return res.status(400).json({ error: 'participantId ve satisfaction_score zorunludur.' });
        }

        const numericScore = Number(satisfaction_score);
        if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 5) {
            return res.status(400).json({ error: 'satisfaction_score 1 ile 5 arasında bir tam sayı olmalıdır.' });
        }

        const { error } = await supabase
            .from('feedback')
            .insert([
                {
                    participant_id: participantId,
                    detail_score: numericScore,
                    satisfaction_score: numericScore
                }
            ]);

        if (error) {
            throw error;
        }

        console.log(`✅ Geri bildirim kaydedildi. Participant: ${participantId}, Score: ${numericScore}`);

        res.status(200).json({
            message: 'Geri bildirim kaydedildi.',
            status: 'success'
        });
    } catch (err) {
        console.error('❌ Hata (submitFeedback):', err.message);
        res.status(500).json({ error: 'Geri bildirim kaydedilemedi.', details: err.message });
    }
};

exports.unlockAiReport = async (req, res) => {
    try {
        const { participantId } = req.body;

        if (!participantId) {
            return res.status(400).json({ error: 'participantId zorunludur.' });
        }

        const { data: participant, error: participantError } = await supabase
            .from('participants')
            .select('id, experiment_group, department, current_goal')
            .eq('id', participantId)
            .single();

        if (participantError || !participant) {
            return res.status(404).json({ error: 'Katılımcı bulunamadı.' });
        }

        const { data: testRows, error: testError } = await supabase
            .from('test_results')
            .select('test_type, raw_scores')
            .eq('participant_id', participantId);

        if (testError) {
            throw testError;
        }

        const answers = (testRows || [])
            .flatMap((row) => Array.isArray(row.raw_scores) ? row.raw_scores : []);

        if (!answers.length) {
            return res.status(400).json({ error: 'AI raporu için test verisi bulunamadı.' });
        }

        const allScores = recommendationService.calculateScores(answers);

        const aiReport = await aiService.generateCareerAdvice(
            {
                department: participant.department,
                current_goal: participant.current_goal
            },
            allScores.riasec,
            allScores.ocean
        );

        const { error: recError } = await supabase
            .from('recommendations')
            .insert([
                {
                    participant_id: participantId,
                    generated_text: aiReport,
                    source_model: 'gemini-2.0-flash'
                }
            ]);

        if (recError) {
            throw recError;
        }

        console.log(`✅ AI kilidi açıldı. Participant: ${participantId}, Group: ${participant.experiment_group}`);

        res.status(200).json({
            status: 'success',
            message: 'AI raporu üretildi.',
            report: aiReport
        });
    } catch (err) {
        console.error('❌ Hata (unlockAiReport):', err);
        res.status(500).json({ error: 'AI raporu üretilemedi.', details: err.message });
    }
};

exports.getAdminMetrics = async (req, res) => {
    try {
        const adminToken = process.env.ADMIN_TOKEN;
        if (adminToken) {
            const provided = req.headers['x-admin-token'] || req.query.token;
            if (provided !== adminToken) {
                return res.status(401).json({ error: 'Yetkisiz erisim.' });
            }
        }

        const { data: participants, error: pErr } = await supabase
            .from('participants')
            .select('id, experiment_group, department, current_goal');

        if (pErr) throw pErr;

        const { data: feedbackRows, error: fErr } = await supabase
            .from('feedback')
            .select('participant_id, satisfaction_score');

        if (fErr) throw fErr;

        const participantsById = new Map((participants || []).map((p) => [p.id, p]));

        const scoreAgg = {
            A: { total: 0, count: 0 },
            B: { total: 0, count: 0 }
        };

        (feedbackRows || []).forEach((row) => {
            const participant = participantsById.get(row.participant_id);
            if (!participant) return;
            const group = participant.experiment_group;
            if (!scoreAgg[group]) return;
            scoreAgg[group].total += Number(row.satisfaction_score || 0);
            scoreAgg[group].count += 1;
        });

        const avgA = scoreAgg.A.count ? scoreAgg.A.total / scoreAgg.A.count : 0;
        const avgB = scoreAgg.B.count ? scoreAgg.B.total / scoreAgg.B.count : 0;

        const deptCounts = {};
        const goalCounts = {};

        (participants || []).forEach((p) => {
            const dept = (p.department || 'Belirtilmemis').trim();
            const goal = (p.current_goal || 'Belirtilmemis').trim();
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
            goalCounts[goal] = (goalCounts[goal] || 0) + 1;
        });

        return res.status(200).json({
            status: 'success',
            totals: {
                participants: (participants || []).length,
                feedbackCount: (feedbackRows || []).length
            },
            satisfactionByGroup: {
                A: { average: Number(avgA.toFixed(2)), count: scoreAgg.A.count },
                B: { average: Number(avgB.toFixed(2)), count: scoreAgg.B.count }
            },
            demographics: {
                department: deptCounts,
                goal: goalCounts
            }
        });
    } catch (err) {
        console.error('❌ Hata (getAdminMetrics):', err.message);
        return res.status(500).json({ error: 'Admin metrikleri alinamadi.', details: err.message });
    }
};