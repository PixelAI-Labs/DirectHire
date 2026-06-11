import socketio
import logging
from core.config import settings

logger = logging.getLogger(__name__)

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.ALLOWED_ORIGINS
)

connected_users = {}  # Map user_id to set of sids

@sio.event
async def connect(sid, environ, auth):
    """
    Client connects. Auth dictionary should contain userId.
    """
    user_id = None
    if auth and "userId" in auth:
        user_id = auth["userId"]
        
    if not user_id:
        logger.warning(f"Connection rejected: No userId provided for sid {sid}")
        return False  # reject connection
        
    if user_id not in connected_users:
        connected_users[user_id] = set()
    connected_users[user_id].add(sid)
    logger.info(f"[Socket] User {user_id} connected with sid {sid}")

@sio.event
async def disconnect(sid):
    """Client disconnects"""
    for user_id, sids in list(connected_users.items()):
        if sid in sids:
            sids.remove(sid)
            if not sids:
                del connected_users[user_id]
            logger.info(f"[Socket] User {user_id} disconnected sid {sid}")
            break
