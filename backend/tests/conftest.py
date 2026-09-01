import os
from dotenv import load_dotenv
load_dotenv()
os.environ["DB_NAME"] = "job_tracker_test"
os.environ["DB_USER"] = "postgres"
os.environ["DB_PASSWORD"] = os.environ.get("LOCAL_TEST_DB_PASSWORD", "")
os.environ["DB_HOST"] = "127.0.0.1"
os.environ["DB_PORT"] = "5432"
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production"
os.environ["GEMINI_API_KEY"] = "test-key-unused-in-these-tests"
os.environ["RATE_LIMITING_ENABLED"] = "false"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import connection


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_database():
    """Runs before and after every test, so each test starts with empty tables."""
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM refresh_tokens;")
        cursor.execute("DELETE FROM applications;")
        cursor.execute("DELETE FROM users;")
        connection.commit()
    yield
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM refresh_tokens;")
        cursor.execute("DELETE FROM applications;")
        cursor.execute("DELETE FROM users;")
        connection.commit()