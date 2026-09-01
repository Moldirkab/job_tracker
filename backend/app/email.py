import os
import resend

resend.api_key = os.environ.get("RESEND_API_KEY")

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


def send_password_reset_email(to_email: str, raw_token: str) -> None:
    reset_link = f"{FRONTEND_URL}/reset-password?token={raw_token}"

    resend.Emails.send({
        "from": "Job Tracker <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Reset your Job Tracker password",
        "html": f"""
            <p>You requested a password reset for your Job Tracker account.</p>
            <p><a href="{reset_link}">Click here to reset your password</a></p>
            <p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
        """,
    })