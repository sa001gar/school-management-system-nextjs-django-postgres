"""Management command to seed development data."""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Seed development database with sample data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding development data...")

        # Create admin user
        admin, created = User.objects.get_or_create(
            email="admin@school.com",
            defaults={
                "username": "admin",
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
                "first_name": "Admin",
                "last_name": "User",
            },
        )
        if created:
            admin.set_password("admin123")
            admin.save()
            self.stdout.write(self.style.SUCCESS(f"Created admin: admin@school.com / admin123"))

            from identity.models import AdminProfile
            AdminProfile.objects.get_or_create(
                user=admin, defaults={"name": "School Admin"}
            )

        # Create teacher user
        teacher, created = User.objects.get_or_create(
            email="teacher@school.com",
            defaults={
                "username": "teacher",
                "role": "teacher",
                "first_name": "Teacher",
                "last_name": "User",
            },
        )
        if created:
            teacher.set_password("teacher123")
            teacher.save()
            self.stdout.write(self.style.SUCCESS(f"Created teacher: teacher@school.com / teacher123"))

            from identity.models import TeacherProfile
            TeacherProfile.objects.get_or_create(
                user=teacher, defaults={"name": "Sample Teacher"}
            )

        # Create academic session
        from academics.models import AcademicSession
        session, created = AcademicSession.objects.get_or_create(
            name="2025-2026",
            defaults={
                "start_date": "2025-04-01",
                "end_date": "2026-03-31",
                "is_active": True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created session: 2025-2026"))

        # Create classes
        from academics.models import Class, Section
        classes_data = [
            ("Class 1", 1), ("Class 2", 2), ("Class 3", 3),
            ("Class 4", 4), ("Class 5", 5), ("Class 6", 6),
            ("Class 7", 7), ("Class 8", 8), ("Class 9", 9), ("Class 10", 10),
        ]
        for name, level in classes_data:
            cls, _ = Class.objects.get_or_create(name=name, defaults={"level": level})
            for section_name in ["A", "B"]:
                Section.objects.get_or_create(
                    name=section_name, class_ref=cls
                )

        # Create subjects
        from academics.models import Subject
        subjects_data = [
            ("Mathematics", "MATH", "core", 100),
            ("English", "ENG", "core", 100),
            ("Science", "SCI", "core", 100),
            ("Social Studies", "SST", "core", 100),
            ("Hindi", "HIN", "core", 100),
            ("Computer Science", "CS", "optional", 50),
            ("Physical Education", "PE", "cocurricular", 50),
            ("Art", "ART", "cocurricular", 50),
        ]
        for name, code, stype, fm in subjects_data:
            Subject.objects.get_or_create(
                code=code,
                defaults={"name": name, "subject_type": stype, "default_full_marks": fm},
            )

        # Create assessment types
        from academics.models import AssessmentType
        assessments = [
            ("Unit Test 1", "UT1", "summative", 1),
            ("Unit Test 2", "UT2", "summative", 2),
            ("Mid-Term Exam", "MID", "summative", 3),
            ("Assignment 1", "AS1", "formative", 4),
            ("Assignment 2", "AS2", "formative", 5),
            ("Final Exam", "FINAL", "summative", 6),
            ("Project", "PROJ", "project", 7),
            ("Practical", "PRA", "practical", 8),
        ]
        for name, code, cat, order in assessments:
            AssessmentType.objects.get_or_create(
                code=code,
                defaults={"name": name, "category": cat, "display_order": order},
            )

        # Create grade policies
        from academics.models import GradePolicy
        grades = [
            ("AA", 90, 100, 4.0, 1),
            ("A+", 75, 89.99, 3.5, 2),
            ("A", 60, 74.99, 3.0, 3),
            ("B+", 45, 59.99, 2.5, 4),
            ("B", 34, 44.99, 2.0, 5),
            ("C", 25, 33.99, 1.0, 6),
            ("F", 0, 24.99, 0.0, 7),
        ]
        for label, min_p, max_p, gp, order in grades:
            GradePolicy.objects.get_or_create(
                grade_label=label,
                defaults={
                    "min_percentage": min_p,
                    "max_percentage": max_p,
                    "grade_point": gp,
                    "display_order": order,
                },
            )

        self.stdout.write(self.style.SUCCESS("Development data seeded successfully!"))
