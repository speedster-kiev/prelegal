import json
import os
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient


os.environ.setdefault("OPENROUTER_API_KEY", "test-key")


def make_mock_completion(message: str, fields: dict) -> MagicMock:
    mock = MagicMock()
    mock.choices = [MagicMock()]
    mock.choices[0].message.content = json.dumps({"message": message, "fields": fields})
    return mock


@pytest.fixture
def client():
    with patch("prelegal.main.init_db"):
        from prelegal.main import app
        with TestClient(app) as c:
            yield c


def test_chat_returns_message_and_fields(client):
    mock_response = make_mock_completion(
        message="Great! I have your purpose. What are the company names?",
        fields={"purpose": "Evaluating a business partnership"},
    )
    with patch("prelegal.routers.chat.completion", return_value=mock_response):
        res = client.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "We want to share info to evaluate a partnership."}]},
        )
    assert res.status_code == 200
    data = res.json()
    assert "message" in data
    assert "fields" in data
    assert data["fields"]["purpose"] == "Evaluating a business partnership"


def test_chat_accumulates_fields(client):
    mock_response = make_mock_completion(
        message="Got it. What state should govern this agreement?",
        fields={
            "purpose": "Evaluating a business partnership",
            "party1Company": "Acme Inc",
            "party2Company": "Globex Corp",
        },
    )
    with patch("prelegal.routers.chat.completion", return_value=mock_response):
        res = client.post(
            "/api/chat",
            json={
                "messages": [
                    {"role": "user", "content": "We are Acme Inc and Globex Corp."},
                ]
            },
        )
    assert res.status_code == 200
    data = res.json()
    assert data["fields"]["party1Company"] == "Acme Inc"
    assert data["fields"]["party2Company"] == "Globex Corp"


def test_chat_missing_api_key(client):
    with patch("prelegal.routers.chat.get_settings") as mock_settings:
        mock_settings.return_value.openrouter_api_key = ""
        res = client.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "Hello"}]},
        )
    assert res.status_code == 503


def test_chat_ai_service_error(client):
    with patch("prelegal.routers.chat.completion", side_effect=Exception("upstream error")):
        res = client.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "Hello"}]},
        )
    assert res.status_code == 502


def test_chat_empty_messages(client):
    mock_response = make_mock_completion(
        message="Hi! What's the purpose of your NDA?",
        fields={},
    )
    with patch("prelegal.routers.chat.completion", return_value=mock_response):
        res = client.post("/api/chat", json={"messages": []})
    assert res.status_code == 200
    assert res.json()["message"] == "Hi! What's the purpose of your NDA?"
