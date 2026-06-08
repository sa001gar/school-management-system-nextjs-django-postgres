"""Custom exception hierarchy for the RMS application."""

from rest_framework.exceptions import APIException


class RMSBaseException(APIException):
    status_code = 400
    default_detail = "An error occurred."
    default_code = "error"


class NotFoundException(RMSBaseException):
    status_code = 404
    default_detail = "Resource not found."
    default_code = "not_found"


class ConflictException(RMSBaseException):
    status_code = 409
    default_detail = "Resource already exists."
    default_code = "conflict"


class ForbiddenException(RMSBaseException):
    status_code = 403
    default_detail = "You do not have permission to perform this action."
    default_code = "forbidden"


class SessionLockedException(RMSBaseException):
    status_code = 422
    default_detail = "This session is locked and cannot be modified."
    default_code = "session_locked"


class MarksAuthorizationException(RMSBaseException):
    status_code = 403
    default_detail = "You are not authorized to enter marks for this subject."
    default_code = "marks_unauthorized"


class MarksValidationException(RMSBaseException):
    status_code = 422
    default_detail = "Marks validation failed."
    default_code = "marks_validation"
