const RiskAssessment = require('../utils/riskAssessment');

describe('Risk-Based Testing - Simple Version', () => {
    let riskAssessment;

    beforeAll(() => {
        riskAssessment = new RiskAssessment();
    });

    describe('Risk Assessment System', () => {
        test('Should generate risk report', () => {
            const report = riskAssessment.generateRiskReport();

            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('recommendations');
            expect(report).toHaveProperty('testPlan');
            expect(report.summary).toHaveProperty('totalFunctionalities');
            expect(report.summary).toHaveProperty('criticalFunctions');
        });

        test('Should prioritize functionalities by risk', () => {
            const prioritized = riskAssessment.getPrioritizedFunctionalities();

            expect(prioritized.length).toBeGreaterThan(0);
            expect(prioritized[0].riskScore).toBeGreaterThanOrEqual(prioritized[1].riskScore);
        });

        test('Should evaluate new functionality risk', () => {
            const newRisk = riskAssessment.evaluateNewFunctionality(
                'new_feature',
                'HIGH',
                'MEDIUM',
                'Nueva funcionalidad crítica'
            );

            expect(newRisk).toHaveProperty('riskScore');
            expect(newRisk).toHaveProperty('testPriority');
            expect(newRisk.impact).toBe('HIGH');
        });

        test('Should assess specific functionality risk', () => {
            const authRisk = riskAssessment.assessRisk('auth');
            expect(authRisk.riskScore).toBe(9);
            expect(authRisk.testPriority).toBe('IMMEDIATE');

            const incidentsRisk = riskAssessment.assessRisk('incidents');
            expect(incidentsRisk.riskScore).toBe(6);
            expect(incidentsRisk.testPriority).toBe('HIGH');
        });
    });

    describe('Risk Matrix Validation', () => {
        test('Should have critical functionalities', () => {
            const report = riskAssessment.generateRiskReport();
            expect(report.testPlan.immediate.length).toBeGreaterThan(0);
        });

        test('Should have high risk functionalities', () => {
            const report = riskAssessment.generateRiskReport();
            expect(report.testPlan.high.length).toBeGreaterThan(0);
        });

        test('Should have medium risk functionalities', () => {
            const report = riskAssessment.generateRiskReport();
            expect(report.testPlan.medium.length).toBeGreaterThan(0);
        });

        test('Should have low risk functionalities', () => {
            const report = riskAssessment.generateRiskReport();
            expect(report.testPlan.low.length).toBeGreaterThan(0);
        });
    });

    describe('Test Plan Generation', () => {
        test('Should generate complete test plan', () => {
            const plan = riskAssessment.generateTestPlan();

            expect(plan).toHaveProperty('immediate');
            expect(plan).toHaveProperty('high');
            expect(plan).toHaveProperty('medium');
            expect(plan).toHaveProperty('low');
            expect(plan).toHaveProperty('totalRiskScore');
        });

        test('Should calculate total risk score', () => {
            const plan = riskAssessment.generateTestPlan();
            expect(plan.totalRiskScore).toBeGreaterThan(0);
        });
    });
}); 