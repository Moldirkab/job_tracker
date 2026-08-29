from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    password: str


class JobApplication(BaseModel):
    company: str
    position: str
    location: str
    status: str
    job_url: str | None = None
    notes: str | None = None
    salary: str | None = None
    skills: list[str] | None = None


class ApplicationUpdate(BaseModel):
    company: str | None = None
    position: str | None = None
    location: str | None = None
    status: str | None = None
    job_url: str | None = None
    notes: str | None = None
    salary: str | None = None
    skills: list[str] | None = None

class ImportRequest(BaseModel):
    url: str


class ImportPreview(BaseModel):
    company: str
    position: str
    location: str
    salary: str | None = None
    skills: list[str] = []

class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"