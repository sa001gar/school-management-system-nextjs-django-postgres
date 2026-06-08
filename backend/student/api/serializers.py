"""Serializers for Student Portal API."""

from rest_framework import serializers


class StudentProfileSerializer(serializers.Serializer):
    student_id = serializers.CharField()
    name = serializers.CharField()
    date_of_birth = serializers.DateField()
    father_name = serializers.CharField()
    mother_name = serializers.CharField()
    guardian_name = serializers.CharField()
    guardian_relation = serializers.CharField()
    phone = serializers.CharField()
    alternate_phone = serializers.CharField()
    email = serializers.EmailField()
    profile_pic = serializers.ImageField(allow_null=True)
    address = serializers.CharField()
    admission_date = serializers.DateField()
    is_active = serializers.BooleanField()
    current_enrollment = serializers.DictField(allow_null=True)
    parent_info = serializers.DictField()


class SubjectResultSerializer(serializers.Serializer):
    subject_id = serializers.UUIDField()
    subject_name = serializers.CharField(source="subject.name")
    subject_code = serializers.CharField(source="subject.code")
    total_obtained = serializers.IntegerField()
    total_full = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    grade = serializers.CharField()
    grade_point = serializers.DecimalField(max_digits=3, decimal_places=1)


class ReportCardSerializer(serializers.Serializer):
    student_name = serializers.CharField()
    student_id = serializers.CharField()
    roll_no = serializers.CharField()
    class_name = serializers.CharField()
    section_name = serializers.CharField()
    session_name = serializers.CharField()
    results = SubjectResultSerializer(many=True)
    total_marks = serializers.IntegerField()
    total_full = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    overall_grade = serializers.CharField()
    rank = serializers.IntegerField(allow_null=True)


class AssessmentDetailSerializer(serializers.Serializer):
    assessment_type = serializers.CharField()
    full_marks = serializers.IntegerField()
    obtained_marks = serializers.IntegerField()


class MarksheetSubjectSerializer(serializers.Serializer):
    subject_id = serializers.CharField()
    subject_name = serializers.CharField()
    subject_code = serializers.CharField()
    assessments = AssessmentDetailSerializer(many=True)


class CoCurricularSerializer(serializers.Serializer):
    subject_name = serializers.CharField()
    assessment_type = serializers.CharField()
    obtained_marks = serializers.IntegerField()
    full_marks = serializers.IntegerField()


class MarksheetSerializer(serializers.Serializer):
    student_name = serializers.CharField()
    student_id = serializers.CharField()
    roll_no = serializers.CharField()
    class_name = serializers.CharField()
    section_name = serializers.CharField()
    session_name = serializers.CharField()
    subjects = MarksheetSubjectSerializer(many=True)
    cocurricular = CoCurricularSerializer(many=True)
    total_marks = serializers.IntegerField()
    total_full = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    overall_grade = serializers.CharField()
    rank = serializers.IntegerField(allow_null=True)


class RankingSerializer(serializers.Serializer):
    rank = serializers.IntegerField(allow_null=True)
    total_students = serializers.IntegerField(allow_null=True)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    grade = serializers.CharField(allow_null=True)


class EnrollmentHistorySerializer(serializers.Serializer):
    session_name = serializers.CharField(source="session.name")
    class_name = serializers.CharField(source="class_field.name")
    section_name = serializers.CharField(source="section.name")
    roll_no = serializers.CharField()
    status = serializers.CharField()
    status_display = serializers.CharField(source="get_status_display")
    promotion_date = serializers.DateField(allow_null=True)
    remarks = serializers.CharField()
