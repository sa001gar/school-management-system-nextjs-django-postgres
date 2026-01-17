import os
import django
import sys
from django.utils import timezone

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_management_system.settings')
django.setup()

from core_services.models import (
    School, CustomUser, Admin, Teacher, Student, Session, Class, Section
)

def populate():
    print("Creating test data...")
    
    # 1. Create School
    school, created = School.objects.get_or_create(
        code='DEMO',
        defaults={
            'name': 'Demo International School',
            'email': 'contact@demoschool.com',
            'city': 'New York',
            'address': '123 Main St'
        }
    )
    if created:
        print(f"Created School: {school}")
    else:
        print(f"School already exists: {school}")
        
    # 2. Create Site Admin
    site_admin_email = 'site_admin@sms.com'
    if not CustomUser.objects.filter(email=site_admin_email).exists():
        site_admin = CustomUser.objects.create_superuser(
            username='site_admin',
            email=site_admin_email,
            password='password123',
            role='site_admin'
        )
        print(f"Created Site Admin: {site_admin.email} / password123")
    else:
        print("Site Admin already exists")
        
    # 3. Create School Admin
    admin_email = 'admin@demoschool.com'
    if not CustomUser.objects.filter(email=admin_email).exists():
        admin_user = CustomUser.objects.create_user(
            username='school_admin',
            email=admin_email,
            password='password123',
            role='admin',
            school=school
        )
        Admin.objects.create(user=admin_user, school=school, name='Principal Skinner')
        print(f"Created School Admin: {admin_user.email} / password123")
    else:
        print("School Admin already exists")
        
    # 4. Create Teacher
    teacher_email = 'teacher@demoschool.com'
    if not CustomUser.objects.filter(email=teacher_email).exists():
        teacher_user = CustomUser.objects.create_user(
            username='teacher_demo',
            email=teacher_email,
            password='password123',
            role='teacher',
            school=school
        )
        Teacher.objects.create(user=teacher_user, school=school, name='Edna Krabappel')
        print(f"Created Teacher: {teacher_user.email} / password123")
    else:
        print("Teacher already exists")

    # 5. Create Session
    session_name = '2025-2026'
    session, created = Session.objects.get_or_create(
        school=school,
        name=session_name,
        defaults={
            'start_date': timezone.now().date(),
            'end_date': timezone.now().date() + timezone.timedelta(days=365),
            'is_active': True
        }
    )
    if created:
        print(f"Created Session: {session}")
        
    # 6. Create Class
    class_obj, created = Class.objects.get_or_create(
        school=school,
        name='Class 10',
        defaults={'level': 10}
    )
    if created:
        print(f"Created Class: {class_obj}")
        
    # 7. Create Section
    section, created = Section.objects.get_or_create(
        class_ref=class_obj,
        name='A'
    )
    if created:
        print(f"Created Section: {section}")
        
    # 8. Create Student
    student_id = f"{school.code}_2025_001"
    if not Student.objects.filter(student_id=student_id, school=school).exists():
        student = Student.objects.create(
            school=school,
            name='Bart Simpson',
            student_id=student_id,
            admission_session=session,
            admission_class=class_obj
        )
        print(f"Created Student: {student.student_id}")
    else:
        print("Student already exists")

    print("Test data population complete!")

if __name__ == '__main__':
    populate()
