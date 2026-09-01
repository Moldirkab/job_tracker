import os
import smtplib
import socket
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

    # Force IPv4 — some cloud hosts (Render included) lack outbound IPv6
    # routing, and smtplib can otherwise pick an IPv6 address for
    # smtp.gmail.com and fail with "Network is unreachable" before the
    # SMTP handshake even begins.
    ipv4_address = socket.getaddrinfo("smtp.gmail.com", 465, socket.AF_INET)[0][4][0]

    with smtplib.SMTP_SSL(ipv4_address, 465) as server:
        server.ehlo("smtp.gmail.com")
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_ADDRESS, [to_email], message.as_string())