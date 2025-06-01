// src/js/main.js - Main application logic
import { DataManager, TEST_DEFINITIONS } from './storage.js';
import { ProfileManager } from './profiles.js';
import { ResultsManager } from './results.js';

class MentalHealthApp {
    constructor() {
        this.dataManager = new DataManager();
        this.profileManager = new ProfileManager(this.dataManager);
        this.resultsManager = new ResultsManager(this.dataManager);
        this.currentPage = 'home';
        this.currentProfile = null;
        this.audioManager = null; // Will be implemented in Phase 5

        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.loadSettings();
        this.loadProfiles();
        this.showPage('home');
        console.log('Mental Health Assessment App initialized');
    }

    // Event Listeners Setup
    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.target.getAttribute('data-page');
                this.showPage(page);
            });
        });

        // Profile selector
        const profileSelector = document.getElementById('currentProfile');
        profileSelector.addEventListener('change', (e) => {
            this.setCurrentProfile(e.target.value);
        });

        // Home page actions
        document.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            if (action) {
                this.handleAction(action);
            }
        });

        // Profile management
        document.getElementById('createProfileBtn')?.addEventListener('click', () => {
            this.profileManager.showCreateProfileModal();
        });

        // Test cards
        document.querySelectorAll('.test-card').forEach(card => {
            const startBtn = card.querySelector('button');
            startBtn.addEventListener('click', () => {
                const testType = card.getAttribute('data-test');
                this.startTest(testType);
            });
        });

        // Settings
        this.initializeSettingsListeners();

        // Results filters
        document.getElementById('resultsProfile')?.addEventListener('change', () => {
            this.resultsManager.loadResultsPage();
        });

        document.getElementById('resultsTimeframe')?.addEventListener('change', () => {
            this.resultsManager.loadResultsPage();
        });

        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        });
    }

    // Page Navigation
    showPage(pageId) {
        // Remove active class from all pages and nav buttons
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected page and activate nav button
        const targetPage = document.getElementById(`${pageId}-page`);
        const targetNavBtn = document.querySelector(`[data-page="${pageId}"]`);

        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
        }

        if (targetNavBtn) {
            targetNavBtn.classList.add('active');
        }

        // Load page-specific content
        switch (pageId) {
            case 'profiles':
                this.loadProfilesPage();
                break;
            case 'results':
                this.resultsManager.loadResultsPage();
                break;
            case 'tests':
                this.loadTestsPage();
                break;
        }
    }

    // Profile Management (delegated to ProfileManager)
    loadProfiles() {
        const data = this.dataManager.getData();
        const profileSelector = document.getElementById('currentProfile');
        const resultsProfileSelector = document.getElementById('resultsProfile');

        // Clear existing options (keep first default option)
        [profileSelector, resultsProfileSelector].forEach(selector => {
            if (selector) {
                while (selector.children.length > 1) {
                    selector.removeChild(selector.lastChild);
                }
            }
        });

        // Add profiles to selectors
        data.profiles.forEach(profile => {
            [profileSelector, resultsProfileSelector].forEach(selector => {
                if (selector) {
                    const option = document.createElement('option');
                    option.value = profile.id;
                    option.textContent = profile.name;
                    selector.appendChild(option);
                }
            });
        });

        // Set current profile if exists
        if (this.currentProfile) {
            profileSelector.value = this.currentProfile.id;
        }
    }

    loadProfilesPage() {
        const data = this.dataManager.getData();
        const profilesList = document.getElementById('profilesList');

        if (!profilesList) return;

        profilesList.innerHTML = '';

        if (data.profiles.length === 0) {
            profilesList.innerHTML = `
        <div class="empty-state">
          <h3>Nenhum perfil encontrado</h3>
          <p>Crie seu primeiro perfil para começar a usar a plataforma.</p>
          <button class="btn-primary" onclick="app.profileManager.showCreateProfileModal()">Criar Primeiro Perfil</button>
        </div>
      `;
            return;
        }

        data.profiles.forEach(profile => {
            const testCount = data.testResults.filter(r => r.profileId === profile.id).length;
            const lastUsed = new Date(profile.lastUsed).toLocaleDateString('pt-BR');

            const profileCard = document.createElement('div');
            profileCard.className = `profile-card ${this.currentProfile?.id === profile.id ? 'selected' : ''}`;
            profileCard.innerHTML = `
        <h3>${profile.name} ${profile.isAnonymous ? '(Anônimo)' : ''}</h3>
        <div class="profile-meta">
          <p>Criado em: ${new Date(profile.created).toLocaleDateString('pt-BR')}</p>
          <p>Último uso: ${lastUsed}</p>
          <p>Avaliações realizadas: ${testCount}</p>
        </div>
        <div class="profile-actions-buttons">
          <button class="btn-primary" onclick="app.selectProfile('${profile.id}')">
            ${this.currentProfile?.id === profile.id ? 'Selecionado' : 'Selecionar'}
          </button>
          <button class="btn-outline" onclick="app.profileManager.editProfile('${profile.id}')">Editar</button>
          <button class="btn-danger" onclick="app.profileManager.deleteProfile('${profile.id}')">Excluir</button>
        </div>
      `;
            profilesList.appendChild(profileCard);
        });
    }

    setCurrentProfile(profileId) {
        const data = this.dataManager.getData();
        this.currentProfile = data.profiles.find(p => p.id === profileId) || null;

        if (this.currentProfile) {
            // Update last used timestamp
            this.currentProfile.lastUsed = new Date().toISOString();
            const updatedProfiles = data.profiles.map(p =>
                p.id === profileId ? this.currentProfile : p
            );
            this.dataManager.saveData({ ...data, profiles: updatedProfiles });
        }

        this.loadProfiles(); // Refresh UI
    }

    selectProfile(profileId) {
        this.setCurrentProfile(profileId);
        document.getElementById('currentProfile').value = profileId;
        this.loadProfilesPage(); // Refresh to show selection
    }

    // Test Management
    startTest(testType) {
        if (!this.currentProfile) {
            this.showError('Por favor, selecione um perfil antes de iniciar uma avaliação.');
            return;
        }

        const testDef = TEST_DEFINITIONS[testType];
        if (!testDef) {
            this.showError('Tipo de teste não encontrado.');
            return;
        }

        this.showTestModal(testType, testDef);
    }

    showTestModal(testType, testDefinition) {
        const modal = document.getElementById('testModal');
        const title = document.getElementById('testTitle');
        const content = document.getElementById('testContent');

        title.textContent = testDefinition.name;

        // Create test form
        let formHTML = `
      <div class="test-introduction">
        <p><strong>Descrição:</strong> ${testDefinition.description}</p>
        <p><strong>Instruções:</strong> Para cada item, selecione a opção que melhor descreve como você tem se sentido nas últimas 2 semanas.</p>
      </div>
      <form id="testForm" class="test-form">
    `;

        testDefinition.questions.forEach((question, index) => {
            formHTML += `
        <div class="question-group">
          <h4>Questão ${index + 1}</h4>
          <p class="question-text">${question}</p>
          <div class="options">
      `;

            testDefinition.options.forEach(option => {
                formHTML += `
          <label class="option-label">
            <input type="radio" name="q${index}" value="${option.value}" required>
            <span>${option.text}</span>
          </label>
        `;
            });

            formHTML += `
          </div>
        </div>
      `;
        });

        formHTML += `
        <div class="context-note-section">
          <h4>Contexto Pessoal (Opcional)</h4>
          <p>O que estava acontecendo em sua vida quando você fez este teste?</p>
          <textarea 
            id="contextNote" 
            placeholder="Ex: Mudei de emprego, problemas familiares, período de estresse..."
            maxlength="500"
          ></textarea>
          <small>Máximo 500 caracteres</small>
        </div>
        
        <div class="test-actions">
          <button type="button" class="btn-outline" onclick="app.closeModal()">Cancelar</button>
          <button type="submit" class="btn-primary">Finalizar Avaliação</button>
        </div>
      </form>
    `;

        content.innerHTML = formHTML;

        // Add form submission handler
        document.getElementById('testForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitTest(testType, testDefinition);
        });

        modal.classList.add('active');
    }

    submitTest(testType, testDefinition) {
        const form = document.getElementById('testForm');
        const formData = new FormData(form);
        const answers = {};
        let totalScore = 0;

        // Collect answers and calculate score
        testDefinition.questions.forEach((_, index) => {
            const answer = parseInt(formData.get(`q${index}`)) || 0;
            answers[`q${index}`] = answer;
            totalScore += answer;
        });

        const contextNote = document.getElementById('contextNote').value.trim();

        // Determine severity based on scoring ranges
        const severity = testDefinition.scoring.ranges.find(range =>
            totalScore >= range.min && totalScore <= range.max
        );

        // Save test result
        const testResult = {
            profileId: this.currentProfile.id,
            testType: testType,
            scores: {
                total: totalScore,
                severity: severity?.severity || 'Unknown',
                color: severity?.color || '#6b7280'
            },
            rawAnswers: answers,
            contextNote: contextNote
        };

        this.dataManager.saveTestResult(testResult);

        this.closeModal();
        this.showTestResults(testResult, testDefinition);
    }

    showTestResults(testResult, testDefinition) {
        const modal = document.getElementById('testModal');
        const title = document.getElementById('testTitle');
        const content = document.getElementById('testContent');

        title.textContent = `Resultados - ${testDefinition.name}`;

        content.innerHTML = `
      <div class="test-results">
        <div class="result-summary">
          <h3>Seu Resultado</h3>
          <div class="score-display">
            <div class="score-circle" style="border-color: ${testResult.scores.color}">
              <span class="score-number">${testResult.scores.total}</span>
              <span class="score-max">/${testDefinition.questions.length * Math.max(...testDefinition.options.map(o => o.value))}</span>
            </div>
            <div class="score-interpretation">
              <span class="severity-badge" style="background-color: ${testResult.scores.color}">
                ${testResult.scores.severity}
              </span>
            </div>
          </div>
        </div>

        ${testResult.contextNote ? `
          <div class="context-display">
            <h4>Contexto do Teste</h4>
            <p>"${testResult.contextNote}"</p>
          </div>
        ` : ''}

        <div class="result-disclaimer">
          <p><strong>Importante:</strong> Este resultado é apenas informativo. Para diagnóstico e tratamento adequados, consulte sempre um profissional de saúde mental qualificado.</p>
        </div>

        <div class="result-actions">
          <button class="btn-primary" onclick="app.closeModal(); app.showPage('results')">
            Ver Histórico
          </button>
          <button class="btn-outline" onclick="app.closeModal()">
            Fechar
          </button>
        </div>
      </div>
    `;

        modal.classList.add('active');
    }

    // Settings Management
    initializeSettingsListeners() {
        const settings = this.dataManager.getData().settings;

        // Audio settings
        const bgMusicToggle = document.getElementById('backgroundMusic');
        const musicVolumeSlider = document.getElementById('musicVolume');
        const soundEffectsToggle = document.getElementById('soundEffects');

        if (bgMusicToggle) {
            bgMusicToggle.checked = settings.audio.backgroundMusic;
            bgMusicToggle.addEventListener('change', (e) => {
                this.updateSetting('audio.backgroundMusic', e.target.checked);
            });
        }

        if (musicVolumeSlider) {
            musicVolumeSlider.value = settings.audio.musicVolume;
            musicVolumeSlider.addEventListener('input', (e) => {
                this.updateSetting('audio.musicVolume', parseFloat(e.target.value));
            });
        }

        if (soundEffectsToggle) {
            soundEffectsToggle.checked = settings.audio.soundEffects;
            soundEffectsToggle.addEventListener('change', (e) => {
                this.updateSetting('audio.soundEffects', e.target.checked);
            });
        }

        // UI settings
        const themeSelect = document.getElementById('themeSelect');
        const fontSizeSelect = document.getElementById('fontSizeSelect');

        if (themeSelect) {
            themeSelect.value = settings.ui.theme;
            themeSelect.addEventListener('change', (e) => {
                this.updateSetting('ui.theme', e.target.value);
                this.applyTheme(e.target.value);
            });
        }

        if (fontSizeSelect) {
            fontSizeSelect.value = settings.ui.fontSize;
            fontSizeSelect.addEventListener('change', (e) => {
                this.updateSetting('ui.fontSize', e.target.value);
                this.applyFontSize(e.target.value);
            });
        }

        // Data management
        document.getElementById('exportDataBtn')?.addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('clearDataBtn')?.addEventListener('click', () => {
            this.clearAllData();
        });
    }

    updateSetting(path, value) {
        const data = this.dataManager.getData();
        const pathParts = path.split('.');
        let current = data.settings;

        for (let i = 0; i < pathParts.length - 1; i++) {
            current = current[pathParts[i]];
        }

        current[pathParts[pathParts.length - 1]] = value;
        this.dataManager.saveData(data);
    }

    loadSettings() {
        const settings = this.dataManager.getData().settings;
        this.applyTheme(settings.ui.theme);
        this.applyFontSize(settings.ui.fontSize);
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
    }

    applyFontSize(fontSize) {
        document.body.setAttribute('data-font-size', fontSize);
    }

    // Utility Methods
    handleAction(action) {
        switch (action) {
            case 'create-profile':
                this.profileManager.showCreateProfileModal();
                break;
            case 'quick-assessment':
                if (!this.currentProfile) {
                    this.showError('Selecione um perfil primeiro.');
                    return;
                }
                this.startTest('PHQ-9');
                break;
            case 'view-results':
                this.showPage('results');
                break;
        }
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showError(message) {
        alert(`Erro: ${message}`); // Will be replaced with better UI later
    }

    showLoading(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
        }
    }

    exportData() {
        const data = this.dataManager.getData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `mental-health-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(link.href);
    }

    clearAllData() {
        if (confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem(this.dataManager.storageKey);
            location.reload();
        }
    }

    loadTestsPage() {
        // Already handled by static HTML, but can add dynamic content here
        console.log('Loading tests page...');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MentalHealthApp();
});

export default MentalHealthApp;