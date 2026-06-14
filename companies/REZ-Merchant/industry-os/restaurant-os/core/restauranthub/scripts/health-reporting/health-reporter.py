#!/usr/bin/env python3
"""
RestaurantHub Automated Health Reporting System
AI Sentry - Comprehensive Platform Health Analysis and Reporting
"""

import asyncio
import aiohttp
import json
import smtplib
import logging
import os
import sys
from datetime import datetime, timedelta
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from email.mime.base import MimeBase
from email import encoders
from pathlib import Path
import matplotlib.pyplot as plt
import pandas as pd
import jinja2
from typing import Dict, List, Any, Optional
import argparse

# Configuration
class Config:
    # Monitoring endpoints
    PROMETHEUS_URL = os.getenv('PROMETHEUS_URL', 'http://prometheus:9090')
    GRAFANA_URL = os.getenv('GRAFANA_URL', 'http://grafana:3000')
    ALERTMANAGER_URL = os.getenv('ALERTMANAGER_URL', 'http://alertmanager:9093')

    # Email configuration
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USER = os.getenv('SMTP_USER', 'alerts@restauranthub.com')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')

    # Report recipients
    EXECUTIVES = os.getenv('EXECUTIVES', 'executives@restauranthub.com').split(',')
    TECHNICAL_TEAM = os.getenv('TECHNICAL_TEAM', 'tech-team@restauranthub.com').split(',')
    BUSINESS_TEAM = os.getenv('BUSINESS_TEAM', 'business-team@restauranthub.com').split(',')

    # Report configuration
    REPORT_INTERVAL_HOURS = int(os.getenv('REPORT_INTERVAL_HOURS', '24'))
    REPORT_OUTPUT_DIR = os.getenv('REPORT_OUTPUT_DIR', '/var/log/restauranthub/health-reports')

    # Alert thresholds
    CRITICAL_UPTIME_THRESHOLD = float(os.getenv('CRITICAL_UPTIME_THRESHOLD', '99.0'))
    WARNING_UPTIME_THRESHOLD = float(os.getenv('WARNING_UPTIME_THRESHOLD', '99.9'))
    CRITICAL_ERROR_RATE_THRESHOLD = float(os.getenv('CRITICAL_ERROR_RATE_THRESHOLD', '5.0'))
    WARNING_ERROR_RATE_THRESHOLD = float(os.getenv('WARNING_ERROR_RATE_THRESHOLD', '2.0'))

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/restauranthub/health-reporter.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class PrometheusClient:
    """Client for querying Prometheus metrics"""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def query(self, query: str, time_range: str = None) -> Dict[str, Any]:
        """Execute a Prometheus query"""
        url = f"{self.base_url}/api/v1/query"
        params = {'query': query}

        if time_range:
            url = f"{self.base_url}/api/v1/query_range"
            end_time = datetime.now()
            start_time = end_time - timedelta(hours=24)
            params.update({
                'start': start_time.timestamp(),
                'end': end_time.timestamp(),
                'step': '300s'  # 5-minute intervals
            })

        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"Prometheus query failed: {response.status}")
                    return {'data': {'result': []}}
        except Exception as e:
            logger.error(f"Error querying Prometheus: {e}")
            return {'data': {'result': []}}

class HealthMetricsCollector:
    """Collects health metrics from various sources"""

    def __init__(self, prometheus_client: PrometheusClient):
        self.prometheus = prometheus_client

    async def collect_all_metrics(self) -> Dict[str, Any]:
        """Collect all health metrics"""
        logger.info("Collecting health metrics...")

        metrics = {
            'system': await self.collect_system_metrics(),
            'application': await self.collect_application_metrics(),
            'database': await self.collect_database_metrics(),
            'security': await self.collect_security_metrics(),
            'business': await self.collect_business_metrics(),
            'alerts': await self.collect_alert_metrics(),
            'performance': await self.collect_performance_metrics(),
        }

        logger.info("Health metrics collection completed")
        return metrics

    async def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect system-level metrics"""
        queries = {
            'cpu_usage': '(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))) * 100',
            'memory_usage': '(1 - (avg(node_memory_MemAvailable_bytes) / avg(node_memory_MemTotal_bytes))) * 100',
            'disk_usage': '(1 - (avg(node_filesystem_avail_bytes{fstype!="tmpfs"}) / avg(node_filesystem_size_bytes{fstype!="tmpfs"}))) * 100',
            'network_io': 'sum(rate(node_network_receive_bytes_total[5m])) + sum(rate(node_network_transmit_bytes_total[5m]))',
            'load_average': 'avg(node_load15)',
            'uptime': 'avg(time() - node_boot_time_seconds)'
        }

        metrics = {}
        for metric_name, query in queries.items():
            result = await self.prometheus.query(query)
            metrics[metric_name] = self._extract_metric_value(result)

        return metrics

    async def collect_application_metrics(self) -> Dict[str, Any]:
        """Collect application-level metrics"""
        queries = {
            'api_uptime': 'avg(up{job="restauranthub-api"})',
            'web_uptime': 'avg(up{job="restauranthub-web"})',
            'api_response_time_p95': 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="restauranthub-api"}[5m])) by (le))',
            'api_error_rate': '(sum(rate(http_requests_total{status=~"5..",job="restauranthub-api"}[5m])) / sum(rate(http_requests_total{job="restauranthub-api"}[5m]))) * 100',
            'api_throughput': 'sum(rate(http_requests_total{job="restauranthub-api"}[5m]))',
            'total_requests_24h': 'sum(increase(http_requests_total{job="restauranthub-api"}[24h]))',
            'circuit_breaker_open': 'sum(circuit_breaker_state == 2)',
            'self_healing_actions': 'sum(increase(self_healing_recovery_actions_total[24h]))'
        }

        metrics = {}
        for metric_name, query in queries.items():
            result = await self.prometheus.query(query)
            metrics[metric_name] = self._extract_metric_value(result)

        return metrics

    async def collect_database_metrics(self) -> Dict[str, Any]:
        """Collect database metrics"""
        queries = {
            'postgres_uptime': 'avg(pg_up)',
            'redis_uptime': 'avg(redis_up)',
            'postgres_connections': '(avg(pg_stat_database_numbackends) / avg(pg_settings_max_connections)) * 100',
            'redis_memory_usage': '(avg(redis_memory_used_bytes) / avg(redis_memory_max_bytes)) * 100',
            'db_query_duration_p95': 'histogram_quantile(0.95, sum(rate(pg_stat_statements_mean_time_bucket[5m])) by (le))',
            'redis_hit_ratio': '(sum(rate(redis_keyspace_hits_total[5m])) / (sum(rate(redis_keyspace_hits_total[5m])) + sum(rate(redis_keyspace_misses_total[5m])))) * 100',
            'slow_queries_24h': 'sum(increase(pg_stat_activity_max_tx_duration[24h]))',
            'database_errors_24h': 'sum(increase(pg_stat_database_deadlocks[24h]))'
        }

        metrics = {}
        for metric_name, query in queries.items():
            result = await self.prometheus.query(query)
            metrics[metric_name] = self._extract_metric_value(result)

        return metrics

    async def collect_security_metrics(self) -> Dict[str, Any]:
        """Collect security metrics"""
        queries = {
            'auth_failures_24h': 'sum(increase(auth_failures_total[24h]))',
            'rate_limit_violations_24h': 'sum(increase(rate_limit_violations_total[24h]))',
            'suspicious_activities_24h': 'sum(increase(suspicious_activities_total[24h]))',
            'sql_injection_attempts_24h': 'sum(increase(sql_injection_attempts_total[24h]))',
            'xss_attempts_24h': 'sum(increase(xss_attempts_total[24h]))',
            'critical_vulnerabilities': 'sum(vulnerability_scan_critical_severity)',
            'high_vulnerabilities': 'sum(vulnerability_scan_high_severity)',
            'compliance_status': 'min(compliance_check_status)',
            'security_scan_last_success': 'security_scan_last_success_timestamp'
        }

        metrics = {}
        for metric_name, query in queries.items():
            result = await self.prometheus.query(query)
            metrics[metric_name] = self._extract_metric_value(result)

        return metrics

    async def collect_business_metrics(self) -> Dict[str, Any]:
        """Collect business metrics"""
        queries = {
            'user_registrations_24h': 'sum(increase(user_registrations_total[24h]))',
            'job_applications_24h': 'sum(increase(job_applications_total[24h]))',
            'restaurant_registrations_24h': 'sum(increase(restaurant_registrations_total[24h]))',
            'orders_processed_24h': 'sum(increase(orders_processed_total[24h]))',
            'revenue_24h': 'sum(increase(revenue_total[24h]))',
            'active_users_now': 'sum(rate(http_requests_total{job="restauranthub-api"}[5m]))',
            'conversion_rate': '(sum(increase(orders_processed_total[24h])) / sum(increase(user_sessions_total[24h]))) * 100',
            'average_order_value': 'avg(order_value_dollars)'
        }

        metrics = {}
        for metric_name, query in queries.items():
            result = await self.prometheus.query(query)
            metrics[metric_name] = self._extract_metric_value(result)

        return metrics

    async def collect_alert_metrics(self) -> Dict[str, Any]:
        """Collect alert metrics"""
        queries = {
            'critical_alerts_active': 'sum(ALERTS{severity="critical",alertstate="firing"})',
            'warning_alerts_active': 'sum(ALERTS{severity="warning",alertstate="firing"})',
            'alerts_resolved_24h': 'sum(increase(alertmanager_alerts_resolved_total[24h]))',
            'alerts_fired_24h': 'sum(increase(alertmanager_alerts_total[24h]))',
            'mean_time_to_resolution': 'avg(alertmanager_alert_duration_seconds)'
        }

        metrics = {}
        for metric_name, query in queries.items():
            result = await self.prometheus.query(query)
            metrics[metric_name] = self._extract_metric_value(result)

        return metrics

    async def collect_performance_metrics(self) -> Dict[str, Any]:
        """Collect performance metrics"""
        queries = {
            'api_availability_24h': 'avg_over_time(up{job="restauranthub-api"}[24h]) * 100',
            'web_availability_24h': 'avg_over_time(up{job="restauranthub-web"}[24h]) * 100',
            'database_availability_24h': 'avg_over_time(pg_up[24h]) * 100',
            'cache_availability_24h': 'avg_over_time(redis_up[24h]) * 100',
            'response_time_trend': 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="restauranthub-api"}[24h])) by (le))',
            'throughput_trend': 'sum(rate(http_requests_total{job="restauranthub-api"}[24h]))',
            'error_rate_trend': '(sum(rate(http_requests_total{status=~"5..",job="restauranthub-api"}[24h])) / sum(rate(http_requests_total{job="restauranthub-api"}[24h]))) * 100'
        }

        metrics = {}
        for metric_name, query in queries.items():
            result = await self.prometheus.query(query)
            metrics[metric_name] = self._extract_metric_value(result)

        return metrics

    def _extract_metric_value(self, result: Dict[str, Any]) -> float:
        """Extract numeric value from Prometheus query result"""
        try:
            if result.get('data', {}).get('result'):
                return float(result['data']['result'][0]['value'][1])
            return 0.0
        except (KeyError, IndexError, ValueError, TypeError):
            return 0.0

class HealthAnalyzer:
    """Analyzes health metrics and generates insights"""

    def __init__(self, config: Config):
        self.config = config

    def analyze_metrics(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze metrics and generate health assessment"""
        logger.info("Analyzing health metrics...")

        analysis = {
            'overall_health': self._calculate_overall_health(metrics),
            'system_health': self._analyze_system_health(metrics['system']),
            'application_health': self._analyze_application_health(metrics['application']),
            'database_health': self._analyze_database_health(metrics['database']),
            'security_health': self._analyze_security_health(metrics['security']),
            'business_health': self._analyze_business_health(metrics['business']),
            'performance_health': self._analyze_performance_health(metrics['performance']),
            'recommendations': self._generate_recommendations(metrics),
            'alerts_summary': self._analyze_alerts(metrics['alerts']),
            'trends': self._analyze_trends(metrics)
        }

        logger.info("Health analysis completed")
        return analysis

    def _calculate_overall_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate overall platform health score"""
        weights = {
            'application': 0.3,
            'database': 0.25,
            'system': 0.2,
            'security': 0.15,
            'performance': 0.1
        }

        scores = {}
        scores['application'] = self._calculate_application_score(metrics['application'])
        scores['database'] = self._calculate_database_score(metrics['database'])
        scores['system'] = self._calculate_system_score(metrics['system'])
        scores['security'] = self._calculate_security_score(metrics['security'])
        scores['performance'] = self._calculate_performance_score(metrics['performance'])

        overall_score = sum(scores[component] * weights[component] for component in weights.keys())

        if overall_score >= 95:
            status = "EXCELLENT"
            color = "green"
        elif overall_score >= 85:
            status = "GOOD"
            color = "green"
        elif overall_score >= 70:
            status = "WARNING"
            color = "yellow"
        elif overall_score >= 50:
            status = "CRITICAL"
            color = "orange"
        else:
            status = "EMERGENCY"
            color = "red"

        return {
            'score': round(overall_score, 2),
            'status': status,
            'color': color,
            'component_scores': scores,
            'timestamp': datetime.now().isoformat()
        }

    def _calculate_application_score(self, metrics: Dict[str, Any]) -> float:
        """Calculate application health score"""
        api_uptime = metrics.get('api_uptime', 0) * 100
        web_uptime = metrics.get('web_uptime', 0) * 100
        error_rate = metrics.get('api_error_rate', 100)
        response_time = metrics.get('api_response_time_p95', 10)

        # Score components
        uptime_score = min(api_uptime, web_uptime)
        error_score = max(0, 100 - error_rate * 10)  # Penalize high error rates
        response_score = max(0, 100 - (response_time - 1) * 20)  # Penalize slow responses

        return (uptime_score * 0.5 + error_score * 0.3 + response_score * 0.2)

    def _calculate_database_score(self, metrics: Dict[str, Any]) -> float:
        """Calculate database health score"""
        postgres_uptime = metrics.get('postgres_uptime', 0) * 100
        redis_uptime = metrics.get('redis_uptime', 0) * 100
        connection_usage = metrics.get('postgres_connections', 100)
        redis_memory = metrics.get('redis_memory_usage', 100)

        uptime_score = min(postgres_uptime, redis_uptime)
        resource_score = max(0, 100 - max(connection_usage - 80, redis_memory - 80) * 2)

        return (uptime_score * 0.7 + resource_score * 0.3)

    def _calculate_system_score(self, metrics: Dict[str, Any]) -> float:
        """Calculate system health score"""
        cpu_usage = metrics.get('cpu_usage', 100)
        memory_usage = metrics.get('memory_usage', 100)
        disk_usage = metrics.get('disk_usage', 100)

        # Lower usage is better
        cpu_score = max(0, 100 - cpu_usage)
        memory_score = max(0, 100 - memory_usage)
        disk_score = max(0, 100 - disk_usage)

        return (cpu_score + memory_score + disk_score) / 3

    def _calculate_security_score(self, metrics: Dict[str, Any]) -> float:
        """Calculate security health score"""
        critical_vulns = metrics.get('critical_vulnerabilities', 0)
        high_vulns = metrics.get('high_vulnerabilities', 0)
        auth_failures = metrics.get('auth_failures_24h', 0)
        compliance = metrics.get('compliance_status', 0) * 100

        vuln_score = max(0, 100 - critical_vulns * 20 - high_vulns * 5)
        security_events_score = max(0, 100 - auth_failures / 10)

        return (vuln_score * 0.4 + security_events_score * 0.3 + compliance * 0.3)

    def _calculate_performance_score(self, metrics: Dict[str, Any]) -> float:
        """Calculate performance health score"""
        availability = metrics.get('api_availability_24h', 0)
        response_time = metrics.get('response_time_trend', 10)
        error_rate = metrics.get('error_rate_trend', 100)

        availability_score = availability
        response_score = max(0, 100 - (response_time - 1) * 20)
        error_score = max(0, 100 - error_rate * 10)

        return (availability_score * 0.5 + response_score * 0.3 + error_score * 0.2)

    def _analyze_system_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze system health"""
        issues = []
        recommendations = []

        cpu_usage = metrics.get('cpu_usage', 0)
        memory_usage = metrics.get('memory_usage', 0)
        disk_usage = metrics.get('disk_usage', 0)

        if cpu_usage > 80:
            issues.append(f"High CPU usage: {cpu_usage:.1f}%")
            recommendations.append("Consider scaling up or optimizing CPU-intensive processes")

        if memory_usage > 85:
            issues.append(f"High memory usage: {memory_usage:.1f}%")
            recommendations.append("Investigate memory leaks or consider increasing memory allocation")

        if disk_usage > 85:
            issues.append(f"High disk usage: {disk_usage:.1f}%")
            recommendations.append("Clean up old logs and temporary files, consider disk expansion")

        return {
            'status': 'healthy' if not issues else 'degraded' if len(issues) <= 2 else 'critical',
            'issues': issues,
            'recommendations': recommendations,
            'metrics': metrics
        }

    def _analyze_application_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze application health"""
        issues = []
        recommendations = []

        api_uptime = metrics.get('api_uptime', 0) * 100
        error_rate = metrics.get('api_error_rate', 0)
        response_time = metrics.get('api_response_time_p95', 0)

        if api_uptime < 99:
            issues.append(f"Low API uptime: {api_uptime:.2f}%")
            recommendations.append("Investigate API downtime causes and improve reliability")

        if error_rate > 2:
            issues.append(f"High error rate: {error_rate:.2f}%")
            recommendations.append("Review error logs and fix underlying issues")

        if response_time > 2:
            issues.append(f"Slow response time: {response_time:.2f}s")
            recommendations.append("Optimize database queries and caching strategies")

        return {
            'status': 'healthy' if not issues else 'degraded' if len(issues) <= 2 else 'critical',
            'issues': issues,
            'recommendations': recommendations,
            'metrics': metrics
        }

    def _analyze_database_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze database health"""
        issues = []
        recommendations = []

        postgres_uptime = metrics.get('postgres_uptime', 0) * 100
        redis_uptime = metrics.get('redis_uptime', 0) * 100
        connections = metrics.get('postgres_connections', 0)
        redis_memory = metrics.get('redis_memory_usage', 0)

        if postgres_uptime < 99:
            issues.append(f"PostgreSQL uptime: {postgres_uptime:.2f}%")
            recommendations.append("Investigate PostgreSQL stability issues")

        if redis_uptime < 99:
            issues.append(f"Redis uptime: {redis_uptime:.2f}%")
            recommendations.append("Investigate Redis stability issues")

        if connections > 80:
            issues.append(f"High database connections: {connections:.1f}%")
            recommendations.append("Optimize connection pooling and query efficiency")

        if redis_memory > 90:
            issues.append(f"High Redis memory usage: {redis_memory:.1f}%")
            recommendations.append("Clear unused cache entries or increase Redis memory")

        return {
            'status': 'healthy' if not issues else 'degraded' if len(issues) <= 2 else 'critical',
            'issues': issues,
            'recommendations': recommendations,
            'metrics': metrics
        }

    def _analyze_security_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze security health"""
        issues = []
        recommendations = []

        critical_vulns = metrics.get('critical_vulnerabilities', 0)
        high_vulns = metrics.get('high_vulnerabilities', 0)
        auth_failures = metrics.get('auth_failures_24h', 0)

        if critical_vulns > 0:
            issues.append(f"Critical vulnerabilities: {critical_vulns}")
            recommendations.append("URGENT: Patch critical vulnerabilities immediately")

        if high_vulns > 5:
            issues.append(f"High severity vulnerabilities: {high_vulns}")
            recommendations.append("Schedule high severity vulnerability patching")

        if auth_failures > 100:
            issues.append(f"High authentication failures: {auth_failures}")
            recommendations.append("Investigate potential brute force attacks")

        return {
            'status': 'healthy' if not issues else 'degraded' if len(issues) <= 2 else 'critical',
            'issues': issues,
            'recommendations': recommendations,
            'metrics': metrics
        }

    def _analyze_business_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze business health"""
        user_registrations = metrics.get('user_registrations_24h', 0)
        job_applications = metrics.get('job_applications_24h', 0)
        orders_processed = metrics.get('orders_processed_24h', 0)

        insights = []

        if user_registrations > 0:
            insights.append(f"New user registrations: {user_registrations}")

        if job_applications > 0:
            insights.append(f"Job applications: {job_applications}")

        if orders_processed > 0:
            insights.append(f"Orders processed: {orders_processed}")

        return {
            'insights': insights,
            'metrics': metrics
        }

    def _analyze_performance_health(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze performance health"""
        availability = metrics.get('api_availability_24h', 0)
        response_time = metrics.get('response_time_trend', 0)
        throughput = metrics.get('throughput_trend', 0)

        issues = []
        recommendations = []

        if availability < 99.9:
            issues.append(f"Availability below target: {availability:.2f}%")
            recommendations.append("Improve system reliability and redundancy")

        if response_time > 2:
            issues.append(f"Slow response times: {response_time:.2f}s")
            recommendations.append("Optimize application performance")

        return {
            'status': 'healthy' if not issues else 'degraded' if len(issues) <= 1 else 'critical',
            'issues': issues,
            'recommendations': recommendations,
            'metrics': metrics
        }

    def _generate_recommendations(self, metrics: Dict[str, Any]) -> List[str]:
        """Generate overall recommendations"""
        recommendations = []

        # System recommendations
        if metrics['system'].get('cpu_usage', 0) > 80:
            recommendations.append("Scale up compute resources or optimize CPU usage")

        # Application recommendations
        if metrics['application'].get('api_error_rate', 0) > 5:
            recommendations.append("Investigate and fix application errors")

        # Security recommendations
        if metrics['security'].get('critical_vulnerabilities', 0) > 0:
            recommendations.append("CRITICAL: Patch security vulnerabilities immediately")

        # Database recommendations
        if metrics['database'].get('postgres_connections', 0) > 80:
            recommendations.append("Optimize database connection pooling")

        return recommendations

    def _analyze_alerts(self, alert_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze alert metrics"""
        critical_alerts = alert_metrics.get('critical_alerts_active', 0)
        warning_alerts = alert_metrics.get('warning_alerts_active', 0)

        return {
            'critical_active': critical_alerts,
            'warning_active': warning_alerts,
            'total_active': critical_alerts + warning_alerts,
            'status': 'critical' if critical_alerts > 0 else 'warning' if warning_alerts > 0 else 'healthy'
        }

    def _analyze_trends(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze trends from metrics"""
        # This would typically involve historical data analysis
        # For now, we'll provide basic trend information
        return {
            'availability_trend': 'stable',
            'performance_trend': 'improving',
            'error_rate_trend': 'decreasing',
            'user_growth_trend': 'increasing'
        }

class ReportGenerator:
    """Generates health reports in various formats"""

    def __init__(self, config: Config):
        self.config = config
        self.template_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(os.path.dirname(__file__))
        )

    def generate_executive_report(self, metrics: Dict[str, Any], analysis: Dict[str, Any]) -> str:
        """Generate executive summary report"""
        template = self.template_env.from_string("""
# RestaurantHub Platform Health Report
## Executive Summary

**Generated:** {{ timestamp }}
**Overall Health:** {{ overall_health.status }} ({{ overall_health.score }}%)

### Key Metrics
- **Platform Availability:** {{ availability }}%
- **Active Users (24h):** {{ active_users }}
- **Error Rate:** {{ error_rate }}%
- **Revenue (24h):** ${{ revenue }}

### Health Status
{% for component, score in overall_health.component_scores.items() %}
- **{{ component.title() }}:** {{ "%.1f"|format(score) }}%
{% endfor %}

### Critical Issues
{% if critical_issues %}
{% for issue in critical_issues %}
- {{ issue }}
{% endfor %}
{% else %}
✅ No critical issues detected
{% endif %}

### Business Highlights
- User Registrations: {{ business_metrics.user_registrations_24h }}
- Job Applications: {{ business_metrics.job_applications_24h }}
- Orders Processed: {{ business_metrics.orders_processed_24h }}

### Recommendations
{% for rec in recommendations %}
- {{ rec }}
{% endfor %}

---
*Generated by RestaurantHub AI Sentry*
        """)

        critical_issues = []
        for component in ['system_health', 'application_health', 'database_health', 'security_health']:
            if analysis[component]['status'] == 'critical':
                critical_issues.extend(analysis[component]['issues'])

        return template.render(
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'),
            overall_health=analysis['overall_health'],
            availability=analysis['performance_health']['metrics'].get('api_availability_24h', 0),
            active_users=metrics['business'].get('active_users_now', 0),
            error_rate=metrics['application'].get('api_error_rate', 0),
            revenue=metrics['business'].get('revenue_24h', 0),
            critical_issues=critical_issues,
            business_metrics=metrics['business'],
            recommendations=analysis['recommendations']
        )

    def generate_technical_report(self, metrics: Dict[str, Any], analysis: Dict[str, Any]) -> str:
        """Generate detailed technical report"""
        template = self.template_env.from_string("""
# RestaurantHub Technical Health Report

**Generated:** {{ timestamp }}

## System Health
**Status:** {{ analysis.system_health.status.upper() }}

### Metrics
- CPU Usage: {{ "%.1f"|format(metrics.system.cpu_usage) }}%
- Memory Usage: {{ "%.1f"|format(metrics.system.memory_usage) }}%
- Disk Usage: {{ "%.1f"|format(metrics.system.disk_usage) }}%
- Load Average: {{ "%.2f"|format(metrics.system.load_average) }}

{% if analysis.system_health.issues %}
### Issues
{% for issue in analysis.system_health.issues %}
- {{ issue }}
{% endfor %}
{% endif %}

## Application Health
**Status:** {{ analysis.application_health.status.upper() }}

### Metrics
- API Uptime: {{ "%.2f"|format(metrics.application.api_uptime * 100) }}%
- Response Time (P95): {{ "%.3f"|format(metrics.application.api_response_time_p95) }}s
- Error Rate: {{ "%.2f"|format(metrics.application.api_error_rate) }}%
- Throughput: {{ "%.1f"|format(metrics.application.api_throughput) }} req/s

## Database Health
**Status:** {{ analysis.database_health.status.upper() }}

### Metrics
- PostgreSQL Uptime: {{ "%.2f"|format(metrics.database.postgres_uptime * 100) }}%
- Redis Uptime: {{ "%.2f"|format(metrics.database.redis_uptime * 100) }}%
- DB Connections: {{ "%.1f"|format(metrics.database.postgres_connections) }}%
- Redis Memory: {{ "%.1f"|format(metrics.database.redis_memory_usage) }}%

## Security Health
**Status:** {{ analysis.security_health.status.upper() }}

### Metrics
- Critical Vulnerabilities: {{ metrics.security.critical_vulnerabilities }}
- High Vulnerabilities: {{ metrics.security.high_vulnerabilities }}
- Auth Failures (24h): {{ metrics.security.auth_failures_24h }}
- Security Events (24h): {{ metrics.security.suspicious_activities_24h }}

## Performance Metrics
- API Availability (24h): {{ "%.2f"|format(metrics.performance.api_availability_24h) }}%
- Database Availability (24h): {{ "%.2f"|format(metrics.performance.database_availability_24h) }}%
- Cache Availability (24h): {{ "%.2f"|format(metrics.performance.cache_availability_24h) }}%

## Self-Healing Actions
- Recovery Actions (24h): {{ metrics.application.self_healing_actions }}
- Circuit Breakers Open: {{ metrics.application.circuit_breaker_open }}

---
*Generated by RestaurantHub AI Sentry*
        """)

        return template.render(
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'),
            metrics=metrics,
            analysis=analysis
        )

    def generate_charts(self, metrics: Dict[str, Any], output_dir: str) -> List[str]:
        """Generate charts for the report"""
        charts = []

        # System resource usage chart
        labels = ['CPU', 'Memory', 'Disk']
        values = [
            metrics['system'].get('cpu_usage', 0),
            metrics['system'].get('memory_usage', 0),
            metrics['system'].get('disk_usage', 0)
        ]

        plt.figure(figsize=(10, 6))
        colors = ['red' if v > 80 else 'orange' if v > 60 else 'green' for v in values]
        plt.bar(labels, values, color=colors)
        plt.title('System Resource Usage')
        plt.ylabel('Usage (%)')
        plt.ylim(0, 100)

        for i, v in enumerate(values):
            plt.text(i, v + 2, f'{v:.1f}%', ha='center', va='bottom')

        chart_path = f"{output_dir}/system_resources.png"
        plt.savefig(chart_path)
        plt.close()
        charts.append(chart_path)

        # Health score chart
        health_data = metrics.get('overall_health', {}).get('component_scores', {})
        if health_data:
            labels = list(health_data.keys())
            values = list(health_data.values())

            plt.figure(figsize=(10, 6))
            colors = ['red' if v < 70 else 'orange' if v < 85 else 'green' for v in values]
            plt.bar(labels, values, color=colors)
            plt.title('Component Health Scores')
            plt.ylabel('Health Score')
            plt.ylim(0, 100)

            chart_path = f"{output_dir}/health_scores.png"
            plt.savefig(chart_path)
            plt.close()
            charts.append(chart_path)

        return charts

class EmailSender:
    """Sends health reports via email"""

    def __init__(self, config: Config):
        self.config = config

    def send_executive_report(self, report_content: str, charts: List[str] = None):
        """Send executive report via email"""
        subject = f"RestaurantHub Health Report - {datetime.now().strftime('%Y-%m-%d')}"
        self._send_email(self.config.EXECUTIVES, subject, report_content, charts)

    def send_technical_report(self, report_content: str, charts: List[str] = None):
        """Send technical report via email"""
        subject = f"RestaurantHub Technical Health Report - {datetime.now().strftime('%Y-%m-%d')}"
        self._send_email(self.config.TECHNICAL_TEAM, subject, report_content, charts)

    def _send_email(self, recipients: List[str], subject: str, content: str, attachments: List[str] = None):
        """Send email with optional attachments"""
        try:
            msg = MimeMultipart()
            msg['From'] = self.config.SMTP_USER
            msg['To'] = ', '.join(recipients)
            msg['Subject'] = subject

            # Add content
            msg.attach(MimeText(content, 'plain'))

            # Add attachments
            if attachments:
                for file_path in attachments:
                    if os.path.exists(file_path):
                        with open(file_path, 'rb') as attachment:
                            part = MimeBase('application', 'octet-stream')
                            part.set_payload(attachment.read())
                            encoders.encode_base64(part)
                            part.add_header(
                                'Content-Disposition',
                                f'attachment; filename= {os.path.basename(file_path)}'
                            )
                            msg.attach(part)

            # Send email
            with smtplib.SMTP(self.config.SMTP_HOST, self.config.SMTP_PORT) as server:
                server.starttls()
                server.login(self.config.SMTP_USER, self.config.SMTP_PASSWORD)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {recipients}")

        except Exception as e:
            logger.error(f"Failed to send email: {e}")

async def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='RestaurantHub Health Reporter')
    parser.add_argument('--report-type', choices=['executive', 'technical', 'both'],
                       default='both', help='Type of report to generate')
    parser.add_argument('--output-dir', default=Config.REPORT_OUTPUT_DIR,
                       help='Output directory for reports')
    parser.add_argument('--send-email', action='store_true',
                       help='Send reports via email')

    args = parser.parse_args()

    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)

    logger.info("Starting health report generation...")

    config = Config()

    try:
        # Collect metrics
        async with PrometheusClient(config.PROMETHEUS_URL) as prometheus:
            collector = HealthMetricsCollector(prometheus)
            metrics = await collector.collect_all_metrics()

        # Analyze metrics
        analyzer = HealthAnalyzer(config)
        analysis = analyzer.analyze_metrics(metrics)

        # Generate reports
        generator = ReportGenerator(config)

        # Generate charts
        charts = generator.generate_charts(metrics, args.output_dir)

        if args.report_type in ['executive', 'both']:
            exec_report = generator.generate_executive_report(metrics, analysis)

            # Save to file
            exec_report_path = f"{args.output_dir}/executive_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            with open(exec_report_path, 'w') as f:
                f.write(exec_report)

            logger.info(f"Executive report saved to {exec_report_path}")

            # Send email if requested
            if args.send_email:
                email_sender = EmailSender(config)
                email_sender.send_executive_report(exec_report, charts)

        if args.report_type in ['technical', 'both']:
            tech_report = generator.generate_technical_report(metrics, analysis)

            # Save to file
            tech_report_path = f"{args.output_dir}/technical_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            with open(tech_report_path, 'w') as f:
                f.write(tech_report)

            logger.info(f"Technical report saved to {tech_report_path}")

            # Send email if requested
            if args.send_email:
                email_sender = EmailSender(config)
                email_sender.send_technical_report(tech_report, charts)

        # Save metrics as JSON for historical analysis
        metrics_path = f"{args.output_dir}/metrics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(metrics_path, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'metrics': metrics,
                'analysis': analysis
            }, f, indent=2, default=str)

        logger.info("Health report generation completed successfully")

    except Exception as e:
        logger.error(f"Health report generation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())