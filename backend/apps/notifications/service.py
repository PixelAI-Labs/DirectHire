"""
Notification Service — internal helpers for creating notifications and sending emails
"""

import logging
from datetime import datetime

from apps.notifications.models import Notification
from apps.recruiter.models import Job
from apps.candidate.models import Application
from core.config import settings

logger = logging.getLogger(__name__)


async def _send_email(to: str, subject: str, body: str) -> None:
    """Send an email asynchronously via SMTP. Logs warning if SMTP not configured."""
    if not settings.SMTP_HOST:
        logger.warning(f"[Email] SMTP not configured — skipping email to {to}: {subject}")
        return

    try:
        import aiosmtplib
        from email.message import EmailMessage

        msg = EmailMessage()
        msg["From"] = settings.SMTP_FROM or "noreply@directhire.ai"
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(body)

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            start_tls=True,
        )
        logger.info(f"[Email] Sent to {to}: {subject}")
    except Exception as e:
        logger.warning(f"[Email] Failed to send to {to}: {e}")


class NotificationService:
    @staticmethod
    async def create(
        user_id: str,
        type: str,
        title: str,
        message: str,
        related_id: str | None = None,
    ) -> Notification:
        """Create and persist a notification record."""
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            related_id=related_id,
        )
        await notification.insert()
        return notification

    @staticmethod
    async def notify_applied(candidate_id: str, job_id: str, job_title: str) -> None:
        """Candidate applied → notify candidate (confirmation) + recruiter who owns the job."""
        # Notify candidate — application confirmed
        await NotificationService.create(
            user_id=candidate_id,
            type="APPLICATION",
            title="Application Submitted",
            message=f"Your application for '{job_title}' has been submitted successfully.",
            related_id=job_id,
        )

        # Notify recruiter — new applicant
        job = await Job.get(job_id)
        if job and job.company_id:
            from apps.company.models import Company

            company = await Company.get(job.company_id)
            if company:
                # Find recruiter(s) for this company
                from apps.auth.models import User, UserRole

                recruiters = await User.find(
                    User.company_id == job.company_id,
                    User.role == UserRole.RECRUITER,
                ).to_list()
                for recruiter in recruiters:
                    await NotificationService.create(
                        user_id=str(recruiter.id),
                        type="APPLICATION",
                        title="New Application",
                        message=f"A new candidate applied for '{job_title}'.",
                        related_id=job_id,
                    )

    @staticmethod
    async def notify_offer_created(
        candidate_id: str, job_id: str, job_title: str, offer_id: str
    ) -> None:
        """Recruiter created offer → notify candidate."""
        await NotificationService.create(
            user_id=candidate_id,
            type="OFFER",
            title="Job Offer Received",
            message=f"You received an offer for '{job_title}'. Please review and respond.",
            related_id=offer_id,
        )

    @staticmethod
    async def notify_offer_accepted(
        recruiter_id: str, candidate_name: str, job_title: str
    ) -> None:
        """Candidate accepted offer → notify recruiter."""
        await NotificationService.create(
            user_id=recruiter_id,
            type="OFFER_RESPONSE",
            title="Offer Accepted",
            message=f"{candidate_name} accepted your offer for '{job_title}'.",
        )

    @staticmethod
    async def notify_offer_rejected(
        recruiter_id: str, candidate_name: str, job_title: str
    ) -> None:
        """Candidate rejected offer → notify recruiter."""
        await NotificationService.create(
            user_id=recruiter_id,
            type="OFFER_RESPONSE",
            title="Offer Declined",
            message=f"{candidate_name} declined your offer for '{job_title}'.",
        )