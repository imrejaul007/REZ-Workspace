#!/usr/bin/env python3
"""
RestaurantHub Performance Bottleneck Analysis Tool

Analyzes load testing results to identify performance bottlenecks,
system limits, and scalability issues for 10,000+ concurrent users.

Usage:
    python analyze-performance-bottlenecks.py [OPTIONS]
"""

import json
import sys
import os
import argparse
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

class PerformanceAnalyzer:
    """Comprehensive performance analysis tool for RestaurantHub load testing results."""

    def __init__(self, results_dir: str):
        self.results_dir = Path(results_dir)
        self.analysis_results = {}
        self.bottlenecks = {}
        self.recommendations = []

    def analyze_all_results(self) -> Dict:
        """Run comprehensive analysis on all test results."""
        print("🔍 Starting comprehensive performance analysis...")

        # Find all result files
        result_files = self._find_result_files()

        if not result_files:
            print("❌ No result files found!")
            return {}

        print(f"📊 Found {len(result_files)} result files to analyze")

        # Analyze each test phase
        for file_path in result_files:
            phase_name = self._extract_phase_name(file_path)
            print(f"  Analyzing {phase_name}...")

            phase_results = self._analyze_phase(file_path, phase_name)
            self.analysis_results[phase_name] = phase_results

        # Perform comprehensive analysis
        self._analyze_performance_trends()
        self._identify_bottlenecks()
        self._analyze_scalability_limits()
        self._generate_recommendations()

        # Generate reports
        self._generate_analysis_report()
        self._create_visualizations()

        return self.analysis_results

    def _find_result_files(self) -> List[Path]:
        """Find all K6 result JSON files."""
        result_files = []

        # Search for JSON files in results directory
        for pattern in ['*.json', '**/*.json']:
            result_files.extend(self.results_dir.glob(pattern))

        # Filter for K6 result files (contain metrics data)
        valid_files = []
        for file_path in result_files:
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    # Check if it's a K6 summary file
                    if 'metrics' in data and 'http_req_duration' in data.get('metrics', {}):
                        valid_files.append(file_path)
            except (json.JSONDecodeError, KeyError, IOError):
                continue

        return valid_files

    def _extract_phase_name(self, file_path: Path) -> str:
        """Extract test phase name from file path."""
        file_name = file_path.stem

        # Common phase patterns
        phase_patterns = {
            'baseline': 'Baseline',
            'load': 'Load Test',
            'stress': 'Stress Test',
            'peak': 'Peak Load',
            'spike': 'Spike Test',
            'endurance': 'Endurance Test',
            'database': 'Database Stress'
        }

        for pattern, name in phase_patterns.items():
            if pattern in file_name.lower():
                return name

        return file_name.replace('-', ' ').title()

    def _analyze_phase(self, file_path: Path, phase_name: str) -> Dict:
        """Analyze individual test phase results."""
        with open(file_path, 'r') as f:
            data = json.load(f)

        metrics = data.get('metrics', {})

        # Extract key performance metrics
        analysis = {
            'file_path': str(file_path),
            'timestamp': data.get('timestamp', ''),
            'duration': self._safe_get_metric(metrics, 'iteration_duration', 'values', 'avg'),
            'response_times': {
                'avg': self._safe_get_metric(metrics, 'http_req_duration', 'values', 'avg'),
                'min': self._safe_get_metric(metrics, 'http_req_duration', 'values', 'min'),
                'max': self._safe_get_metric(metrics, 'http_req_duration', 'values', 'max'),
                'p50': self._safe_get_metric(metrics, 'http_req_duration', 'values', 'med'),
                'p90': self._safe_get_metric(metrics, 'http_req_duration', 'values', 'p(90)'),
                'p95': self._safe_get_metric(metrics, 'http_req_duration', 'values', 'p(95)'),
                'p99': self._safe_get_metric(metrics, 'http_req_duration', 'values', 'p(99)'),
            },
            'throughput': {
                'requests_per_second': self._safe_get_metric(metrics, 'http_reqs', 'values', 'rate'),
                'total_requests': self._safe_get_metric(metrics, 'http_reqs', 'values', 'count'),
            },
            'errors': {
                'rate': self._safe_get_metric(metrics, 'http_req_failed', 'values', 'rate'),
                'count': self._safe_get_metric(metrics, 'http_req_failed', 'values', 'count'),
            },
            'users': {
                'max_vus': self._safe_get_metric(metrics, 'vus', 'values', 'max'),
                'avg_vus': self._safe_get_metric(metrics, 'vus', 'values', 'value'),
            },
            'custom_metrics': self._extract_custom_metrics(metrics)
        }

        # Calculate performance score
        analysis['performance_score'] = self._calculate_performance_score(analysis)

        # Identify phase-specific issues
        analysis['issues'] = self._identify_phase_issues(analysis, phase_name)

        return analysis

    def _safe_get_metric(self, metrics: Dict, metric_name: str, *keys) -> Optional[float]:
        """Safely extract metric value with nested keys."""
        try:
            value = metrics[metric_name]
            for key in keys:
                value = value[key]
            return float(value) if value is not None else None
        except (KeyError, TypeError, ValueError):
            return None

    def _extract_custom_metrics(self, metrics: Dict) -> Dict:
        """Extract custom application metrics."""
        custom_metrics = {}

        # Define custom metric patterns
        custom_patterns = [
            'auth_failures',
            'api_response_time',
            'db_connection_errors',
            'memory_usage_mb',
            'concurrent_users',
            'successful_transactions',
            'failed_transactions'
        ]

        for pattern in custom_patterns:
            if pattern in metrics:
                metric_data = metrics[pattern]
                custom_metrics[pattern] = {
                    'rate': metric_data.get('values', {}).get('rate'),
                    'count': metric_data.get('values', {}).get('count'),
                    'value': metric_data.get('values', {}).get('value')
                }

        return custom_metrics

    def _calculate_performance_score(self, analysis: Dict) -> float:
        """Calculate overall performance score (0-100)."""
        score = 100.0

        # Response time penalty
        p95_time = analysis['response_times']['p95']
        if p95_time:
            if p95_time > 5000:  # 5 seconds
                score -= 40
            elif p95_time > 2000:  # 2 seconds
                score -= 20
            elif p95_time > 1000:  # 1 second
                score -= 10

        # Error rate penalty
        error_rate = analysis['errors']['rate']
        if error_rate:
            if error_rate > 0.1:  # 10%
                score -= 30
            elif error_rate > 0.05:  # 5%
                score -= 15
            elif error_rate > 0.01:  # 1%
                score -= 5

        # Throughput consideration
        throughput = analysis['throughput']['requests_per_second']
        if throughput and throughput < 50:  # Less than 50 req/s
            score -= 15

        return max(0, score)

    def _identify_phase_issues(self, analysis: Dict, phase_name: str) -> List[str]:
        """Identify specific issues in test phase."""
        issues = []

        # Response time issues
        p95_time = analysis['response_times']['p95']
        if p95_time and p95_time > 2000:
            issues.append(f"High P95 response time: {p95_time:.0f}ms")

        # Error rate issues
        error_rate = analysis['errors']['rate']
        if error_rate and error_rate > 0.05:
            issues.append(f"High error rate: {error_rate:.2%}")

        # Throughput issues
        throughput = analysis['throughput']['requests_per_second']
        if throughput and throughput < 100:
            issues.append(f"Low throughput: {throughput:.0f} req/s")

        # Custom metric issues
        custom_metrics = analysis['custom_metrics']

        if 'auth_failures' in custom_metrics:
            auth_failure_rate = custom_metrics['auth_failures'].get('rate', 0)
            if auth_failure_rate and auth_failure_rate > 0.02:
                issues.append(f"High auth failure rate: {auth_failure_rate:.2%}")

        if 'memory_usage_mb' in custom_metrics:
            memory_usage = custom_metrics['memory_usage_mb'].get('value', 0)
            if memory_usage and memory_usage > 2000:
                issues.append(f"High memory usage: {memory_usage:.0f}MB")

        return issues

    def _analyze_performance_trends(self):
        """Analyze performance trends across test phases."""
        print("📈 Analyzing performance trends...")

        if len(self.analysis_results) < 2:
            print("  ⚠️  Insufficient data for trend analysis")
            return

        # Extract trend data
        phases = list(self.analysis_results.keys())
        response_times = []
        error_rates = []
        throughputs = []
        scores = []

        for phase in phases:
            analysis = self.analysis_results[phase]
            response_times.append(analysis['response_times']['p95'] or 0)
            error_rates.append(analysis['errors']['rate'] or 0)
            throughputs.append(analysis['throughput']['requests_per_second'] or 0)
            scores.append(analysis['performance_score'])

        # Calculate trends
        trends = {
            'response_time_trend': self._calculate_trend(response_times),
            'error_rate_trend': self._calculate_trend(error_rates),
            'throughput_trend': self._calculate_trend(throughputs),
            'score_trend': self._calculate_trend(scores)
        }

        self.analysis_results['trends'] = trends

        # Identify trend issues
        if trends['response_time_trend'] > 0.2:
            self.bottlenecks['increasing_response_time'] = "Response times increasing across test phases"

        if trends['error_rate_trend'] > 0.1:
            self.bottlenecks['increasing_errors'] = "Error rates increasing with load"

        if trends['throughput_trend'] < -0.1:
            self.bottlenecks['decreasing_throughput'] = "Throughput declining under load"

    def _calculate_trend(self, values: List[float]) -> float:
        """Calculate trend direction (-1 to 1, negative = decreasing, positive = increasing)."""
        if len(values) < 2:
            return 0

        # Simple linear regression slope
        x = np.arange(len(values))
        y = np.array(values)

        if np.std(x) == 0 or np.std(y) == 0:
            return 0

        correlation = np.corrcoef(x, y)[0, 1]
        return correlation if not np.isnan(correlation) else 0

    def _identify_bottlenecks(self):
        """Identify system bottlenecks from analysis results."""
        print("🔍 Identifying system bottlenecks...")

        # Response time bottlenecks
        high_response_phases = []
        for phase, analysis in self.analysis_results.items():
            if isinstance(analysis, dict) and analysis.get('response_times', {}).get('p95', 0) > 2000:
                high_response_phases.append(phase)

        if high_response_phases:
            self.bottlenecks['response_time'] = {
                'description': "High response times detected",
                'affected_phases': high_response_phases,
                'severity': 'high' if len(high_response_phases) > len(self.analysis_results) / 2 else 'medium'
            }

        # Error rate bottlenecks
        high_error_phases = []
        for phase, analysis in self.analysis_results.items():
            if isinstance(analysis, dict) and analysis.get('errors', {}).get('rate', 0) > 0.05:
                high_error_phases.append(phase)

        if high_error_phases:
            self.bottlenecks['error_rate'] = {
                'description': "High error rates under load",
                'affected_phases': high_error_phases,
                'severity': 'critical' if any('stress' in phase.lower() or 'spike' in phase.lower()
                                           for phase in high_error_phases) else 'high'
            }

        # Throughput bottlenecks
        low_throughput_phases = []
        for phase, analysis in self.analysis_results.items():
            if isinstance(analysis, dict) and analysis.get('throughput', {}).get('requests_per_second', 0) < 100:
                low_throughput_phases.append(phase)

        if low_throughput_phases:
            self.bottlenecks['throughput'] = {
                'description': "Low throughput capacity",
                'affected_phases': low_throughput_phases,
                'severity': 'high'
            }

    def _analyze_scalability_limits(self):
        """Analyze system scalability limits."""
        print("📊 Analyzing scalability limits...")

        # Find breaking points
        breaking_points = {}

        for phase, analysis in self.analysis_results.items():
            if not isinstance(analysis, dict):
                continue

            max_users = analysis.get('users', {}).get('max_vus', 0)
            error_rate = analysis.get('errors', {}).get('rate', 0)
            p95_response = analysis.get('response_times', {}).get('p95', 0)

            # Define breaking point criteria
            if error_rate > 0.1 or p95_response > 5000:
                breaking_points[phase] = {
                    'max_users': max_users,
                    'error_rate': error_rate,
                    'response_time': p95_response,
                    'reason': []
                }

                if error_rate > 0.1:
                    breaking_points[phase]['reason'].append(f"High error rate: {error_rate:.2%}")
                if p95_response > 5000:
                    breaking_points[phase]['reason'].append(f"High response time: {p95_response:.0f}ms")

        if breaking_points:
            self.bottlenecks['scalability_limits'] = breaking_points

            # Estimate maximum capacity
            max_stable_users = 0
            for phase, analysis in self.analysis_results.items():
                if isinstance(analysis, dict) and phase not in breaking_points:
                    users = analysis.get('users', {}).get('max_vus', 0)
                    max_stable_users = max(max_stable_users, users)

            self.analysis_results['max_stable_capacity'] = max_stable_users

            print(f"  📈 Estimated maximum stable capacity: {max_stable_users} concurrent users")
        else:
            print("  ✅ No clear breaking points identified within test range")

    def _generate_recommendations(self):
        """Generate actionable performance recommendations."""
        print("💡 Generating optimization recommendations...")

        # Database optimization recommendations
        if any('database' in bottleneck.lower() for bottleneck in self.bottlenecks.keys()):
            self.recommendations.append({
                'category': 'Database',
                'priority': 'High',
                'title': 'Optimize Database Performance',
                'description': 'Database operations are causing performance bottlenecks',
                'actions': [
                    'Increase database connection pool size',
                    'Add indexes for frequently queried columns',
                    'Implement database read replicas',
                    'Optimize slow queries identified in logs',
                    'Consider database connection pooling optimization'
                ]
            })

        # Response time recommendations
        if 'response_time' in self.bottlenecks:
            severity = self.bottlenecks['response_time'].get('severity', 'medium')
            self.recommendations.append({
                'category': 'Performance',
                'priority': 'High' if severity == 'high' else 'Medium',
                'title': 'Reduce API Response Times',
                'description': 'API response times exceed acceptable thresholds',
                'actions': [
                    'Implement response caching for frequently accessed data',
                    'Optimize database queries and add proper indexes',
                    'Consider implementing async processing for heavy operations',
                    'Enable gzip compression for API responses',
                    'Review and optimize business logic in slow endpoints'
                ]
            })

        # Error rate recommendations
        if 'error_rate' in self.bottlenecks:
            severity = self.bottlenecks['error_rate'].get('severity', 'medium')
            self.recommendations.append({
                'category': 'Reliability',
                'priority': 'Critical' if severity == 'critical' else 'High',
                'title': 'Address High Error Rates',
                'description': 'System experiencing high error rates under load',
                'actions': [
                    'Implement circuit breaker patterns',
                    'Add proper error handling and retry mechanisms',
                    'Increase timeout values for external services',
                    'Scale infrastructure to handle peak loads',
                    'Implement health checks and graceful degradation'
                ]
            })

        # Throughput recommendations
        if 'throughput' in self.bottlenecks:
            self.recommendations.append({
                'category': 'Scalability',
                'priority': 'High',
                'title': 'Improve System Throughput',
                'description': 'System throughput below expected levels',
                'actions': [
                    'Implement horizontal scaling with load balancers',
                    'Optimize resource allocation (CPU, memory)',
                    'Consider implementing request queuing',
                    'Review and optimize critical path performance',
                    'Implement efficient caching strategies'
                ]
            })

        # Scalability recommendations
        if 'scalability_limits' in self.bottlenecks:
            max_capacity = self.analysis_results.get('max_stable_capacity', 0)
            self.recommendations.append({
                'category': 'Scalability',
                'priority': 'Critical',
                'title': 'Scale Beyond Current Limits',
                'description': f'System reaches limits at ~{max_capacity} concurrent users',
                'actions': [
                    'Implement auto-scaling based on metrics',
                    'Design microservices architecture for better scalability',
                    'Implement distributed caching (Redis cluster)',
                    'Consider CDN implementation for static content',
                    'Plan for multi-region deployment architecture'
                ]
            })

        # General recommendations
        if len(self.recommendations) == 0:
            self.recommendations.append({
                'category': 'Optimization',
                'priority': 'Medium',
                'title': 'Performance Optimization',
                'description': 'Continue optimizing for better performance',
                'actions': [
                    'Implement comprehensive monitoring and alerting',
                    'Set up performance regression testing',
                    'Optimize resource utilization',
                    'Review and update performance thresholds',
                    'Plan capacity based on growth projections'
                ]
            })

    def _generate_analysis_report(self):
        """Generate comprehensive analysis report."""
        print("📄 Generating analysis report...")

        report_path = self.results_dir / f"performance-analysis-{datetime.now().strftime('%Y%m%d-%H%M%S')}.md"

        with open(report_path, 'w') as f:
            f.write("# RestaurantHub Performance Analysis Report\n\n")
            f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

            # Executive Summary
            f.write("## Executive Summary\n\n")

            total_phases = len([k for k in self.analysis_results.keys() if k != 'trends'])
            avg_score = np.mean([
                analysis.get('performance_score', 0)
                for analysis in self.analysis_results.values()
                if isinstance(analysis, dict) and 'performance_score' in analysis
            ])

            f.write(f"- **Total Test Phases Analyzed:** {total_phases}\n")
            f.write(f"- **Average Performance Score:** {avg_score:.1f}/100\n")
            f.write(f"- **Critical Issues Found:** {len([b for b in self.bottlenecks.values() if isinstance(b, dict) and b.get('severity') == 'critical'])}\n")
            f.write(f"- **Total Recommendations:** {len(self.recommendations)}\n\n")

            if 'max_stable_capacity' in self.analysis_results:
                f.write(f"- **Estimated Max Stable Capacity:** {self.analysis_results['max_stable_capacity']} concurrent users\n\n")

            # Performance by Phase
            f.write("## Performance Analysis by Phase\n\n")

            for phase, analysis in self.analysis_results.items():
                if not isinstance(analysis, dict) or phase == 'trends':
                    continue

                f.write(f"### {phase}\n\n")

                response_times = analysis.get('response_times', {})
                errors = analysis.get('errors', {})
                throughput = analysis.get('throughput', {})
                score = analysis.get('performance_score', 0)

                f.write(f"- **Performance Score:** {score:.1f}/100\n")
                f.write(f"- **P95 Response Time:** {response_times.get('p95', 'N/A')}ms\n")
                f.write(f"- **Error Rate:** {errors.get('rate', 0):.2%}\n")
                f.write(f"- **Throughput:** {throughput.get('requests_per_second', 'N/A')} req/s\n")

                issues = analysis.get('issues', [])
                if issues:
                    f.write(f"- **Issues Identified:**\n")
                    for issue in issues:
                        f.write(f"  - {issue}\n")
                f.write("\n")

            # Bottlenecks
            f.write("## Identified Bottlenecks\n\n")

            if self.bottlenecks:
                for bottleneck, details in self.bottlenecks.items():
                    f.write(f"### {bottleneck.replace('_', ' ').title()}\n\n")

                    if isinstance(details, dict):
                        f.write(f"**Description:** {details.get('description', 'No description')}\n\n")

                        if 'severity' in details:
                            f.write(f"**Severity:** {details['severity'].title()}\n\n")

                        if 'affected_phases' in details:
                            f.write(f"**Affected Phases:** {', '.join(details['affected_phases'])}\n\n")
                    else:
                        f.write(f"{details}\n\n")
            else:
                f.write("No significant bottlenecks identified.\n\n")

            # Recommendations
            f.write("## Optimization Recommendations\n\n")

            for i, rec in enumerate(self.recommendations, 1):
                f.write(f"### {i}. {rec['title']} ({rec['priority']} Priority)\n\n")
                f.write(f"**Category:** {rec['category']}\n\n")
                f.write(f"**Description:** {rec['description']}\n\n")
                f.write("**Recommended Actions:**\n")

                for action in rec['actions']:
                    f.write(f"- {action}\n")
                f.write("\n")

            # Performance Metrics Summary
            f.write("## Performance Metrics Summary\n\n")
            f.write("| Phase | Score | P95 Response (ms) | Error Rate | Throughput (req/s) |\n")
            f.write("|-------|-------|-------------------|------------|--------------------|\n")

            for phase, analysis in self.analysis_results.items():
                if not isinstance(analysis, dict) or phase == 'trends':
                    continue

                score = analysis.get('performance_score', 0)
                p95 = analysis.get('response_times', {}).get('p95', 0)
                error_rate = analysis.get('errors', {}).get('rate', 0)
                throughput = analysis.get('throughput', {}).get('requests_per_second', 0)

                f.write(f"| {phase} | {score:.1f} | {p95:.0f} | {error_rate:.2%} | {throughput:.0f} |\n")

        print(f"  📄 Analysis report saved to: {report_path}")
        return report_path

    def _create_visualizations(self):
        """Create performance visualization charts."""
        print("📊 Creating performance visualizations...")

        try:
            # Set up the plotting style
            plt.style.use('default')
            sns.set_palette("husl")

            # Create visualization directory
            viz_dir = self.results_dir / "visualizations"
            viz_dir.mkdir(exist_ok=True)

            # Prepare data for visualization
            phases = []
            scores = []
            response_times = []
            error_rates = []
            throughputs = []

            for phase, analysis in self.analysis_results.items():
                if not isinstance(analysis, dict) or phase == 'trends':
                    continue

                phases.append(phase)
                scores.append(analysis.get('performance_score', 0))
                response_times.append(analysis.get('response_times', {}).get('p95', 0))
                error_rates.append(analysis.get('errors', {}).get('rate', 0) * 100)  # Convert to percentage
                throughputs.append(analysis.get('throughput', {}).get('requests_per_second', 0))

            if not phases:
                print("  ⚠️  No data available for visualization")
                return

            # Create performance overview chart
            fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
            fig.suptitle('RestaurantHub Performance Analysis Overview', fontsize=16, fontweight='bold')

            # Performance scores
            bars1 = ax1.bar(phases, scores, color='skyblue', alpha=0.7)
            ax1.set_title('Performance Scores by Phase', fontweight='bold')
            ax1.set_ylabel('Score (0-100)')
            ax1.set_ylim(0, 100)
            ax1.tick_params(axis='x', rotation=45)

            # Add score labels on bars
            for bar, score in zip(bars1, scores):
                height = bar.get_height()
                ax1.text(bar.get_x() + bar.get_width()/2., height + 1,
                        f'{score:.1f}', ha='center', va='bottom')

            # Response times
            bars2 = ax2.bar(phases, response_times, color='lightcoral', alpha=0.7)
            ax2.set_title('P95 Response Times by Phase', fontweight='bold')
            ax2.set_ylabel('Response Time (ms)')
            ax2.tick_params(axis='x', rotation=45)
            ax2.axhline(y=2000, color='red', linestyle='--', alpha=0.7, label='2s threshold')
            ax2.legend()

            # Error rates
            bars3 = ax3.bar(phases, error_rates, color='orange', alpha=0.7)
            ax3.set_title('Error Rates by Phase', fontweight='bold')
            ax3.set_ylabel('Error Rate (%)')
            ax3.tick_params(axis='x', rotation=45)
            ax3.axhline(y=5, color='red', linestyle='--', alpha=0.7, label='5% threshold')
            ax3.legend()

            # Throughput
            bars4 = ax4.bar(phases, throughputs, color='lightgreen', alpha=0.7)
            ax4.set_title('Throughput by Phase', fontweight='bold')
            ax4.set_ylabel('Requests per Second')
            ax4.tick_params(axis='x', rotation=45)
            ax4.axhline(y=100, color='green', linestyle='--', alpha=0.7, label='100 req/s target')
            ax4.legend()

            plt.tight_layout()
            chart_path = viz_dir / "performance-overview.png"
            plt.savefig(chart_path, dpi=300, bbox_inches='tight')
            plt.close()

            print(f"  📊 Performance overview chart saved to: {chart_path}")

            # Create trends chart if trend data exists
            if 'trends' in self.analysis_results and len(phases) > 1:
                self._create_trends_chart(viz_dir, phases, scores, response_times, error_rates, throughputs)

        except Exception as e:
            print(f"  ⚠️  Error creating visualizations: {e}")

    def _create_trends_chart(self, viz_dir: Path, phases: List[str], scores: List[float],
                           response_times: List[float], error_rates: List[float], throughputs: List[float]):
        """Create trend analysis charts."""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle('Performance Trends Analysis', fontsize=16, fontweight='bold')

        x = range(len(phases))

        # Performance score trend
        ax1.plot(x, scores, marker='o', linewidth=2, markersize=6, color='blue')
        ax1.set_title('Performance Score Trend', fontweight='bold')
        ax1.set_ylabel('Score (0-100)')
        ax1.set_xticks(x)
        ax1.set_xticklabels(phases, rotation=45)
        ax1.grid(True, alpha=0.3)

        # Response time trend
        ax2.plot(x, response_times, marker='s', linewidth=2, markersize=6, color='red')
        ax2.set_title('Response Time Trend', fontweight='bold')
        ax2.set_ylabel('P95 Response Time (ms)')
        ax2.set_xticks(x)
        ax2.set_xticklabels(phases, rotation=45)
        ax2.grid(True, alpha=0.3)
        ax2.axhline(y=2000, color='red', linestyle='--', alpha=0.5)

        # Error rate trend
        ax3.plot(x, error_rates, marker='^', linewidth=2, markersize=6, color='orange')
        ax3.set_title('Error Rate Trend', fontweight='bold')
        ax3.set_ylabel('Error Rate (%)')
        ax3.set_xticks(x)
        ax3.set_xticklabels(phases, rotation=45)
        ax3.grid(True, alpha=0.3)
        ax3.axhline(y=5, color='red', linestyle='--', alpha=0.5)

        # Throughput trend
        ax4.plot(x, throughputs, marker='D', linewidth=2, markersize=6, color='green')
        ax4.set_title('Throughput Trend', fontweight='bold')
        ax4.set_ylabel('Requests per Second')
        ax4.set_xticks(x)
        ax4.set_xticklabels(phases, rotation=45)
        ax4.grid(True, alpha=0.3)
        ax4.axhline(y=100, color='green', linestyle='--', alpha=0.5)

        plt.tight_layout()
        trends_chart_path = viz_dir / "performance-trends.png"
        plt.savefig(trends_chart_path, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"  📊 Performance trends chart saved to: {trends_chart_path}")

def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description="Analyze RestaurantHub performance test results and identify bottlenecks"
    )

    parser.add_argument(
        'results_dir',
        help='Directory containing K6 test results'
    )

    parser.add_argument(
        '--output',
        '-o',
        help='Output directory for analysis results (default: results_dir/analysis)'
    )

    parser.add_argument(
        '--format',
        choices=['markdown', 'json', 'both'],
        default='both',
        help='Output format for analysis results'
    )

    args = parser.parse_args()

    # Validate results directory
    results_dir = Path(args.results_dir)
    if not results_dir.exists():
        print(f"❌ Results directory does not exist: {results_dir}")
        sys.exit(1)

    print("🚀 RestaurantHub Performance Bottleneck Analysis Tool")
    print(f"📁 Analyzing results in: {results_dir}")
    print("")

    try:
        # Initialize analyzer
        analyzer = PerformanceAnalyzer(results_dir)

        # Run analysis
        results = analyzer.analyze_all_results()

        if results:
            print("")
            print("✅ Analysis completed successfully!")
            print("")
            print("📋 Summary:")
            print(f"  - Test phases analyzed: {len([k for k in results.keys() if k != 'trends'])}")
            print(f"  - Bottlenecks identified: {len(analyzer.bottlenecks)}")
            print(f"  - Recommendations generated: {len(analyzer.recommendations)}")

            if 'max_stable_capacity' in results:
                print(f"  - Estimated max stable capacity: {results['max_stable_capacity']} users")

            print("")
            print("📂 Generated files:")
            print(f"  - Analysis report: performance-analysis-*.md")
            print(f"  - Visualizations: visualizations/")
            print("")
            print("🔍 Next steps:")
            print("  1. Review the analysis report for detailed findings")
            print("  2. Examine performance visualizations")
            print("  3. Prioritize and implement optimization recommendations")
            print("  4. Plan follow-up performance testing")

        else:
            print("❌ No analysis results generated")
            sys.exit(1)

    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()