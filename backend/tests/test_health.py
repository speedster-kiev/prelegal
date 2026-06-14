from unittest.mock import patch

from fastapi.testclient import TestClient


def test_health_returns_ok():
    from prelegal.main import app

    with patch("prelegal.main.init_db"):
        with TestClient(app) as client:
            response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
