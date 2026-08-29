import psycopg
from fastapi import FastAPI, Depends, HTTPException
from app.database import connection
from fastapi.middleware.cors import CORSMiddleware
from app.models import UserCreate, JobApplication, ApplicationUpdate, ImportRequest, ImportPreview, RefreshRequest, TokenPair
from app.ai_import import extract_job_info
from datetime import datetime, timedelta, timezone
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_refresh_token,
    REFRESH_TOKEN_EXPIRE_DAYS
)
from app.auth import get_current_user

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Job Tracker API is running"}


@app.post("/api/users")
def create_user(user: UserCreate):
    password_hash = hash_password(user.password)

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (email, password_hash)
                VALUES (%s, %s)
                RETURNING id, email, created_at
                """,
                (user.email, password_hash)
            )

            result = cursor.fetchone()
            connection.commit()

    except psycopg.errors.UniqueViolation:
        connection.rollback()

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return {
        "id": result[0],
        "email": result[1],
        "created_at": result[2]
    }


@app.post("/api/login")
def login(user: UserCreate):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, password_hash
            FROM users
            WHERE email = %s
            """,
            (user.email,)
        )

        result = cursor.fetchone()

    if result is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = result[0]
    password_hash = result[1]

    if not verify_password(user.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(user_id)
    raw_refresh_token, refresh_token_hash = create_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
            VALUES (%s, %s, %s)
            """,
            (user_id, refresh_token_hash, expires_at)
        )
        connection.commit()

    return {
        "access_token": access_token,
        "refresh_token": raw_refresh_token,
        "token_type": "bearer"
    }

@app.post("/api/refresh", response_model=TokenPair)
def refresh_token(request: RefreshRequest):
    incoming_hash = hash_refresh_token(request.refresh_token)

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, user_id, expires_at, revoked
            FROM refresh_tokens
            WHERE token_hash = %s
            """,
            (incoming_hash,)
        )
        row = cursor.fetchone()

    if row is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    token_id, user_id, expires_at, revoked = row

    if revoked:
        raise HTTPException(status_code=401, detail="Refresh token has been revoked")

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token has expired")

    # Rotation: revoke the used token, issue a brand new pair.
    with connection.cursor() as cursor:
        cursor.execute(
            "UPDATE refresh_tokens SET revoked = TRUE WHERE id = %s",
            (token_id,)
        )
        connection.commit()

    new_access_token = create_access_token(user_id)
    new_raw_refresh_token, new_refresh_token_hash = create_refresh_token()
    new_expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
            VALUES (%s, %s, %s)
            """,
            (user_id, new_refresh_token_hash, new_expires_at)
        )
        connection.commit()

    return {
        "access_token": new_access_token,
        "refresh_token": new_raw_refresh_token,
        "token_type": "bearer"
    }


@app.post("/api/logout")
def logout(request: RefreshRequest):
    incoming_hash = hash_refresh_token(request.refresh_token)

    with connection.cursor() as cursor:
        cursor.execute(
            "UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = %s",
            (incoming_hash,)
        )
        connection.commit()

    return {"message": "Logged out"}

@app.post("/api/applications")
def create_application(application: JobApplication, 
                       current_user_id: int = Depends(get_current_user)):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO applications
                (user_id, company, position, location, status, job_url, notes, salary, skills)
            VALUES
                (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, company, position, location, status, created_at, job_url, notes, salary, skills
            """,
            (
                current_user_id,
                application.company,
                application.position,
                application.location,
                application.status,
                application.job_url,
                application.notes,
                application.salary,
                application.skills
            )
        )

        result = cursor.fetchone()
        connection.commit()

    return {
        "id": result[0],
        "user_id": result[1],
        "company": result[2],
        "position": result[3],
        "location": result[4],
        "status": result[5],
        "created_at": result[6],
        "job_url": result[7],
        "notes": result[8],
        "salary": result[9],
        "skills": result[10]
    }

@app.post("/api/applications/import", response_model=ImportPreview)
def import_application(
    request: ImportRequest,
    current_user_id: int = Depends(get_current_user)
):
    return extract_job_info(request.url)

@app.get("/api/applications")
def get_applications(
    current_user_id: int = Depends(get_current_user)
):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, user_id, company, position, location, status, created_at, job_url, notes, salary, skills
            FROM applications
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (current_user_id,)
        )

        applications = cursor.fetchall()

    return [
        {
            "id": row[0],
            "user_id": row[1],
            "company": row[2],
            "position": row[3],
            "location": row[4],
            "status": row[5],
            "created_at": row[6],
            "job_url": row[7],
            "notes": row[8],
            "salary": row[9],
            "skills": row[10]
        }
        for row in applications
    ]
@app.get("/api/applications/{application_id}")
def get_application(
    application_id: int,
    current_user_id: int = Depends(get_current_user)
):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, user_id, company, position, location, status, created_at, job_url, notes, salary, skills
            FROM applications
            WHERE id = %s AND user_id = %s
            """,
            (application_id, current_user_id)
        )

        application = cursor.fetchone()

    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    return {
        "id": application[0],
        "user_id": application[1],
        "company": application[2],
        "position": application[3],
        "location": application[4],
        "status": application[5],
        "created_at": application[6],
        "job_url": application[7],
        "notes": application[8],
        "salary": application[9],
        "skills": application[10]
    }
@app.patch("/api/applications/{application_id}")
def update_application(
    application_id: int,
    application: ApplicationUpdate,
    current_user_id: int = Depends(get_current_user)
):
    updates = application.model_dump(exclude_none=True)

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    fields = []
    values = []

    for field, value in updates.items():
        fields.append(f"{field} = %s")
        values.append(value)

    values.append(application_id)
    values.append(current_user_id)

    query = f"""
        UPDATE applications
        SET {", ".join(fields)}
        WHERE id = %s AND user_id = %s
        RETURNING id, user_id, company, position, location, status, created_at, job_url, notes, salary, skills
    """

    with connection.cursor() as cursor:
        cursor.execute(query, values)
        result = cursor.fetchone()
        connection.commit()

    if result is None:
        raise HTTPException(status_code=404, detail="Application not found")

    return {
        "id": result[0],
        "user_id": result[1],
        "company": result[2],
        "position": result[3],
        "location": result[4],
        "status": result[5],
        "created_at": result[6],
        "job_url": result[7],
        "notes": result[8],
        "salary": result[9],
        "skills": result[10]
    }
@app.delete("/api/applications/{application_id}")
def delete_application(
    application_id: int,
    current_user_id: int = Depends(get_current_user)
):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            DELETE FROM applications
            WHERE id = %s AND user_id = %s
            RETURNING id
            """,
            (application_id, current_user_id)
        )

        result = cursor.fetchone()
        connection.commit()

    if result is None:
        raise HTTPException(status_code=404, detail="Application not found")

    return {
        "message": "Application deleted",
        "id": result[0]
    }