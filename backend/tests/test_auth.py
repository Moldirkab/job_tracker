def register_user(client, email="test@example.com", password="testpass123"):
    return client.post("/api/users", json={"email": email, "password": password})


def test_register_success(client):
    response = register_user(client)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data


def test_register_duplicate_email_fails(client):
    register_user(client)
    response = register_user(client)
    assert response.status_code == 400


def test_login_success(client):
    register_user(client)
    response = client.post(
        "/api/login", json={"email": "test@example.com", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password_fails(client):
    register_user(client)
    response = client.post(
        "/api/login", json={"email": "test@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_login_nonexistent_user_fails(client):
    response = client.post(
        "/api/login", json={"email": "nobody@example.com", "password": "whatever"}
    )
    assert response.status_code == 401


def test_refresh_token_flow(client):
    register_user(client)
    login_response = client.post(
        "/api/login", json={"email": "test@example.com", "password": "testpass123"}
    )
    refresh_token = login_response.json()["refresh_token"]

    refresh_response = client.post("/api/refresh", json={"refresh_token": refresh_token})
    assert refresh_response.status_code == 200
    new_data = refresh_response.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data
    # Rotation: the new refresh token should differ from the original
    assert new_data["refresh_token"] != refresh_token


def test_refresh_token_reuse_fails(client):
    """A rotated-out refresh token should not work a second time."""
    register_user(client)
    login_response = client.post(
        "/api/login", json={"email": "test@example.com", "password": "testpass123"}
    )
    refresh_token = login_response.json()["refresh_token"]

    client.post("/api/refresh", json={"refresh_token": refresh_token})
    second_attempt = client.post("/api/refresh", json={"refresh_token": refresh_token})
    assert second_attempt.status_code == 401


def test_logout_revokes_refresh_token(client):
    register_user(client)
    login_response = client.post(
        "/api/login", json={"email": "test@example.com", "password": "testpass123"}
    )
    refresh_token = login_response.json()["refresh_token"]

    logout_response = client.post("/api/logout", json={"refresh_token": refresh_token})
    assert logout_response.status_code == 200

    refresh_attempt = client.post("/api/refresh", json={"refresh_token": refresh_token})
    assert refresh_attempt.status_code == 401