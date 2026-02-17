# Deployment Configuration

This directory contains configuration files for deploying the Fraud Detection System.

## Files

### prometheus.yml
Prometheus configuration for metrics collection.

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'fraud-detection-api'
    static_configs:
      - targets: ['fraud-detection-api:8000']
    metrics_path: '/metrics/prometheus'
```

### kubernetes/
Kubernetes manifests for cloud deployment.

- `deployment.yaml` - API deployment
- `service.yaml` - Service configuration
- `ingress.yaml` - Ingress rules
- `configmap.yaml` - Configuration
- `secrets.yaml` - Sensitive data

## Deployment Options

### Docker Compose (Development)
```bash
docker-compose up -d
```

### Kubernetes (Production)
```bash
kubectl apply -f deployment/kubernetes/
```

### Cloud Providers

#### AWS
- Use EKS for Kubernetes
- RDS for PostgreSQL
- ElastiCache for Redis
- S3 for model storage

#### Azure
- Use AKS for Kubernetes
- Azure Database for PostgreSQL
- Azure Cache for Redis
- Blob Storage for models

#### GCP
- Use GKE for Kubernetes
- Cloud SQL for PostgreSQL
- Memorystore for Redis
- Cloud Storage for models
