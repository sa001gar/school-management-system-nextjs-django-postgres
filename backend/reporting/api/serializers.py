"""DRF serializers for reporting API."""

from rest_framework import serializers

from shared.types import ReportCardDTO, MarksheetDTO, SubjectResultDTO


class SubjectResultDTOSerializer(serializers.Serializer):
    """Serializer for SubjectResultDTO."""

    id = serializers.UUIDField()
    enrollment_id = serializers.UUIDField()
    subject_id = serializers.UUIDField()
    total_obtained = serializers.IntegerField()
    total_full = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    grade = serializers.CharField()
    grade_point = serializers.DecimalField(max_digits=3, decimal_places=1)


class ReportCardDTOSerializer(serializers.Serializer):
    """Serializer for ReportCardDTO."""

    student_name = serializers.CharField()
    student_id = serializers.CharField()
    roll_no = serializers.CharField()
    class_name = serializers.CharField()
    section_name = serializers.CharField()
    session_name = serializers.CharField()
    results = SubjectResultDTOSerializer(many=True)
    total_marks = serializers.IntegerField()
    total_full = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    overall_grade = serializers.CharField()
    rank = serializers.IntegerField(allow_null=True, required=False)


class MarksheetDTOSerializer(serializers.Serializer):
    """Serializer for MarksheetDTO."""

    student_name = serializers.CharField()
    student_id = serializers.CharField()
    roll_no = serializers.CharField()
    class_name = serializers.CharField()
    section_name = serializers.CharField()
    session_name = serializers.CharField()
    subjects = serializers.ListField(child=serializers.DictField())
    cocurricular = serializers.ListField(child=serializers.DictField())
    total_marks = serializers.IntegerField()
    total_full = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    overall_grade = serializers.CharField()
    rank = serializers.IntegerField(allow_null=True, required=False)


class ReportCardRequestSerializer(serializers.Serializer):
    """Serializer for report card generation request."""

    enrollment_id = serializers.UUIDField()


class ClassReportRequestSerializer(serializers.Serializer):
    """Serializer for class-level report generation."""

    class_id = serializers.UUIDField()
    section_id = serializers.UUIDField()
    session_id = serializers.UUIDField()


class RankingEntrySerializer(serializers.Serializer):
    """Serializer for a single ranking entry."""

    rank = serializers.IntegerField()
    enrollment_id = serializers.UUIDField()
    student_name = serializers.CharField()
    student_id = serializers.CharField()
    roll_no = serializers.CharField()
    total_obtained = serializers.IntegerField()
    total_full = serializers.IntegerField()
    percentage = serializers.FloatField()
