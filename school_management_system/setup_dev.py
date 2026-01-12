#!/usr/bin/env python
"""
Development setup script for the School Management System.
Run this after installing dependencies to set up the database and create initial data.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_management_system.settings')
django.setup()

from django.contrib.auth import get_user_model
from core_services.models import (
    Admin, Teacher, Session, Class, Section, Subject, 
    CocurricularSubject, OptionalSubject, ClassSubjectAssignment
)
from datetime import date, timedelta

User = get_user_model()


def create_superuser():
    """Create admin superuser if not exists."""
    email = 'admin@school.com'
    password = 'admin123'
    
    if not User.objects.filter(email=email).exists():
        user = User.objects.create_superuser(
            username='admin',
            email=email,
            password=password,
            role='admin'
        )
        Admin.objects.create(
            id=user.id,
            user=user,
            name='System Administrator'
        )
        print(f"✓ Created admin user: {email} / {password}")
    else:
        print(f"✓ Admin user already exists: {email}")


def create_sample_teacher():
    """Create sample teacher if not exists."""
    email = 'teacher@school.com'
    password = 'teacher123'
    
    if not User.objects.filter(email=email).exists():
        user = User.objects.create_user(
            username='teacher1',
            email=email,
            password=password,
            role='teacher'
        )
        Teacher.objects.create(
            id=user.id,
            user=user,
            name='Demo Teacher'
        )
        print(f"✓ Created teacher user: {email} / {password}")
    else:
        print(f"✓ Teacher user already exists: {email}")


def create_academic_data():
    """Create sample academic data."""
    # Create session
    session, created = Session.objects.get_or_create(
        name='2025-2026',
        defaults={
            'start_date': date(2025, 4, 1),
            'end_date': date(2026, 3, 31),
            'is_active': True
        }
    )
    if created:
        print("✓ Created session: 2025-2026")
    else:
        print("✓ Session already exists: 2025-2026")
    
    # Create classes
    classes = [
        ('Class I', 1),
        ('Class II', 2),
        ('Class III', 3),
        ('Class IV', 4),
        ('Class V', 5),
    ]
    
    for name, level in classes:
        cls, created = Class.objects.get_or_create(name=name, defaults={'level': level})
        if created:
            # Create sections for each class
            for section_name in ['A', 'B']:
                Section.objects.get_or_create(name=section_name, class_ref=cls)
            print(f"✓ Created class: {name} with sections A, B")
    
    # Create subjects
    subjects = [
        ('English', 'ENG', 100),
        ('Hindi', 'HIN', 100),
        ('Mathematics', 'MAT', 100),
        ('Science', 'SCI', 100),
        ('Social Studies', 'SST', 100),
    ]
    
    for name, code, full_marks in subjects:
        subject, created = Subject.objects.get_or_create(
            name=name,
            defaults={'code': code, 'full_marks': full_marks}
        )
        if created:
            print(f"✓ Created subject: {name}")
    
    # Create cocurricular subjects
    cocurricular = [
        ('Art & Craft', 'ART'),
        ('Music', 'MUS'),
        ('Physical Education', 'PE'),
    ]
    
    for name, code in cocurricular:
        subj, created = CocurricularSubject.objects.get_or_create(
            name=name,
            defaults={'code': code}
        )
        if created:
            print(f"✓ Created cocurricular subject: {name}")
    
    # Create optional subjects
    optional = [
        ('Computer Science', 'CS', 100),
        ('Sanskrit', 'SKT', 100),
    ]
    
    for name, code, full_marks in optional:
        subj, created = OptionalSubject.objects.get_or_create(
            name=name,
            defaults={'code': code, 'default_full_marks': full_marks}
        )
        if created:
            print(f"✓ Created optional subject: {name}")
    
    print("\n✓ Academic data setup complete!")


def main():
    print("\n" + "="*50)
    print("School Management System - Development Setup")
    print("="*50 + "\n")
    
    create_superuser()
    create_sample_teacher()
    create_academic_data()
    
    print("\n" + "="*50)
    print("Setup Complete!")
    print("="*50)
    print("\nYou can now:")
    print("1. Start the Django server: python manage.py runserver")
    print("2. Access admin panel: http://localhost:8000/admin/")
    print("3. API endpoints: http://localhost:8000/api/v1/")
    print("\nLogin credentials:")
    print("  Admin: admin@school.com / admin123")
    print("  Teacher: teacher@school.com / teacher123")
    print()


if __name__ == '__main__':
    main()
