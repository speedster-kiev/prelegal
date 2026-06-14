import os

import pytest
from sqlalchemy import create_engine

# Set before any app module imports (engine.py creates engine at import time)
os.environ["DATABASE_URL"] = "sqlite:///:memory:"


@pytest.fixture
def test_engine():
    return create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
