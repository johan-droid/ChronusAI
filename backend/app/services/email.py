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

    recipients = [addr for addr in to_addresses if addr and addr.strip()]
    if not recipients:
        logger.warning("No valid recipients; skipping email send")
        return False

    msg = EmailMessage()
    sender = settings.smtp_from or settings.smtp_user
    msg["From"] = sender
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = subject
    msg.set_content(body_text)

    if body_html:
        msg.add_alternative(body_html, subtype="html")

    def _send():
        if not settings.smtp_host or not settings.smtp_port:
            logger.error("SMTP host/port not configured")
            return False
        if not settings.smtp_user or not settings.smtp_password:
            logger.error("SMTP credentials not configured")
            return False

        server = None
        try:
            if settings.smtp_use_tls:
                server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30)
                server.ehlo()
                server.starttls()
                server.ehlo()
            else:
                server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=30)
                server.ehlo()

            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
            logger.info("Email sent successfully to %s, subject=%s", msg["To"], subject)
            return True
        except smtplib.SMTPAuthenticationError as exc:
            logger.error("SMTP auth failed (check app password): %s", exc)
            return False
        except smtplib.SMTPException as exc:
            logger.exception("SMTP error sending email: %s", exc)
            return False
        except Exception as exc:
            logger.exception("Failed to send email: %s", exc)
            return False
        finally:
            if server is not None:
                try:
                    server.quit()
                except Exception:
                    pass

    return await asyncio.to_thread(_send)
