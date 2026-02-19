"""
Test configuration
"""
import pytest
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture(scope="session")
def test_config():
    """Test configuration"""
    return {
        "test_data_size": 1000,
        "random_seed": 42
    }
