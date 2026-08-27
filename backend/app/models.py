from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    password: str


class JobApplication(BaseModel):
    company: str
    position: str
    location: str
    status: str


class ApplicationUpdate(BaseModel):
    company: str | None = None
    position: str | None = None
    location: str | None = None
    status: str | None = None