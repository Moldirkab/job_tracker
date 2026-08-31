def register_and_login(client, email="test@example.com", password="testpass123"):
    client.post("/api/users", json={"email": email, "password": password})
    login_response = client.post("/api/login", json={"email": email, "password": password})
    access_token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


def test_create_application(client):
    headers = register_and_login(client)
    response = client.post(
        "/api/applications",
        headers=headers,
        json={
            "company": "Acme Corp",
            "position": "Backend Engineer",
            "location": "Remote",
            "status": "APPLIED",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["company"] == "Acme Corp"
    assert data["status"] == "APPLIED"
    assert "id" in data


def test_create_application_requires_auth(client):
    response = client.post(
        "/api/applications",
        json={"company": "Acme Corp", "position": "Backend Engineer", "location": "Remote", "status": "APPLIED"},
    )
    assert response.status_code in (401, 403)


def test_get_applications_returns_only_own(client):
    headers_a = register_and_login(client, email="a@example.com")
    client.post(
        "/api/applications",
        headers=headers_a,
        json={"company": "A Corp", "position": "Engineer", "location": "Remote", "status": "APPLIED"},
    )

    headers_b = register_and_login(client, email="b@example.com")
    client.post(
        "/api/applications",
        headers=headers_b,
        json={"company": "B Corp", "position": "Engineer", "location": "Remote", "status": "APPLIED"},
    )

    response = client.get("/api/applications", headers=headers_a)
    data = response.json()
    assert len(data) == 1
    assert data[0]["company"] == "A Corp"


def test_get_nonexistent_application_returns_404(client):
    headers = register_and_login(client)
    response = client.get("/api/applications/99999", headers=headers)
    assert response.status_code == 404


def test_update_application(client):
    headers = register_and_login(client)
    create_response = client.post(
        "/api/applications",
        headers=headers,
        json={"company": "Acme Corp", "position": "Backend Engineer", "location": "Remote", "status": "APPLIED"},
    )
    application_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/applications/{application_id}", headers=headers, json={"status": "INTERVIEW"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "INTERVIEW"


def test_update_with_empty_body_fails(client):
    headers = register_and_login(client)
    create_response = client.post(
        "/api/applications",
        headers=headers,
        json={"company": "Acme Corp", "position": "Backend Engineer", "location": "Remote", "status": "APPLIED"},
    )
    application_id = create_response.json()["id"]

    response = client.patch(f"/api/applications/{application_id}", headers=headers, json={})
    assert response.status_code == 400


def test_delete_application(client):
    headers = register_and_login(client)
    create_response = client.post(
        "/api/applications",
        headers=headers,
        json={"company": "Acme Corp", "position": "Backend Engineer", "location": "Remote", "status": "APPLIED"},
    )
    application_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/applications/{application_id}", headers=headers)
    assert delete_response.status_code == 200

    get_response = client.get(f"/api/applications/{application_id}", headers=headers)
    assert get_response.status_code == 404


def test_delete_nonexistent_application_returns_404(client):
    headers = register_and_login(client)
    response = client.delete("/api/applications/99999", headers=headers)
    assert response.status_code == 404