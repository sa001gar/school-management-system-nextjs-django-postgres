"""Shared middleware for request ID and timing."""

import time
import uuid

from django.http import HttpRequest, HttpResponse


class RequestIDMiddleware:
    """Add a unique request ID to every request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        request.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))  # type: ignore[attr-defined]
        response = self.get_response(request)
        response["X-Request-ID"] = request.request_id  # type: ignore[attr-defined]
        return response


class RequestTimingMiddleware:
    """Add request processing time to response headers."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = (time.monotonic() - start) * 1000
        response["X-Request-Time"] = f"{duration_ms:.2f}ms"
        return response
