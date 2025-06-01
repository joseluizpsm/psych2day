
// src/js/results.js - Results visualization and management

import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export class ResultsManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.charts = {};
    }

    loadResultsPage() {
        const resultsContent = document.getElementById('resultsContent');
        if (!resultsContent) return;

        const data = this.dataManager.getData();
        const currentProfileId = window.app.currentProfile?.id;
        
        // Get filtered results
        const filters = this.getResultsFilters();
        const filteredResults = this.filterResults(data.testResults, filters);

        if (filteredResults.length === 0) {
            resultsContent.innerHTML = this.getEmptyResultsHTML();
            return;
        }

        // Group results by test type for better visualization
        const groupedResults = this.groupResultsByTestType(filteredResults);
        
        resultsContent.innerHTML = `
            <div class="results-summary">
                ${this.generateSummaryHTML(filteredResults)}
            </div>
            <div class="results-charts">
                ${this.generateChartsHTML(groupedResults)}
            </div>
            <div class="results-timeline">
                ${this.generateTimelineHTML(filteredResults)}
            </div>
            <div class="results-export">
                <button class="btn-outline" onclick="app.resultsManager.exportResults()">
                    📊 Exportar Relatório PDF
                </button>
            </div>
        `;

        // Initialize charts after DOM is ready
        setTimeout(() => {
            this.initializeCharts(groupedResults);
        }, 100);
    }

    getResultsFilters() {
        const profileSelect = document.getElementById('resultsProfile');
        const timeframeSelect = document.getElementById('resultsTimeframe');

        return {
            profileId: profileSelect?.value || '',
            timeframe: timeframeSelect?.value || 'all'
        };
    }

    filterResults(results, filters) {
        let filtered = [...results];

        // Filter by profile
        if (filters.profileId) {
            filtered = filtered.filter(r => r.profileId === filters.profileId);
        }

        // Filter by timeframe
        if (filters.timeframe !== 'all') {
            const days = parseInt(filters.timeframe);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            filtered = filtered.filter(r => new Date(r.date) >= cutoffDate);
        }

        // Sort by date (newest first)
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    groupResultsByTestType(results) {
        const grouped = {};
        results.forEach(result => {
            if (!grouped[result.testType]) {
                grouped[result.testType] = [];
            }
            grouped[result.testType].push(result);
        });
        return grouped;
    }

    generateSummaryHTML(results) {
        const totalTests = results.length;
        const testTypes = [...new Set(results.map(r => r.testType))];
        const averageScores = this.calculateAverageScores(results);

        return `
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>${totalTests}</h3>
                    <p>Avaliações Realizadas</p>
                </div>
                <div class="summary-card">
                    <h3>${testTypes.length}</h3>
                    <p>Tipos de Teste</p>
                </div>
                <div class="summary-card">
                    <h3>${this.getDateRange(results)}</h3>
                    <p>Período de Avaliação</p>
                </div>
            </div>
        `;
    }

    generateChartsHTML(groupedResults) {
        let chartsHTML = '<h3>Evolução dos Resultados</h3>';
        
        Object.keys(groupedResults).forEach(testType => {
            chartsHTML += `
                <div class="chart-container">
                    <h4>${testType}</h4>
                    <canvas id="chart-${testType.replace(/[^a-zA-Z0-9]/g, '')}" width="400" height="200"></canvas>
                </div>
            `;
        });

        return chartsHTML;
    }

    generateTimelineHTML(results) {
        let timelineHTML = '<h3>Histórico Detalhado</h3><div class="results-timeline-list">';
        
        results.forEach(result => {
            const profile = this.getProfileName(result.profileId);
            const date = new Date(result.date).toLocaleString('pt-BR');
            
            timelineHTML += `
                <div class="result-card">
                    <div class="result-header">
                        <h4>${result.testType}</h4>
                        <span class="result-date">${date}</span>
                    </div>
                    <div class="result-score">
                        <span class="score-badge" style="background-color: ${result.scores.color}">
                            ${result.scores.severity}
                        </span>
                        <span class="score-value">${result.scores.total} pontos</span>
                    </div>
                    <div class="result-profile">Perfil: ${profile}</div>
                    ${result.contextNote ? `
                        <div class="context-note">
                            <strong>Contexto:</strong> "${result.contextNote}"
                        </div>
                    ` : ''}
                </div>
            `;
        });

        timelineHTML += '</div>';
        return timelineHTML;
    }

    initializeCharts(groupedResults) {
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};

        Object.entries(groupedResults).forEach(([testType, results]) => {
            const canvasId = `chart-${testType.replace(/[^a-zA-Z0-9]/g, '')}`;
            const canvas = document.getElementById(canvasId);
            
            if (!canvas) return;

            const chartData = this.prepareChartData(results);
            
            this.charts[testType] = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Pontuação',
                        data: chartData.scores,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: Math.max(...chartData.scores) + 5
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const result = results[context.dataIndex];
                                    return `${context.parsed.y} pontos (${result.scores.severity})`;
                                }
                            }
                        }
                    }
                }
            });
        });
    }

    prepareChartData(results) {
        // Sort by date (oldest first for chart)
        const sortedResults = results.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return {
            labels: sortedResults.map(r => new Date(r.date).toLocaleDateString('pt-BR')),
            scores: sortedResults.map(r => r.scores.total)
        };
    }

    calculateAverageScores(results) {
        const scoresByType = {};
        
        results.forEach(result => {
            if (!scoresByType[result.testType]) {
                scoresByType[result.testType] = [];
            }
            scoresByType[result.testType].push(result.scores.total);
        });

        const averages = {};
        Object.entries(scoresByType).forEach(([type, scores]) => {
            averages[type] = scores.reduce((a, b) => a + b, 0) / scores.length;
        });

        return averages;
    }

    getDateRange(results) {
        if (results.length === 0) return 'N/A';
        
        const dates = results.map(r => new Date(r.date));
        const earliest = new Date(Math.min(...dates));
        const latest = new Date(Math.max(...dates));
        
        if (earliest.getTime() === latest.getTime()) {
            return earliest.toLocaleDateString('pt-BR');
        }
        
        return `${earliest.toLocaleDateString('pt-BR')} - ${latest.toLocaleDateString('pt-BR')}`;
    }

    getProfileName(profileId) {
        const data = this.dataManager.getData();
        const profile = data.profiles.find(p => p.id === profileId);
        return profile?.name || 'Perfil Removido';
    }

    getEmptyResultsHTML() {
        return `
            <div class="empty-state">
                <h3>Nenhum resultado encontrado</h3>
                <p>Você ainda não possui avaliações realizadas ou nenhuma corresponde aos filtros selecionados.</p>
                <button class="btn-primary" onclick="app.showPage('tests')">
                    Fazer Primeira Avaliação
                </button>
            </div>
        `;
    }

    async exportResults() {
        // Dynamic import of jsPDF
        const { jsPDF } = await import('jspdf');
        
        const data = this.dataManager.getData();
        const filters = this.getResultsFilters();
        const results = this.filterResults(data.testResults, filters);

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;

        // Header
        doc.setFontSize(20);
        doc.text('Relatório de Avaliações em Saúde Mental', margin, 30);
        
        doc.setFontSize(12);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 45);
        doc.text(`Total de avaliações: ${results.length}`, margin, 55);

        let yPosition = 75;

        // Results summary
        results.forEach((result, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 30;
            }

            const profile = this.getProfileName(result.profileId);
            const date = new Date(result.date).toLocaleString('pt-BR');

            doc.setFontSize(14);
            doc.text(`${index + 1}. ${result.testType}`, margin, yPosition);
            
            doc.setFontSize(10);
            doc.text(`Perfil: ${profile}`, margin + 5, yPosition + 10);
            doc.text(`Data: ${date}`, margin + 5, yPosition + 20);
            doc.text(`Pontuação: ${result.scores.total} (${result.scores.severity})`, margin + 5, yPosition + 30);
            
            if (result.contextNote) {
                doc.text(`Contexto: ${result.contextNote}`, margin + 5, yPosition + 40);
                yPosition += 55;
            } else {
                yPosition += 45;
            }
        });

        // Footer disclaimer
        doc.setFontSize(8);
        doc.text('Este relatório é apenas informativo. Consulte um profissional de saúde para diagnóstico.', 
                margin, doc.internal.pageSize.height - 20);

        // Save PDF
        const filename = `relatorio-saude-mental-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
    }
}