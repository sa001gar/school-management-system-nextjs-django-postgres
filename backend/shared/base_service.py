"""Base service class."""

import structlog

logger = structlog.get_logger(__name__)


class BaseService:
    """Base service class with structured logging."""

    @property
    def log(self) -> structlog.stdlib.BoundLogger:
        return logger.bind(service=self.__class__.__name__)
