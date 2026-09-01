import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

GMAIL_ADDRESS = os.environ.get("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


def send_password_reset_email(to_email: str, raw_token: str) -> None:
    reset_link = f"{FRONTEND_URL}/reset-password?token={raw_token}"

    message = MIMEMultipart("alternative")
    message["Subject"] = "Reset your Job Tracker password"
    message["From"] = GMAIL_ADDRESS
    message["To"] = to_email

    html_body = f"""
        <p>You requested a password reset for your Job Tracker account.</p>
        <p><a href="{reset_link}">Click here to reset your password</a></p>
        <p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
    """
    message.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_ADDRESS, [to_email], message.as_string())