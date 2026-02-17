# Fraud Detection Dashboard

Professional React-based monitoring dashboard for the fraud detection system.

## Features

- **Real-time Monitoring**: Auto-refreshing metrics (5s intervals)
- **Interactive Charts**: Fraud trends with Recharts
- **Transaction Testing**: Submit transactions for live fraud detection
- **Model Status**: View registered ML models and their performance
- **Authentication**: Secure login with JWT tokens
- **Responsive Design**: Works on desktop, tablet, and mobile

## Quick Start

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Dashboard will be available at: **http://localhost:3000**

### 3. Login

Use the demo credentials:
- **Username**: demo
- **Password**: demo123

## Architecture

```
dashboard/
├── src/
│   ├── components/        # React components
│   │   ├── Login.jsx      # Authentication page
│   │   ├── Dashboard.jsx  # Main dashboard
│   │   ├── Header.jsx     # Navigation header
│   │   ├── StatsCard.jsx  # Metric cards
│   │   ├── FraudChart.jsx # Trend visualization
│   │   ├── ModelStatus.jsx# Model information
│   │   └── TransactionMonitor.jsx # Live testing
│   ├── services/          # API integration
│   │   └── api.js         # Axios client
│   ├── App.jsx            # Root component
│   └── main.jsx           # Entry point
├── package.json
└── vite.config.js         # Build configuration
```

## API Integration

The dashboard connects to the FastAPI backend at `http://localhost:8000` via proxy configuration in `vite.config.js`.

### Endpoints Used:
- `POST /auth/login` - User authentication
- `POST /auth/logout` - Logout
- `GET /health` - System health check
- `GET /metrics` - Performance metrics
- `GET /models` - List ML models
- `POST /detect/fraud` - Test fraud detection

## Features Breakdown

### 1. Stats Cards
- Total Predictions
- Fraud Detected
- System Status
- Average Response Time

### 2. Fraud Chart
- 24-hour trend visualization
- Area chart with dual metrics
- Peak hour detection
- Average fraud rate

### 3. Model Status
- List of registered models
- Training status
- Performance metrics (Accuracy, AUC-ROC)
- Active model indicator

### 4. Transaction Monitor
- Interactive form for transaction input
- Real-time fraud detection
- Fraud score visualization
- Risk factor explanation
- Decision indicator (Approve/Review/Decline)

## Build for Production

```bash
npm run build
```

Output will be in `dist/` directory. Serve with any static file server:

```bash
npm run preview
```

## Configuration

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000
```

### Customization

- **Colors**: Edit CSS files in component directories
- **Refresh Interval**: Modify `refetchInterval` in Dashboard.jsx
- **Chart Data**: Customize in FraudChart.jsx

## Technologies

- **React 18** - UI library
- **Vite** - Build tool
- **Recharts** - Chart library
- **Axios** - HTTP client
- **TanStack Query** - Data fetching & caching
- **Lucide React** - Icon library

## Deployment

### With Docker

```bash
docker build -t fraud-dashboard .
docker run -p 3000:80 fraud-dashboard
```

### With Nginx

```nginx
server {
    listen 80;
    server_name dashboard.example.com;
    
    root /var/www/dashboard/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
    }
}
```

## Grafana Integration

For advanced monitoring, import the Grafana dashboard:

1. Start Grafana (included in docker-compose.yml)
2. Add Prometheus datasource: `http://prometheus:9090`
3. Import dashboard from: `../deployment/grafana-dashboard.json`
4. Access at: `http://localhost:3001`

Default Grafana credentials:
- Username: admin
- Password: admin

## Troubleshooting

### Port Already in Use

```bash
# Change port in vite.config.js
server: {
  port: 3001  // Use different port
}
```

### API Connection Failed

- Ensure FastAPI backend is running on port 8000
- Check CORS configuration in backend
- Verify proxy settings in vite.config.js

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Support

For issues or questions, check the main project README or API documentation.
