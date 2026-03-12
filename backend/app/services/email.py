from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage
from typing import Iterable, Optional

from app.config import settings

logger = logging.getLogger(__name__)


async def send_email(
    to_addresses: Iterable[str],
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
) -> bool:
    """Send an email using configured SMTP server.

    This runs the blocking smtplib call in a thread via ``asyncio.to_thread``.
    Returns True on success, False otherwise.
    """
    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        logger.warning("SMTP not configured; skipping email send")
        return False

    msg = EmailMessage()
    sender = settings.smtp_from or settings.smtp_user
    msg["From"] = sender
    msg["To"] = ", ".join(to_addresses)
    msg["Subject"] = subject
    msg.set_content(body_text)

    if body_html:
        msg.add_alternative(body_html, subtype="html")

    def _send():
        try:
            if settings.smtp_use_tls:
                server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=20)

            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as exc:  # pragma: no cover - environment dependent
            logger.exception("Failed to send email: %s", exc)
            return False

    return await asyncio.to_thread(_send)
