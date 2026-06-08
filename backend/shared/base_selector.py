"""Base selector class for complex read queries."""

import structlog

logger = structlog.get_logger(__name__)


class BaseSelector:
    """Base selector class with structured logging."""

    @property
    def log(self) -> structlog.stdlib.BoundLogger:
        return logger.bind(selector=self.__class__.__name__)
