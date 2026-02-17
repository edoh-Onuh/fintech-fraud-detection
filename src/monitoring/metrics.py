"""
Monitoring and Observability
Tracks system performance, model metrics, and alerts
"""
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import deque
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)


@dataclass
class Metric:
    """Metric data point"""
    name: str
    value: float
    timestamp: datetime = field(default_factory=datetime.now)
    labels: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'value': self.value,
            'timestamp': self.timestamp.isoformat(),
            'labels': self.labels
        }


@dataclass
class Alert:
    """Alert notification"""
    alert_id: str
    severity: str  # 'info', 'warning', 'critical'
    title: str
    message: str
    metric_name: Optional[str] = None
    threshold: Optional[float] = None
    current_value: Optional[float] = None
    timestamp: datetime = field(default_factory=datetime.now)
    acknowledged: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'alert_id': self.alert_id,
            'severity': self.severity,
            'title': self.title,
            'message': self.message,
            'metric_name': self.metric_name,
            'threshold': self.threshold,
            'current_value': self.current_value,
            'timestamp': self.timestamp.isoformat(),
            'acknowledged': self.acknowledged
        }


class MetricsCollector:
    """
    Collects and stores system metrics
    
    Compatible with Prometheus exposition format
    """
    
    def __init__(self, retention_hours: int = 24):
        self.metrics: Dict[str, deque] = {}
        self.retention_hours = retention_hours
        self.counters: Dict[str, float] = {}
        self.gauges: Dict[str, float] = {}
        
    def record_metric(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """Record a metric value"""
        if name not in self.metrics:
            self.metrics[name] = deque(maxlen=10000)
        
        metric = Metric(
            name=name,
            value=value,
            labels=labels or {}
        )
        
        self.metrics[name].append(metric)
        self._cleanup_old_metrics()
    
    def increment_counter(self, name: str, amount: float = 1.0) -> None:
        """Increment a counter metric"""
        if name not in self.counters:
            self.counters[name] = 0.0
        self.counters[name] += amount
    
    def set_gauge(self, name: str, value: float) -> None:
        """Set a gauge metric"""
        self.gauges[name] = value
    
    def get_metric_history(
        self,
        name: str,
        hours: Optional[int] = None
    ) -> List[Metric]:
        """Get historical values for a metric"""
        if name not in self.metrics:
            return []
        
        if hours is None:
            return list(self.metrics[name])
        
        cutoff = datetime.now() - timedelta(hours=hours)
        return [
            m for m in self.metrics[name]
            if m.timestamp > cutoff
        ]
    
    def get_metric_statistics(
        self,
        name: str,
        hours: int = 1
    ) -> Dict[str, float]:
        """Calculate statistics for a metric"""
        history = self.get_metric_history(name, hours)
        
        if not history:
            return {}
        
        values = [m.value for m in history]
        
        return {
            'count': float(len(values)),
            'mean': float(np.mean(values)),
            'median': float(np.median(values)),
            'std': float(np.std(values)),
            'min': float(np.min(values)),
            'max': float(np.max(values)),
            'p95': float(np.percentile(values, 95)),
            'p99': float(np.percentile(values, 99))
        }
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Get current state of all metrics"""
        return {
            'counters': self.counters.copy(),
            'gauges': self.gauges.copy(),
            'time_series_count': len(self.metrics)
        }
    
    def export_prometheus_format(self) -> str:
        """Export metrics in Prometheus text format"""
        lines = []
        
        # Export counters
        for name, value in self.counters.items():
            lines.append(f"# TYPE {name} counter")
            lines.append(f"{name} {value}")
        
        # Export gauges
        for name, value in self.gauges.items():
            lines.append(f"# TYPE {name} gauge")
            lines.append(f"{name} {value}")
        
        return "\n".join(lines)
    
    def _cleanup_old_metrics(self) -> None:
        """Remove metrics older than retention period"""
        cutoff = datetime.now() - timedelta(hours=self.retention_hours)
        
        for name in self.metrics:
            # Remove old metrics
            while self.metrics[name] and self.metrics[name][0].timestamp < cutoff:
                self.metrics[name].popleft()


class AlertManager:
    """
    Manages alerts and notifications
    
    Supports threshold-based alerting and custom alert rules
    """
    
    def __init__(self):
        self.alerts: List[Alert] = []
        self.alert_rules: Dict[str, Dict[str, Any]] = {}
        self.alert_handlers: List[Callable] = []
        
    def add_alert_rule(
        self,
        metric_name: str,
        threshold: float,
        comparison: str = 'greater',  # 'greater', 'less', 'equal'
        severity: str = 'warning',
        message_template: Optional[str] = None
    ) -> None:
        """
        Add an alert rule
        
        Args:
            metric_name: Name of metric to monitor
            threshold: Threshold value
            comparison: Type of comparison
            severity: Alert severity level
            message_template: Optional message template with {value} placeholder
        """
        self.alert_rules[metric_name] = {
            'threshold': threshold,
            'comparison': comparison,
            'severity': severity,
            'message_template': message_template or f"{metric_name} exceeded threshold"
        }
        
        logger.info(f"Added alert rule for {metric_name}")
    
    def check_metric(self, name: str, value: float) -> Optional[Alert]:
        """
        Check if metric triggers an alert
        
        Returns Alert if triggered, None otherwise
        """
        if name not in self.alert_rules:
            return None
        
        rule = self.alert_rules[name]
        threshold = rule['threshold']
        comparison = rule['comparison']
        
        triggered = False
        
        if comparison == 'greater' and value > threshold:
            triggered = True
        elif comparison == 'less' and value < threshold:
            triggered = True
        elif comparison == 'equal' and abs(value - threshold) < 1e-6:
            triggered = True
        
        if not triggered:
            return None
        
        # Create alert
        import secrets
        alert = Alert(
            alert_id=secrets.token_hex(8),
            severity=rule['severity'],
            title=f"Alert: {name}",
            message=rule['message_template'].format(value=value),
            metric_name=name,
            threshold=threshold,
            current_value=value
        )
        
        self.alerts.append(alert)
        
        # Trigger handlers
        for handler in self.alert_handlers:
            try:
                handler(alert)
            except Exception as e:
                logger.error(f"Alert handler failed: {e}")
        
        logger.warning(f"Alert triggered: {alert.title}")
        
        return alert
    
    def register_alert_handler(self, handler: Callable[[Alert], None]) -> None:
        """
        Register a handler for alerts
        
        Handler is called whenever an alert is triggered
        """
        self.alert_handlers.append(handler)
    
    def get_active_alerts(
        self,
        severity: Optional[str] = None
    ) -> List[Alert]:
        """Get unacknowledged alerts"""
        alerts = [a for a in self.alerts if not a.acknowledged]
        
        if severity:
            alerts = [a for a in alerts if a.severity == severity]
        
        return alerts
    
    def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert"""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.acknowledged = True
                logger.info(f"Alert acknowledged: {alert_id}")
                return True
        
        return False
    
    def clear_old_alerts(self, days: int = 7) -> int:
        """Clear alerts older than specified days"""
        cutoff = datetime.now() - timedelta(days=days)
        
        original_count = len(self.alerts)
        self.alerts = [
            a for a in self.alerts
            if a.timestamp > cutoff or not a.acknowledged
        ]
        
        removed = original_count - len(self.alerts)
        if removed > 0:
            logger.info(f"Cleared {removed} old alerts")
        
        return removed


class PerformanceMonitor:
    """
    Monitors system and model performance
    
    Tracks fraud detection metrics, processing times, and system health
    """
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics_collector = metrics_collector
        
    def record_prediction(
        self,
        fraud_score: float,
        is_fraud: bool,
        processing_time_ms: float,
        model_version: str
    ) -> None:
        """Record a fraud detection prediction"""
        self.metrics_collector.record_metric(
            'fraud_score',
            fraud_score,
            labels={'model': model_version}
        )
        
        self.metrics_collector.record_metric(
            'processing_time_ms',
            processing_time_ms,
            labels={'model': model_version}
        )
        
        if is_fraud:
            self.metrics_collector.increment_counter('fraud_detected_total')
        
        self.metrics_collector.increment_counter('predictions_total')
    
    def record_model_metrics(
        self,
        model_version: str,
        accuracy: float,
        precision: float,
        recall: float,
        f1_score: float
    ) -> None:
        """Record model performance metrics"""
        metrics = {
            'model_accuracy': accuracy,
            'model_precision': precision,
            'model_recall': recall,
            'model_f1_score': f1_score
        }
        
        for name, value in metrics.items():
            self.metrics_collector.set_gauge(
                f"{name}_{model_version}",
                value
            )
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health metrics"""
        total_predictions = self.metrics_collector.counters.get('predictions_total', 0)
        fraud_detected = self.metrics_collector.counters.get('fraud_detected_total', 0)
        
        fraud_rate = fraud_detected / total_predictions if total_predictions > 0 else 0
        
        # Get processing time statistics
        processing_stats = self.metrics_collector.get_metric_statistics(
            'processing_time_ms',
            hours=1
        )
        
        return {
            'total_predictions': total_predictions,
            'fraud_detected': fraud_detected,
            'fraud_rate': fraud_rate,
            'processing_time_stats': processing_stats,
            'status': 'healthy' if processing_stats.get('p99', 0) < 100 else 'degraded'
        }


class DashboardGenerator:
    """
    Generates monitoring dashboard data
    
    Provides data for visualization dashboards (Grafana-compatible)
    """
    
    def __init__(
        self,
        metrics_collector: MetricsCollector,
        alert_manager: AlertManager
    ):
        self.metrics_collector = metrics_collector
        self.alert_manager = alert_manager
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive dashboard data"""
        return {
            'timestamp': datetime.now().isoformat(),
            'overview': self._get_overview(),
            'fraud_metrics': self._get_fraud_metrics(),
            'performance_metrics': self._get_performance_metrics(),
            'alerts': self._get_alerts_summary(),
            'time_series': self._get_time_series_data()
        }
    
    def _get_overview(self) -> Dict[str, Any]:
        """Get overview statistics"""
        return {
            'total_transactions': self.metrics_collector.counters.get('predictions_total', 0),
            'fraud_detected': self.metrics_collector.counters.get('fraud_detected_total', 0),
            'active_alerts': len(self.alert_manager.get_active_alerts()),
            'critical_alerts': len(self.alert_manager.get_active_alerts('critical'))
        }
    
    def _get_fraud_metrics(self) -> Dict[str, Any]:
        """Get fraud detection metrics"""
        total = self.metrics_collector.counters.get('predictions_total', 0)
        fraud = self.metrics_collector.counters.get('fraud_detected_total', 0)
        
        return {
            'fraud_rate': fraud / total if total > 0 else 0,
            'total_fraud_cases': fraud,
            'avg_fraud_score_24h': self.metrics_collector.get_metric_statistics(
                'fraud_score', hours=24
            ).get('mean', 0)
        }
    
    def _get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics"""
        return {
            'processing_time': self.metrics_collector.get_metric_statistics(
                'processing_time_ms', hours=1
            )
        }
    
    def _get_alerts_summary(self) -> List[Dict[str, Any]]:
        """Get active alerts"""
        alerts = self.alert_manager.get_active_alerts()
        return [alert.to_dict() for alert in alerts[:10]]  # Top 10
    
    def _get_time_series_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get time series data for charting"""
        return {
            'fraud_scores': [
                m.to_dict() for m in 
                self.metrics_collector.get_metric_history('fraud_score', hours=24)
            ][-100:],  # Last 100 points
            'processing_times': [
                m.to_dict() for m in
                self.metrics_collector.get_metric_history('processing_time_ms', hours=24)
            ][-100:]
        }
    
    def export_grafana_json(self) -> Dict[str, Any]:
        """Export dashboard in Grafana JSON format"""
        # Simplified Grafana dashboard schema
        return {
            'dashboard': {
                'title': 'Fraud Detection System',
                'panels': [
                    {
                        'title': 'Fraud Rate',
                        'type': 'graph',
                        'targets': [
                            {'expr': 'fraud_detected_total / predictions_total'}
                        ]
                    },
                    {
                        'title': 'Processing Time',
                        'type': 'graph',
                        'targets': [
                            {'expr': 'processing_time_ms'}
                        ]
                    },
                    {
                        'title': 'Active Alerts',
                        'type': 'stat',
                        'targets': [
                            {'expr': 'active_alerts_count'}
                        ]
                    }
                ]
            }
        }
