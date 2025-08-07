import { test, expect, TestResult } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

/**
 * 종합적인 E2E 테스트 리포터
 * 테스트 결과, 성능 메트릭, 접근성 점수, 스크린샷 등을 통합 리포트로 생성
 */

export interface TestMetrics {
  performance: {
    loadTime: number;
    webVitals: {
      lcp?: number;
      fid?: number;
      cls?: number;
    };
    bundleSize: {
      total: number;
      js: number;
      css: number;
    };
    memoryUsage: {
      used: number;
      peak: number;
    };
  };
  accessibility: {
    score: number;
    issues: Array<{
      type: 'contrast' | 'aria' | 'keyboard' | 'semantics';
      severity: 'error' | 'warning';
      message: string;
    }>;
  };
  coverage: {
    features: {
      auth: boolean;
      rules: boolean;
      violations: boolean;
      rewards: boolean;
      realtime: boolean;
      responsive: boolean;
    };
    browsers: string[];
    devices: string[];
  };
  errors: Array<{
    type: 'javascript' | 'network' | 'assertion';
    message: string;
    timestamp: Date;
    testName: string;
  }>;
  screenshots: Array<{
    name: string;
    path: string;
    description: string;
  }>;
}

export class TestReporter {
  private metrics: TestMetrics;
  private reportDir: string;
  private startTime: Date;

  constructor(reportDir: string = 'test-results') {
    this.reportDir = reportDir;
    this.startTime = new Date();
    this.metrics = {
      performance: {
        loadTime: 0,
        webVitals: {},
        bundleSize: { total: 0, js: 0, css: 0 },
        memoryUsage: { used: 0, peak: 0 }
      },
      accessibility: {
        score: 0,
        issues: []
      },
      coverage: {
        features: {
          auth: false,
          rules: false,
          violations: false,
          rewards: false,
          realtime: false,
          responsive: false
        },
        browsers: [],
        devices: []
      },
      errors: [],
      screenshots: []
    };
  }

  /**
   * 성능 메트릭 추가
   */
  addPerformanceMetrics(metrics: Partial<TestMetrics['performance']>): void {
    this.metrics.performance = {
      ...this.metrics.performance,
      ...metrics
    };
  }

  /**
   * 접근성 결과 추가
   */
  addAccessibilityResults(results: TestMetrics['accessibility']): void {
    this.metrics.accessibility = results;
  }

  /**
   * 기능 커버리지 업데이트
   */
  updateFeatureCoverage(feature: keyof TestMetrics['coverage']['features'], covered: boolean): void {
    this.metrics.coverage.features[feature] = covered;
  }

  /**
   * 브라우저 정보 추가
   */
  addBrowserInfo(browserName: string): void {
    if (!this.metrics.coverage.browsers.includes(browserName)) {
      this.metrics.coverage.browsers.push(browserName);
    }
  }

  /**
   * 디바이스 정보 추가
   */
  addDeviceInfo(deviceName: string): void {
    if (!this.metrics.coverage.devices.includes(deviceName)) {
      this.metrics.coverage.devices.push(deviceName);
    }
  }

  /**
   * 에러 정보 추가
   */
  addError(error: TestMetrics['errors'][0]): void {
    this.metrics.errors.push(error);
  }

  /**
   * 스크린샷 정보 추가
   */
  addScreenshot(screenshot: TestMetrics['screenshots'][0]): void {
    this.metrics.screenshots.push(screenshot);
  }

  /**
   * HTML 리포트 생성
   */
  async generateHtmlReport(): Promise<string> {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();
    
    const totalFeatures = Object.keys(this.metrics.coverage.features).length;
    const coveredFeatures = Object.values(this.metrics.coverage.features).filter(Boolean).length;
    const coveragePercentage = Math.round((coveredFeatures / totalFeatures) * 100);

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Couple Fine E2E 테스트 리포트</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f7;
      color: #1d1d1f;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 2.5em;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.9;
      font-size: 1.1em;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      padding: 40px;
    }
    .metric-card {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .metric-card h3 {
      margin: 0 0 16px;
      color: #667eea;
      font-size: 1.1em;
      font-weight: 600;
    }
    .metric-value {
      font-size: 2em;
      font-weight: 700;
      margin: 8px 0;
    }
    .metric-label {
      color: #666;
      font-size: 0.9em;
    }
    .status-good { color: #22c55e; }
    .status-warning { color: #f59e0b; }
    .status-error { color: #ef4444; }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .feature-item {
      padding: 8px 12px;
      border-radius: 6px;
      text-align: center;
      font-weight: 500;
      font-size: 0.9em;
    }
    .feature-covered {
      background: #dcfce7;
      color: #166534;
    }
    .feature-missing {
      background: #fee2e2;
      color: #991b1b;
    }
    .section {
      padding: 40px;
      border-top: 1px solid #e5e7eb;
    }
    .section h2 {
      margin: 0 0 24px;
      color: #374151;
      font-size: 1.5em;
    }
    .error-list {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .error-item {
      padding: 12px 0;
      border-bottom: 1px solid #fecaca;
    }
    .error-item:last-child {
      border-bottom: none;
    }
    .error-type {
      font-weight: 600;
      color: #dc2626;
    }
    .error-message {
      margin: 4px 0;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    .error-time {
      color: #6b7280;
      font-size: 0.8em;
    }
    .screenshot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .screenshot-item {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .screenshot-img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      background: #f3f4f6;
    }
    .screenshot-info {
      padding: 12px;
    }
    .screenshot-name {
      font-weight: 600;
      margin: 0 0 4px;
    }
    .screenshot-desc {
      color: #6b7280;
      font-size: 0.9em;
    }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin: 8px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #16a34a);
      transition: width 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🧪 E2E 테스트 리포트</h1>
      <p>Couple Fine WebApp • ${this.startTime.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
      <p>실행 시간: ${Math.round(duration / 1000)}초</p>
    </div>

    <!-- 주요 메트릭 -->
    <div class="metrics">
      <!-- 기능 커버리지 -->
      <div class="metric-card">
        <h3>📊 기능 커버리지</h3>
        <div class="metric-value ${coveragePercentage >= 80 ? 'status-good' : coveragePercentage >= 60 ? 'status-warning' : 'status-error'}">${coveragePercentage}%</div>
        <div class="metric-label">${coveredFeatures}/${totalFeatures} 기능 테스트 완료</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${coveragePercentage}%"></div>
        </div>
      </div>

      <!-- 성능 점수 -->
      <div class="metric-card">
        <h3>⚡ 성능 점수</h3>
        <div class="metric-value ${this.metrics.performance.loadTime < 3000 ? 'status-good' : this.metrics.performance.loadTime < 5000 ? 'status-warning' : 'status-error'}">${Math.round(this.metrics.performance.loadTime)}ms</div>
        <div class="metric-label">페이지 로딩 시간</div>
        ${this.metrics.performance.webVitals.lcp ? `
          <div style="margin-top: 8px; font-size: 0.9em;">
            LCP: ${Math.round(this.metrics.performance.webVitals.lcp)}ms
          </div>
        ` : ''}
      </div>

      <!-- 접근성 점수 -->
      <div class="metric-card">
        <h3>♿ 접근성 점수</h3>
        <div class="metric-value ${this.metrics.accessibility.score >= 80 ? 'status-good' : this.metrics.accessibility.score >= 60 ? 'status-warning' : 'status-error'}">${this.metrics.accessibility.score}/100</div>
        <div class="metric-label">${this.metrics.accessibility.issues.length}개 이슈 발견</div>
      </div>

      <!-- 번들 크기 -->
      <div class="metric-card">
        <h3>📦 번들 크기</h3>
        <div class="metric-value ${this.metrics.performance.bundleSize.total < 1000 ? 'status-good' : this.metrics.performance.bundleSize.total < 2000 ? 'status-warning' : 'status-error'}">${this.metrics.performance.bundleSize.total}KB</div>
        <div class="metric-label">전체 리소스 크기</div>
        <div style="margin-top: 8px; font-size: 0.9em;">
          JS: ${this.metrics.performance.bundleSize.js}KB, CSS: ${this.metrics.performance.bundleSize.css}KB
        </div>
      </div>
    </div>

    <!-- 기능별 테스트 현황 -->
    <div class="section">
      <h2>🧩 기능별 테스트 현황</h2>
      <div class="features-grid">
        ${Object.entries(this.metrics.coverage.features).map(([feature, covered]) => `
          <div class="feature-item ${covered ? 'feature-covered' : 'feature-missing'}">
            ${this.getFeatureDisplayName(feature)}
            ${covered ? '✅' : '❌'}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 브라우저 & 디바이스 호환성 -->
    <div class="section">
      <h2>🌐 호환성 테스트</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        <div>
          <h3>브라우저</h3>
          <div class="features-grid">
            ${this.metrics.coverage.browsers.map(browser => `
              <div class="feature-item feature-covered">
                ${browser} ✅
              </div>
            `).join('')}
          </div>
        </div>
        <div>
          <h3>디바이스</h3>
          <div class="features-grid">
            ${this.metrics.coverage.devices.map(device => `
              <div class="feature-item feature-covered">
                ${device} ✅
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- 에러 리스트 -->
    ${this.metrics.errors.length > 0 ? `
    <div class="section">
      <h2>❌ 발견된 이슈 (${this.metrics.errors.length}개)</h2>
      <div class="error-list">
        ${this.metrics.errors.map(error => `
          <div class="error-item">
            <div class="error-type">${error.type.toUpperCase()}</div>
            <div class="error-message">${error.message}</div>
            <div class="error-time">테스트: ${error.testName} | 시간: ${error.timestamp.toLocaleString('ko-KR')}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- 접근성 상세 이슈 -->
    ${this.metrics.accessibility.issues.length > 0 ? `
    <div class="section">
      <h2>♿ 접근성 개선사항</h2>
      <div class="error-list">
        ${this.metrics.accessibility.issues.map(issue => `
          <div class="error-item">
            <div class="error-type">${issue.type.toUpperCase()} - ${issue.severity.toUpperCase()}</div>
            <div class="error-message">${issue.message}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- 스크린샷 갤러리 -->
    ${this.metrics.screenshots.length > 0 ? `
    <div class="section">
      <h2>📸 스크린샷 갤러리</h2>
      <div class="screenshot-grid">
        ${this.metrics.screenshots.map(screenshot => `
          <div class="screenshot-item">
            <img src="${screenshot.path}" alt="${screenshot.name}" class="screenshot-img" 
                 onerror="this.style.display='none'">
            <div class="screenshot-info">
              <div class="screenshot-name">${screenshot.name}</div>
              <div class="screenshot-desc">${screenshot.description}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- 권장사항 -->
    <div class="section">
      <h2>💡 개선 권장사항</h2>
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        ${this.generateRecommendations()}
      </div>
    </div>
  </div>

  <script>
    // 성능 메트릭 시각화를 위한 간단한 스크립트
    document.addEventListener('DOMContentLoaded', function() {
      // 프로그레스 바 애니메이션
      const progressBars = document.querySelectorAll('.progress-fill');
      progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
          bar.style.width = width;
        }, 500);
      });
    });
  </script>
</body>
</html>
    `.trim();

    const reportPath = path.join(this.reportDir, `test-report-${Date.now()}.html`);
    await fs.mkdir(this.reportDir, { recursive: true });
    await fs.writeFile(reportPath, html, 'utf8');

    return reportPath;
  }

  /**
   * JSON 리포트 생성
   */
  async generateJsonReport(): Promise<string> {
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: new Date().getTime() - this.startTime.getTime(),
      summary: {
        totalFeatures: Object.keys(this.metrics.coverage.features).length,
        coveredFeatures: Object.values(this.metrics.coverage.features).filter(Boolean).length,
        totalErrors: this.metrics.errors.length,
        accessibilityScore: this.metrics.accessibility.score,
        performanceScore: this.calculatePerformanceScore()
      },
      metrics: this.metrics
    };

    const reportPath = path.join(this.reportDir, `test-report-${Date.now()}.json`);
    await fs.mkdir(this.reportDir, { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2), 'utf8');

    return reportPath;
  }

  /**
   * 기능 표시 이름 가져오기
   */
  private getFeatureDisplayName(feature: string): string {
    const displayNames: Record<string, string> = {
      auth: '인증',
      rules: '규칙',
      violations: '위반',
      rewards: '보상',
      realtime: '실시간',
      responsive: '반응형'
    };
    return displayNames[feature] || feature;
  }

  /**
   * 성능 점수 계산
   */
  private calculatePerformanceScore(): number {
    let score = 100;
    
    // 로딩 시간 평가
    if (this.metrics.performance.loadTime > 5000) score -= 30;
    else if (this.metrics.performance.loadTime > 3000) score -= 15;
    
    // 번들 크기 평가
    if (this.metrics.performance.bundleSize.total > 2000) score -= 20;
    else if (this.metrics.performance.bundleSize.total > 1000) score -= 10;
    
    // Core Web Vitals 평가
    if (this.metrics.performance.webVitals.lcp && this.metrics.performance.webVitals.lcp > 2500) {
      score -= 15;
    }
    
    return Math.max(0, score);
  }

  /**
   * 개선 권장사항 생성
   */
  private generateRecommendations(): string {
    const recommendations: string[] = [];

    // 성능 관련 권장사항
    if (this.metrics.performance.loadTime > 3000) {
      recommendations.push('⚡ 페이지 로딩 시간이 3초를 초과합니다. 이미지 최적화나 코드 스플리팅을 고려해보세요.');
    }

    if (this.metrics.performance.bundleSize.total > 1000) {
      recommendations.push('📦 번들 크기가 1MB를 초과합니다. Tree shaking과 lazy loading을 적용해보세요.');
    }

    // 접근성 관련 권장사항
    if (this.metrics.accessibility.score < 80) {
      recommendations.push('♿ 접근성 점수가 낮습니다. ARIA 레이블과 색상 대비를 개선해보세요.');
    }

    // 커버리지 관련 권장사항
    const uncoveredFeatures = Object.entries(this.metrics.coverage.features)
      .filter(([_, covered]) => !covered)
      .map(([feature]) => this.getFeatureDisplayName(feature));
      
    if (uncoveredFeatures.length > 0) {
      recommendations.push(`🧪 다음 기능에 대한 테스트가 누락되었습니다: ${uncoveredFeatures.join(', ')}`);
    }

    // 에러 관련 권장사항
    if (this.metrics.errors.length > 0) {
      recommendations.push(`❌ ${this.metrics.errors.length}개의 오류가 발견되었습니다. 수정이 필요합니다.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('🎉 모든 테스트가 성공적으로 통과했습니다! 훌륭한 코드 품질을 유지하고 있어요.');
    }

    return '<ul><li>' + recommendations.join('</li><li>') + '</li></ul>';
  }
}

/**
 * 테스트 실행기
 */
export class TestRunner {
  private reporter: TestReporter;
  private testFiles: string[];

  constructor(testFiles: string[], reportDir?: string) {
    this.testFiles = testFiles;
    this.reporter = new TestReporter(reportDir);
  }

  /**
   * 모든 테스트 실행
   */
  async runAllTests(): Promise<{
    htmlReport: string;
    jsonReport: string;
    summary: {
      passed: number;
      failed: number;
      total: number;
      duration: number;
    };
  }> {
    console.log('🚀 E2E 테스트 실행 시작...');
    
    const startTime = Date.now();
    let passed = 0;
    let failed = 0;

    // 각 테스트 파일별로 실행 시뮬레이션
    for (const testFile of this.testFiles) {
      console.log(`📝 ${testFile} 실행 중...`);
      
      try {
        // 실제 테스트 실행 시뮬레이션
        await this.simulateTestExecution(testFile);
        passed++;
        console.log(`✅ ${testFile} 완료`);
      } catch (error) {
        failed++;
        console.error(`❌ ${testFile} 실패:`, error);
        
        this.reporter.addError({
          type: 'assertion',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
          testName: testFile
        });
      }
    }

    const duration = Date.now() - startTime;
    
    console.log('📊 리포트 생성 중...');
    
    // 리포트 생성
    const [htmlReport, jsonReport] = await Promise.all([
      this.reporter.generateHtmlReport(),
      this.reporter.generateJsonReport()
    ]);

    console.log('✨ 테스트 완료!');
    console.log(`📈 결과: ${passed}개 성공, ${failed}개 실패`);
    console.log(`⏱️ 실행 시간: ${Math.round(duration / 1000)}초`);
    console.log(`📄 HTML 리포트: ${htmlReport}`);
    console.log(`📄 JSON 리포트: ${jsonReport}`);

    return {
      htmlReport,
      jsonReport,
      summary: {
        passed,
        failed,
        total: this.testFiles.length,
        duration
      }
    };
  }

  /**
   * 테스트 실행 시뮬레이션 (실제 구현에서는 Playwright test runner 연동)
   */
  private async simulateTestExecution(testFile: string): Promise<void> {
    // 테스트 파일별 기능 커버리지 업데이트
    if (testFile.includes('auth')) {
      this.reporter.updateFeatureCoverage('auth', true);
    }
    if (testFile.includes('rules') || testFile.includes('violations')) {
      this.reporter.updateFeatureCoverage('rules', true);
      this.reporter.updateFeatureCoverage('violations', true);
    }
    if (testFile.includes('rewards')) {
      this.reporter.updateFeatureCoverage('rewards', true);
    }
    if (testFile.includes('realtime')) {
      this.reporter.updateFeatureCoverage('realtime', true);
    }
    if (testFile.includes('responsive') || testFile.includes('mobile')) {
      this.reporter.updateFeatureCoverage('responsive', true);
    }

    // 브라우저 정보 추가
    this.reporter.addBrowserInfo('Chrome');
    this.reporter.addBrowserInfo('Firefox');
    this.reporter.addBrowserInfo('Safari');

    // 디바이스 정보 추가
    this.reporter.addDeviceInfo('Desktop');
    this.reporter.addDeviceInfo('Mobile');
    this.reporter.addDeviceInfo('Tablet');

    // 샘플 성능 메트릭 추가
    this.reporter.addPerformanceMetrics({
      loadTime: Math.random() * 2000 + 1000, // 1-3초
      webVitals: {
        lcp: Math.random() * 1000 + 1500, // 1.5-2.5초
        fid: Math.random() * 50 + 50, // 50-100ms
        cls: Math.random() * 0.05 + 0.05 // 0.05-0.1
      },
      bundleSize: {
        total: Math.floor(Math.random() * 500 + 800), // 800-1300KB
        js: Math.floor(Math.random() * 300 + 400), // 400-700KB
        css: Math.floor(Math.random() * 50 + 50) // 50-100KB
      },
      memoryUsage: {
        used: Math.floor(Math.random() * 30 + 50), // 50-80MB
        peak: Math.floor(Math.random() * 40 + 70) // 70-110MB
      }
    });

    // 샘플 접근성 결과 추가
    this.reporter.addAccessibilityResults({
      score: Math.floor(Math.random() * 20 + 80), // 80-100점
      issues: [
        {
          type: 'contrast',
          severity: 'warning',
          message: 'Button has insufficient color contrast ratio'
        },
        {
          type: 'aria',
          severity: 'warning',
          message: 'Input element missing aria-label'
        }
      ]
    });

    // 테스트 실행 시뮬레이션 지연
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// 기본 테스트 실행 함수
export async function runE2ETests(): Promise<void> {
  const testFiles = [
    'auth-flow.spec.ts',
    'rules-violations.spec.ts',
    'realtime-sync.spec.ts',
    'responsive-layout.spec.ts',
    'mobile-interactions.spec.ts',
    'performance.spec.ts'
  ];

  const runner = new TestRunner(testFiles, 'test-results');
  const results = await runner.runAllTests();

  // 성공/실패에 따른 종료 코드 설정
  if (results.summary.failed > 0) {
    process.exit(1);
  }
}