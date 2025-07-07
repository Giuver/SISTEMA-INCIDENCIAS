/**
 * Sistema de Evaluación de Riesgos para Testing
 * Prioriza las pruebas basándose en la criticidad del negocio
 */

class RiskAssessment {
    constructor() {
        // Matriz de riesgos por funcionalidad
        this.riskMatrix = {
            // Autenticación y Autorización - CRÍTICO
            'auth': {
                impact: 'CRITICAL',
                probability: 'HIGH',
                riskScore: 9,
                description: 'Acceso no autorizado puede comprometer todo el sistema',
                testPriority: 'IMMEDIATE',
                testCases: [
                    'login_validation',
                    'token_verification',
                    'role_based_access',
                    'session_management',
                    'password_security'
                ]
            },

            // Gestión de Incidencias - ALTO
            'incidents': {
                impact: 'HIGH',
                probability: 'MEDIUM',
                riskScore: 6,
                description: 'Pérdida de datos de incidencias puede afectar operaciones',
                testPriority: 'HIGH',
                testCases: [
                    'incident_creation',
                    'incident_update',
                    'incident_deletion',
                    'file_upload',
                    'status_transitions',
                    'assignment_logic'
                ]
            },

            // Notificaciones en Tiempo Real - MEDIO
            'notifications': {
                impact: 'MEDIUM',
                probability: 'MEDIUM',
                riskScore: 4,
                description: 'Fallo en notificaciones puede causar retrasos en respuesta',
                testPriority: 'MEDIUM',
                testCases: [
                    'websocket_connection',
                    'notification_delivery',
                    'real_time_updates',
                    'notification_preferences'
                ]
            },

            // Gestión de Usuarios - ALTO
            'users': {
                impact: 'HIGH',
                probability: 'LOW',
                riskScore: 5,
                description: 'Problemas de gestión de usuarios pueden afectar seguridad',
                testPriority: 'HIGH',
                testCases: [
                    'user_creation',
                    'user_update',
                    'user_deletion',
                    'role_management',
                    'password_reset'
                ]
            },

            // Categorías - BAJO
            'categories': {
                impact: 'LOW',
                probability: 'LOW',
                riskScore: 2,
                description: 'Problemas menores en categorización',
                testPriority: 'LOW',
                testCases: [
                    'category_creation',
                    'category_update',
                    'category_deletion'
                ]
            },

            // Dashboard y Reportes - MEDIO
            'dashboard': {
                impact: 'MEDIUM',
                probability: 'LOW',
                riskScore: 3,
                description: 'Problemas de visualización pueden afectar toma de decisiones',
                testPriority: 'MEDIUM',
                testCases: [
                    'data_visualization',
                    'chart_rendering',
                    'filter_functionality',
                    'export_capabilities'
                ]
            }
        };

        // Métricas de riesgo
        this.riskMetrics = {
            CRITICAL: 9,
            HIGH: 6,
            MEDIUM: 4,
            LOW: 2
        };
    }

    /**
     * Evalúa el riesgo de una funcionalidad específica
     */
    assessRisk(functionality) {
        const risk = this.riskMatrix[functionality];
        if (!risk) {
            return {
                riskScore: 1,
                testPriority: 'LOW',
                description: 'Funcionalidad no evaluada'
            };
        }
        return risk;
    }

    /**
     * Obtiene todas las funcionalidades ordenadas por prioridad de riesgo
     */
    getPrioritizedFunctionalities() {
        return Object.entries(this.riskMatrix)
            .sort(([, a], [, b]) => b.riskScore - a.riskScore)
            .map(([key, value]) => ({
                functionality: key,
                ...value
            }));
    }

    /**
     * Genera un plan de pruebas basado en riesgos
     */
    generateTestPlan() {
        const prioritized = this.getPrioritizedFunctionalities();

        return {
            immediate: prioritized.filter(f => f.testPriority === 'IMMEDIATE'),
            high: prioritized.filter(f => f.testPriority === 'HIGH'),
            medium: prioritized.filter(f => f.testPriority === 'MEDIUM'),
            low: prioritized.filter(f => f.testPriority === 'LOW'),
            totalRiskScore: prioritized.reduce((sum, f) => sum + f.riskScore, 0)
        };
    }

    /**
     * Evalúa el riesgo de una nueva funcionalidad
     */
    evaluateNewFunctionality(name, impact, probability, description) {
        const impactScore = this.riskMetrics[impact.toUpperCase()] || 1;
        const probabilityScore = this.riskMetrics[probability.toUpperCase()] || 1;
        const riskScore = impactScore * probabilityScore;

        let testPriority;
        if (riskScore >= 8) testPriority = 'IMMEDIATE';
        else if (riskScore >= 5) testPriority = 'HIGH';
        else if (riskScore >= 3) testPriority = 'MEDIUM';
        else testPriority = 'LOW';

        return {
            impact,
            probability,
            riskScore,
            description,
            testPriority
        };
    }

    /**
     * Genera reporte de riesgos
     */
    generateRiskReport() {
        const plan = this.generateTestPlan();

        return {
            summary: {
                totalFunctionalities: Object.keys(this.riskMatrix).length,
                criticalFunctions: plan.immediate.length,
                highRiskFunctions: plan.high.length,
                totalRiskScore: plan.totalRiskScore
            },
            recommendations: {
                immediate: 'Ejecutar pruebas de autenticación y autorización inmediatamente',
                high: 'Priorizar pruebas de gestión de incidencias y usuarios',
                medium: 'Programar pruebas de notificaciones y dashboard',
                low: 'Ejecutar pruebas de categorías cuando sea posible'
            },
            testPlan: plan
        };
    }
}

module.exports = RiskAssessment; 