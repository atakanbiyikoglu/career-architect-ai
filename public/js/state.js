export const appState = {
    currentStep: 0,
    flowState: 'ONBOARDING', // ONBOARDING | TEST_INTRO | TESTING | FEEDBACK | FINISHED
    currentTest: 'RIASEC',
    currentQuestionIndex: 0,
    latestExportContext: null
};

export const userData = {
    student_name: '',
    school: '',
    department: '',
    current_goal: ''
};

export const riasecQuestions = [];
export const oceanQuestions = [];
export const testAnswers = [];

export const RIASEC_TYPE_MAP = {
    Realistic: 'R',
    Investigative: 'I',
    Artistic: 'A',
    Social: 'S',
    Enterprising: 'E',
    Conventional: 'C'
};

export const OCEAN_TYPE_MAP = {
    Openness: 'Openness',
    Conscientiousness: 'Conscientiousness',
    Extraversion: 'Extraversion',
    Agreeableness: 'Agreeableness',
    Neuroticism: 'Neuroticism'
};

export const API_ENDPOINT = '/api/start-experiment';
export const TYPING_DELAY = 850;
