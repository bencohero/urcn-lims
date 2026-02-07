"""WebSocket service for real-time notifications."""

import json
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import WebSocket

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.utils.logger import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time notifications."""

    def __init__(self):
        # Map of user_id -> list of WebSocket connections
        self._connections: Dict[str, List[WebSocket]] = {}
        # Map of WebSocket -> user_id
        self._websocket_users: Dict[WebSocket, str] = {}

    @property
    def active_connections_count(self) -> int:
        """Get total number of active connections."""
        return sum(len(conns) for conns in self._connections.values())

    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None):
        """
        Accept a WebSocket connection.

        Args:
            websocket: The WebSocket connection
            user_id: Optional user ID to associate with the connection
        """
        await websocket.accept()

        if user_id:
            if user_id not in self._connections:
                self._connections[user_id] = []
            self._connections[user_id].append(websocket)
            self._websocket_users[websocket] = user_id

        logger.info(
            "WebSocket connected",
            user_id=user_id,
            total_connections=self.active_connections_count,
        )

    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection.

        Args:
            websocket: The WebSocket connection to remove
        """
        user_id = self._websocket_users.get(websocket)
        if user_id and user_id in self._connections:
            self._connections[user_id] = [
                ws for ws in self._connections[user_id] if ws != websocket
            ]
            if not self._connections[user_id]:
                del self._connections[user_id]

        if websocket in self._websocket_users:
            del self._websocket_users[websocket]

        logger.info(
            "WebSocket disconnected",
            user_id=user_id,
            total_connections=self.active_connections_count,
        )

    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """
        Send a message to all connections of a specific user.

        Args:
            user_id: The user ID to send to
            message: The message to send
        """
        connections = self._connections.get(user_id, [])
        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(
                    "Failed to send WebSocket message",
                    user_id=user_id,
                    error=str(e),
                )
                self.disconnect(websocket)

    async def send_to_users(self, user_ids: List[str], message: Dict[str, Any]):
        """
        Send a message to multiple users.

        Args:
            user_ids: List of user IDs to send to
            message: The message to send
        """
        for user_id in user_ids:
            await self.send_to_user(user_id, message)

    async def broadcast(self, message: Dict[str, Any]):
        """
        Broadcast a message to all connected clients.

        Args:
            message: The message to broadcast
        """
        for user_id in list(self._connections.keys()):
            await self.send_to_user(user_id, message)

    async def send_notification(
        self,
        user_id: str,
        notification_id: str,
        notification_type: str,
        title: str,
        message: str,
        priority: str = "NORMAL",
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[str] = None,
    ):
        """
        Send a notification through WebSocket.

        Args:
            user_id: User to notify
            notification_id: ID of the notification
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            priority: Notification priority
            related_entity_type: Type of related entity
            related_entity_id: ID of related entity
        """
        payload = {
            "type": "notification",
            "data": {
                "id": notification_id,
                "notification_type": notification_type,
                "title": title,
                "message": message,
                "priority": priority,
                "related_entity_type": related_entity_type,
                "related_entity_id": related_entity_id,
            },
        }
        await self.send_to_user(user_id, payload)

        logger.info(
            "Notification sent via WebSocket",
            user_id=user_id,
            notification_id=notification_id,
            notification_type=notification_type,
        )

    def is_user_connected(self, user_id: str) -> bool:
        """Check if a user has any active connections."""
        return user_id in self._connections and len(self._connections[user_id]) > 0

    def get_connected_users(self) -> List[str]:
        """Get list of connected user IDs."""
        return list(self._connections.keys())


# Global connection manager instance
connection_manager = ConnectionManager()
