// src/js/profiles.js - Profile management functionality

export class ProfileManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    showCreateProfileModal() {
        const modal = document.getElementById('testModal');
        const title = document.getElementById('testTitle');
        const content = document.getElementById('testContent');

        title.textContent = 'Criar Novo Perfil';

        content.innerHTML = `
            <form id="profileForm" class="profile-form">
                <div class="form-group">
                    <label for="profileName">Nome do Perfil *</label>
                    <input type="text" id="profileName" required maxlength="50" 
                           placeholder="Ex: João Silva ou Usuário Anônimo">
                    <small>Este nome será usado para identificar este perfil</small>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" id="isAnonymous">
                        Perfil Anônimo (não salvar informações pessoais)
                    </label>
                </div>

                <div id="demographicsSection" class="demographics-section">
                    <h4>Informações Demográficas (Opcional)</h4>
                    <p class="section-description">
                        Estas informações podem ajudar a contextualizar os resultados, mas são completamente opcionais.
                    </p>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="birthDate">Data de Nascimento</label>
                            <input type="date" id="birthDate" max="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label for="pronouns">Pronomes</label>
                            <select id="pronouns">
                                <option value="">Não especificar</option>
                                <option value="ele/dele">Ele/Dele</option>
                                <option value="ela/dela">Ela/Dela</option>
                                <option value="elu/delu">Elu/Delu</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="height">Altura (cm)</label>
                            <input type="number" id="height" min="100" max="250" placeholder="170">
                        </div>
                        <div class="form-group">
                            <label for="weight">Peso (kg)</label>
                            <input type="number" id="weight" min="30" max="300" placeholder="70">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="occupation">Ocupação</label>
                        <input type="text" id="occupation" maxlength="100" placeholder="Estudante, Professor, etc.">
                    </div>

                    <div class="form-group">
                        <label for="goals">Objetivos com a plataforma</label>
                        <textarea id="goals" maxlength="300" rows="3" 
                                placeholder="Ex: Monitorar meu humor, acompanhar ansiedade, etc."></textarea>
                    </div>
                </div>

                <div class="privacy-notice">
                    <h4>🔒 Privacidade</h4>
                    <p>Todos os dados são armazenados localmente no seu dispositivo. Nenhuma informação é enviada para servidores externos.</p>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-outline" onclick="app.closeModal()">Cancelar</button>
                    <button type="submit" class="btn-primary">Criar Perfil</button>
                </div>
            </form>
        `;

        // Add form handlers
        this.setupProfileFormHandlers();
        modal.classList.add('active');
    }

    setupProfileFormHandlers() {
        const form = document.getElementById('profileForm');
        const anonymousCheckbox = document.getElementById('isAnonymous');
        const demographicsSection = document.getElementById('demographicsSection');

        // Toggle demographics section based on anonymous setting
        anonymousCheckbox.addEventListener('change', (e) => {
            demographicsSection.style.display = e.target.checked ? 'none' : 'block';
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProfile();
        });
    }

    createProfile() {
        const form = document.getElementById('profileForm');
        const formData = new FormData(form);
        const isAnonymous = formData.get('isAnonymous') === 'on';

        const profileData = {
            name: formData.get('profileName') || 'Anônimo',
            isAnonymous: isAnonymous,
            demographics: isAnonymous ? {} : {
                birthDate: formData.get('birthDate') || null,
                pronouns: formData.get('pronouns') || null,
                height: formData.get('height') ? parseInt(formData.get('height')) : null,
                weight: formData.get('weight') ? parseInt(formData.get('weight')) : null,
                occupation: formData.get('occupation') || null,
                goals: formData.get('goals') || null
            }
        };

        const newProfile = this.dataManager.createProfile(profileData);
        
        // Close modal and refresh UI
        window.app.closeModal();
        window.app.loadProfiles();
        window.app.setCurrentProfile(newProfile.id);
        
        // Show success message
        this.showProfileCreatedMessage(newProfile);
    }

    showProfileCreatedMessage(profile) {
        const modal = document.getElementById('testModal');
        const title = document.getElementById('testTitle');
        const content = document.getElementById('testContent');

        title.textContent = 'Perfil Criado com Sucesso!';

        content.innerHTML = `
            <div class="success-message">
                <div class="success-icon">✅</div>
                <h3>Bem-vindo, ${profile.name}!</h3>
                <p>Seu perfil foi criado e está pronto para usar.</p>
                
                <div class="next-steps">
                    <h4>Próximos passos:</h4>
                    <ul>
                        <li>Faça sua primeira avaliação</li>
                        <li>Configure as preferências de áudio e tema</li>
                        <li>Explore os diferentes tipos de questionários disponíveis</li>
                    </ul>
                </div>

                <div class="quick-start-actions">
                    <button class="btn-primary" onclick="app.closeModal(); app.startTest('PHQ-9')">
                        Fazer Primeira Avaliação
                    </button>
                    <button class="btn-outline" onclick="app.closeModal(); app.showPage('tests')">
                        Ver Avaliações Disponíveis
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    editProfile(profileId) {
        const data = this.dataManager.getData();
        const profile = data.profiles.find(p => p.id === profileId);
        
        if (!profile) {
            window.app.showError('Perfil não encontrado');
            return;
        }

        // Implementation for editing profiles
        alert(`Edição de perfil será implementada. Perfil: ${profile.name}`);
    }

    deleteProfile(profileId) {
        if (!confirm('Tem certeza que deseja excluir este perfil? Todos os resultados associados também serão removidos.')) {
            return;
        }

        const data = this.dataManager.getData();
        
        // Remove profile
        data.profiles = data.profiles.filter(p => p.id !== profileId);
        
        // Remove associated test results
        data.testResults = data.testResults.filter(r => r.profileId !== profileId);
        
        this.dataManager.saveData(data);
        
        // Update UI
        window.app.loadProfiles();
        window.app.loadProfilesPage();
        
        // Clear current profile if it was the deleted one
        if (window.app.currentProfile?.id === profileId) {
            window.app.currentProfile = null;
            document.getElementById('currentProfile').value = '';
        }
    }
}