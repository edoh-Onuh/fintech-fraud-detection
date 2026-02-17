# Development Guide

## Setup Development Environment

### 1. Clone Repository
```bash
git clone <repository-url>
cd fintech
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Running the System

### Train Models
```bash
python examples/train_model.py
```

### Start API Server
```bash
python -m src.api.main

# Or with uvicorn
uvicorn src.api.main:app --reload --port 8000
```

### Run Tests
```bash
# All tests
pytest

# With coverage
pytest --cov=src --cov-report=html

# Specific test file
pytest tests/test_models.py -v
```

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Write code
- Add tests
- Update documentation

### 3. Run Tests
```bash
pytest
black src/  # Format code
flake8 src/  # Lint code
mypy src/  # Type check
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```

## Code Style

### Python Style Guide
- Follow PEP 8
- Use type hints
- Write docstrings for all public functions
- Maximum line length: 100 characters

### Example
```python
def detect_fraud(
    transaction: Transaction,
    model: FraudDetectionModel
) -> FraudResult:
    """
    Detect fraud in a transaction.
    
    Args:
        transaction: Transaction to analyze
        model: Fraud detection model
        
    Returns:
        Fraud detection result
        
    Raises:
        ValueError: If transaction is invalid
    """
    # Implementation
    pass
```

## Testing Guidelines

### Unit Tests
- Test individual components
- Mock external dependencies
- Aim for >80% coverage

### Integration Tests
- Test component interactions
- Use test databases
- Clean up after tests

### Example Test
```python
def test_fraud_detection():
    """Test fraud detection functionality"""
    # Arrange
    transaction = create_test_transaction()
    model = create_test_model()
    
    # Act
    result = detect_fraud(transaction, model)
    
    # Assert
    assert result.fraud_score >= 0
    assert result.fraud_score <= 1
```

## Debugging

### Enable Debug Logging
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Use Debugger
```python
import pdb; pdb.set_trace()  # Set breakpoint
```

### VS Code Debug Configuration
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: FastAPI",
            "type": "python",
            "request": "launch",
            "module": "uvicorn",
            "args": [
                "src.api.main:app",
                "--reload"
            ]
        }
    ]
}
```

## Performance Optimization

### Profile Code
```python
import cProfile
cProfile.run('your_function()')
```

### Memory Profiling
```bash
pip install memory_profiler
python -m memory_profiler script.py
```

## Documentation

### Generate API Docs
```bash
# FastAPI auto-generates docs at:
# http://localhost:8000/docs
# http://localhost:8000/redoc
```

### Update README
- Keep README.md current
- Document new features
- Update architecture diagrams

## Troubleshooting

### Common Issues

#### Import Errors
```bash
# Ensure you're in project root
export PYTHONPATH="${PYTHONPATH}:${PWD}"
```

#### Database Errors
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### Package Conflicts
```bash
# Recreate virtual environment
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
