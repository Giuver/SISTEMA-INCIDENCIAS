#!/usr/bin/env node

/**
 * Script para ejecutar pruebas basadas en riesgos
 * Prioriza las pruebas según la criticidad del negocio
 */

const RiskAssessment = require('../utils/riskAssessment');
const { exec } = require('child_process');
const path = require('path');

class RiskBasedTestRunner {
    constructor() {
        this.riskAssessment = new RiskAssessment();
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            critical: { passed: 0, failed: 0, total: 0 },
            high: { passed: 0, failed: 0, total: 0 },
            medium: { passed: 0, failed: 0, total: 0 },
            low: { passed: 0, failed: 0, total: 0 }
        };
    }

    /**
     * Ejecuta pruebas por prioridad de riesgo
     */
    async runTestsByPriority() {
        console.log('🚀 Iniciando pruebas basadas en riesgos...\n');

        const report = this.riskAssessment.generateRiskReport();
        console.log('📊 Reporte de Evaluación de Riesgos:');
        console.log(`   Total de funcionalidades: ${report.summary.totalFunctionalities}`);
        console.log(`   Funciones críticas: ${report.summary.criticalFunctions}`);
        console.log(`   Funciones de alto riesgo: ${report.summary.highRiskFunctions}`);
        console.log(`   Puntuación total de riesgo: ${report.summary.totalRiskScore}\n`);

        // Ejecutar pruebas por prioridad
        await this.runCriticalTests();
        await this.runHighRiskTests();
        await this.runMediumRiskTests();
        await this.runLowRiskTests();

        this.generateFinalReport();
    }

    /**
     * Ejecuta pruebas críticas (IMMEDIATE)
     */
    async runCriticalTests() {
        console.log('🔴 EJECUTANDO PRUEBAS CRÍTICAS (IMMEDIATE)...');
        console.log('   - Autenticación y Autorización');
        console.log('   - Validación de tokens');
        console.log('   - Control de acceso basado en roles\n');

        try {
            await this.executeTestSuite('CRITICAL');
            console.log('✅ Pruebas críticas completadas\n');
        } catch (error) {
            console.error('❌ Error en pruebas críticas:', error.message);
            process.exit(1); // Salir si fallan las pruebas críticas
        }
    }

    /**
     * Ejecuta pruebas de alto riesgo (HIGH)
     */
    async runHighRiskTests() {
        console.log('🟠 EJECUTANDO PRUEBAS DE ALTO RIESGO (HIGH)...');
        console.log('   - Gestión de incidencias');
        console.log('   - Gestión de usuarios');
        console.log('   - Carga de archivos\n');

        try {
            await this.executeTestSuite('HIGH');
            console.log('✅ Pruebas de alto riesgo completadas\n');
        } catch (error) {
            console.error('❌ Error en pruebas de alto riesgo:', error.message);
        }
    }

    /**
     * Ejecuta pruebas de riesgo medio (MEDIUM)
     */
    async runMediumRiskTests() {
        console.log('🟡 EJECUTANDO PRUEBAS DE RIESGO MEDIO (MEDIUM)...');
        console.log('   - Notificaciones en tiempo real');
        console.log('   - Dashboard y reportes\n');

        try {
            await this.executeTestSuite('MEDIUM');
            console.log('✅ Pruebas de riesgo medio completadas\n');
        } catch (error) {
            console.error('❌ Error en pruebas de riesgo medio:', error.message);
        }
    }

    /**
     * Ejecuta pruebas de bajo riesgo (LOW)
     */
    async runLowRiskTests() {
        console.log('🟢 EJECUTANDO PRUEBAS DE BAJO RIESGO (LOW)...');
        console.log('   - Gestión de categorías');
        console.log('   - Funcionalidades auxiliares\n');

        try {
            await this.executeTestSuite('LOW');
            console.log('✅ Pruebas de bajo riesgo completadas\n');
        } catch (error) {
            console.error('❌ Error en pruebas de bajo riesgo:', error.message);
        }
    }

    /**
     * Ejecuta un conjunto de pruebas específico
     */
    executeTestSuite(priority) {
        return new Promise((resolve, reject) => {
            const testPattern = `--testNamePattern="${priority} RISK"`;
            const command = `npm test -- --testPathPattern=riskBasedTests.js ${testPattern} --verbose`;

            console.log(`   Ejecutando: ${command}`);

            exec(command, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`   Error ejecutando pruebas ${priority}:`, error.message);
                    reject(error);
                    return;
                }

                // Analizar resultados
                const output = stdout + stderr;
                const passed = (output.match(/✓/g) || []).length;
                const failed = (output.match(/✗/g) || []).length;
                const total = passed + failed;

                // Actualizar estadísticas
                this.testResults[priority.toLowerCase()] = { passed, failed, total };
                this.testResults.passed += passed;
                this.testResults.failed += failed;
                this.testResults.total += total;

                console.log(`   Resultados ${priority}: ${passed} pasaron, ${failed} fallaron\n`);
                resolve();
            });
        });
    }

    /**
     * Genera reporte final de pruebas
     */
    generateFinalReport() {
        console.log('📋 REPORTE FINAL DE PRUEBAS BASADAS EN RIESGOS');
        console.log('='.repeat(50));

        const { critical, high, medium, low, passed, failed, total } = this.testResults;

        console.log('\n🔴 PRUEBAS CRÍTICAS:');
        console.log(`   Pasaron: ${critical.passed}/${critical.total}`);
        console.log(`   Fallaron: ${critical.failed}/${critical.total}`);

        console.log('\n🟠 PRUEBAS DE ALTO RIESGO:');
        console.log(`   Pasaron: ${high.passed}/${high.total}`);
        console.log(`   Fallaron: ${high.failed}/${high.total}`);

        console.log('\n🟡 PRUEBAS DE RIESGO MEDIO:');
        console.log(`   Pasaron: ${medium.passed}/${medium.total}`);
        console.log(`   Fallaron: ${medium.failed}/${medium.total}`);

        console.log('\n🟢 PRUEBAS DE BAJO RIESGO:');
        console.log(`   Pasaron: ${low.passed}/${low.total}`);
        console.log(`   Fallaron: ${low.failed}/${low.total}`);

        console.log('\n📊 RESUMEN TOTAL:');
        console.log(`   Total de pruebas: ${total}`);
        console.log(`   Pasaron: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
        console.log(`   Fallaron: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);

        // Recomendaciones basadas en resultados
        console.log('\n💡 RECOMENDACIONES:');

        if (critical.failed > 0) {
            console.log('   ⚠️  CRÍTICO: Fallaron pruebas críticas. Revisar inmediatamente.');
        }

        if (high.failed > 0) {
            console.log('   ⚠️  ALTO: Fallaron pruebas de alto riesgo. Priorizar corrección.');
        }

        if (medium.failed > 0) {
            console.log('   ⚠️  MEDIO: Fallaron pruebas de riesgo medio. Programar corrección.');
        }

        if (low.failed > 0) {
            console.log('   ⚠️  BAJO: Fallaron pruebas de bajo riesgo. Corregir cuando sea posible.');
        }

        if (failed === 0) {
            console.log('   ✅ EXCELENTE: Todas las pruebas pasaron exitosamente.');
        }

        console.log('\n🎯 Pruebas basadas en riesgos completadas.');
    }
}

// Ejecutar el script
if (require.main === module) {
    const runner = new RiskBasedTestRunner();
    runner.runTestsByPriority().catch(console.error);
}

module.exports = RiskBasedTestRunner; 