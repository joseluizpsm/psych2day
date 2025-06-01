// src/js/storage.js - Core data structures and localStorage management

class DataManager {
    constructor() {
        this.storageKey = 'mentalHealthApp';
        this.initializeStorage();
    }

    // Initialize default data structure
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const defaultData = {
                profiles: [],
                testResults: [],
                settings: {
                    audio: {
                        backgroundMusic: true,
                        musicVolume: 0.5,
                        soundEffects: true,
                        effectsVolume: 0.3,
                        selectedTrack: 'ambient1',
                        transitionChimes: true
                    },
                    ui: {
                        theme: 'light',
                        fontSize: 'medium',
                        contrast: 'normal',
                        language: 'pt'
                    },
                    accessibility: {
                        highContrast: false,
                        largeText: false,
                        keyboardNavigation: false
                    }
                },
                version: '1.0.0',
                lastBackup: null
            };
            this.saveData(defaultData);
        }
    }

    // Get all data
    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error retrieving data:', error);
            return null;
        }
    }

    // Save all data
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Profile management
    createProfile(profileData) {
        const data = this.getData();
        const newProfile = {
            id: `profile_${Date.now()}`,
            name: profileData.name || 'Anônimo',
            demographics: {
                birthDate: profileData.birthDate || null,
                height: profileData.height || null,
                weight: profileData.weight || null,
                pronouns: profileData.pronouns || null,
                ...profileData.demographics
            },
            created: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            isAnonymous: profileData.isAnonymous || false
        };

        data.profiles.push(newProfile);
        this.saveData(data);
        return newProfile;
    }

    // Test result management
    saveTestResult(testResult) {
        const data = this.getData();
        const newResult = {
            id: `test_${Date.now()}`,
            profileId: testResult.profileId,
            testType: testResult.testType,
            date: new Date().toISOString(),
            scores: testResult.scores,
            rawAnswers: testResult.rawAnswers,
            contextNote: testResult.contextNote || '',
            aiAnalysis: testResult.aiAnalysis || null,
            completionTime: testResult.completionTime || null
        };

        data.testResults.push(newResult);
        this.saveData(data);
        return newResult;
    }

    // Get test results for a profile
    getProfileTestResults(profileId) {
        const data = this.getData();
        return data.testResults.filter(result => result.profileId === profileId);
    }

    // Update settings
    updateSettings(newSettings) {
        const data = this.getData();
        data.settings = { ...data.settings, ...newSettings };
        this.saveData(data);
        return data.settings;
    }
}

// Test definitions - Public domain assessments
const TEST_DEFINITIONS = {
    'PHQ-9': {
        name: 'PHQ-9 - Questionário de Saúde do Paciente',
        description: 'Triagem para depressão',
        questions: [
            'Pouco interesse ou prazer em fazer as coisas',
            'Sentir-se deprimido, desanimado ou sem esperança',
            'Dificuldade para adormecer, continuar dormindo, ou dormir demais',
            'Sentir-se cansado ou com pouca energia',
            'Falta de apetite ou comer demais',
            'Sentir-se mal consigo mesmo ou sentir que é um fracasso ou que decepcionou sua família ou você mesmo',
            'Dificuldade para se concentrar nas coisas, como ler jornal ou ver televisão',
            'Mover-se ou falar tão devagar que outras pessoas poderiam notar, ou o contrário - estar tão agitado ou inquieto que se move muito mais que o habitual',
            'Pensamentos de que seria melhor estar morto ou de se ferir de alguma maneira'
        ],
        options: [
            { value: 0, text: 'Nenhuma vez' },
            { value: 1, text: 'Vários dias' },
            { value: 2, text: 'Mais da metade dos dias' },
            { value: 3, text: 'Quase todos os dias' }
        ],
        scoring: {
            ranges: [
                { min: 0, max: 4, severity: 'Mínimo', color: '#22c55e' },
                { min: 5, max: 9, severity: 'Leve', color: '#eab308' },
                { min: 10, max: 14, severity: 'Moderado', color: '#f97316' },
                { min: 15, max: 19, severity: 'Moderadamente severo', color: '#dc2626' },
                { min: 20, max: 27, severity: 'Severo', color: '#7c2d12' }
            ]
        }
    },

    'GAD-7': {
        name: 'GAD-7 - Transtorno de Ansiedade Generalizada',
        description: 'Triagem para ansiedade',
        questions: [
            'Sentir-se nervoso, ansioso ou muito tenso',
            'Não conseguir parar ou controlar as preocupações',
            'Preocupar-se muito com diversas coisas',
            'Dificuldade para relaxar',
            'Ficar tão agitado que se torna difícil permanecer parado',
            'Ficar facilmente aborrecido ou irritado',
            'Sentir medo como se algo horrível fosse acontecer'
        ],
        options: [
            { value: 0, text: 'Nenhuma vez' },
            { value: 1, text: 'Vários dias' },
            { value: 2, text: 'Mais da metade dos dias' },
            { value: 3, text: 'Quase todos os dias' }
        ],
        scoring: {
            ranges: [
                { min: 0, max: 4, severity: 'Mínimo', color: '#22c55e' },
                { min: 5, max: 9, severity: 'Leve', color: '#eab308' },
                { min: 10, max: 14, severity: 'Moderado', color: '#f97316' },
                { min: 15, max: 21, severity: 'Severo', color: '#dc2626' }
            ]
        }
    }

    // Add more test definitions as you implement them
};

// Export everything
export { DataManager, TEST_DEFINITIONS };