"""Authentication service for login, logout, token management."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import structlog
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from shared.base_service import BaseService

User = get_user_model()
logger = structlog.get_logger(__name__)


@dataclass(frozen=True)
class LoginResult:
    access: str
    refresh: str
    user_id: str
    email: str
    role: str


class AuthService(BaseService):
    """Handle authentication operations."""

    def login(self, email: str, password: str) -> LoginResult:
        user = authenticate(email=email, password=password)
        if user is None:
            self.log.warning("auth.login.failed", email=email)
            from shared.exceptions import RMSBaseException
            raise RMSBaseException("Invalid email or password.")

        if not user.is_active:
            self.log.warning("auth.login.inactive", email=email)
            from shared.exceptions import ForbiddenException
            raise ForbiddenException("Account is disabled.")

        refresh = RefreshToken.for_user(user)
        self.log.info("auth.login.success", user_id=str(user.id), role=user.role)

        return LoginResult(
            access=str(refresh.access_token),
            refresh=str(refresh),
            user_id=str(user.id),
            email=user.email,
            role=user.role,
        )

    def logout(self, refresh_token: str) -> None:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            self.log.info("auth.logout.success")
        except Exception:
            self.log.warning("auth.logout.invalid_token")

    def get_tokens_for_user(self, user: Any) -> dict[str, str]:
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
