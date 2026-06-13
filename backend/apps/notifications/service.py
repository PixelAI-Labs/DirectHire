"""
Notification Service — internal helpers for creating notifications and sending emails
"""

import asyncio
import logging
from apps.notifications.models import Notification
from apps.recruiter.models import Job
from core.config import settings
from core.socket import sio, connected_users

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
        
        # Emit WebSocket event
        sids = list(connected_users.get(user_id, set()))
        if sids:
            for sid in sids:
                try:
                    await sio.emit(
                        "new_notification",
                        {
                            "id": str(notification.id),
                            "type": notification.type,
                            "title": notification.title,
                            "message": notification.message,
                            "created_at": notification.created_at.isoformat(),
                            "read": notification.read,
                            "related_id": notification.related_id
                        },
                        to=sid
                    )
                except Exception as e:
                    logger.warning(f"[Socket] Failed to emit notification to {sid}: {e}")

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
        candidate_id: str, job_title: str, offer_id: str
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

    @staticmethod
    async def notify_interview_scheduled(candidate_id: str, recruiter_id: str, job_title: str, interview_id: str) -> None:
        """Interview scheduled → both parties notified.

        Uses asyncio.gather(return_exceptions=True) so a failure in one
        notification does not cancel the other. Both DB writes are
        attempted; any exception is logged at warning level.
        """
        results = await asyncio.gather(
            NotificationService.create(
                user_id=candidate_id,
                type="INTERVIEW",
                title="Interview Scheduled",
                message=f"An interview for '{job_title}' has been scheduled.",
                related_id=interview_id,
            ),
            NotificationService.create(
                user_id=recruiter_id,
                type="INTERVIEW",
                title="Interview Scheduled",
                message=f"An interview for '{job_title}' has been scheduled with the candidate.",
                related_id=interview_id,
            ),
            return_exceptions=True,
        )
        for r in results:
            if isinstance(r, Exception):
                logger.warning(f"[notify_interview_scheduled] partial failure: {r}")

    @staticmethod
    async def notify_assessment_assigned(candidate_id: str, job_title: str, assessment_id: str) -> None:
        """Assessment assigned → candidate notified."""
        await NotificationService.create(
            user_id=candidate_id,
            type="ASSESSMENT",
            title="Assessment Assigned",
            message=f"You have been assigned a new assessment for '{job_title}'.",
            related_id=assessment_id,
        )