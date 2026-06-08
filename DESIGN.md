# RMS Refactoring Plan — Production-Grade Result Management System

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Entity Disposition Matrix](#3-entity-disposition-matrix)
4. [New ERD — Normalized Database Design](#4-new-erd)
5. [Refactored Domain Model](#5-refactored-domain-model)
6. [Module Boundaries](#6-module-boundaries)
7. [Service Contracts](#7-service-contracts)
8. [Repository Interfaces](#8-repository-interfaces)
9. [API Design](#9-api-design)
10. [Permission Matrix](#10-permission-matrix)
11. [Database Migration Strategy](#11-database-migration-strategy)
12. [Testing Strategy](#12-testing-strategy)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Rollback Strategy](#14-rollback-strategy)

---

## 1. Executive Summary

**Goal:** Transform a multi-tenant school ERP (33+ models, fat views, no tests) into a single-school Result Management System with domain-driven modular monolith architecture, service-repository layers, and full test coverage.

**Key Decisions:**
- **Unified Subject** model with `subject_type` enum (eliminates 3 separate subject tables)
- **Fully dynamic marks** via AssessmentType + MarksEntry (no hardcoded terms)
- **Configurable grading** via GradePolicy table (admin-editable, no code change)
- **Pure Enrollment model** (Student stores only permanent identity)
- **6 domain modules** with strict boundary enforcement

**Scope:** 22 models → 16 models. 3 apps → 6 modules. Fat views → Service + Repository + Selector layers.

---

## 2. Current State Analysis

### 2.1 Existing Architecture Problems

| Problem | Evidence |
|---------|----------|
| **Fat views** | `core_services/views.py` = 1333+ lines, business logic in views |
| **No service layer** | Zero `services.py` files anywhere |
| **No repository layer** | All ORM queries in views/serializers |
| **No tests** | All 3 `tests.py` files are empty stubs |
| **Multi-school overhead** | `School` FK on 15+ models, `SchoolScopedMixin` everywhere |
| **Hardcoded marks structure** | 3-term summative/formative baked into `StudentResult` model |
| **Duplicate subject models** | `Subject`, `OptionalSubject`, `CocurricularSubject` — same structure, different tables |
| **Legacy + new enrollment** | Student has both direct FK fields AND `StudentEnrollment` model |
| **Finance coupling** | `check_student_fees_cleared()` blocks marks entry, marksheet generation |
| **No type hints** | Zero type annotations across the codebase |
| **No OpenAPI docs** | No `drf-spectacular` or similar configured |

### 2.2 Entities to REMOVE

| Model | Table | Reason |
|-------|-------|--------|
| `School` | `schools` | Single-school architecture |
| `SchoolConfig` | `school_config` | School-specific config |
| `FeeStructure` | `fee_structures` | Finance domain removed |
| `FeeDiscount` | `fee_discounts` | Finance domain removed |
| `StudentFee` | `student_fees` | Finance domain removed |
| `Payment` | `payments` | Finance domain removed |
| `PaymentReminder` | `payment_reminders` | Finance domain removed |
| `ClassOptionalConfig` | `class_optional_config` | Replaced by `ClassSubject.is_optional` |
| `ClassCocurricularConfig` | `class_cocurricular_config` | Replaced by `Subject.subject_type` |
| `ClassMarksDistribution` | `class_marks_distribution` | Replaced by dynamic `AssessmentType` |
| `StudentResult` (as stored) | `student_results` | Replaced by `MarksEntry` + computed view |
| `StudentCocurricularResult` | `student_cocurricular_results` | Merged into `MarksEntry` |
| `StudentOptionalResult` | `student_optional_results` | Merged into `MarksEntry` |
| `OptionalSubject` | `optional_subjects` | Merged into `Subject` |
| `CocurricularSubject` | `cocurricular_subjects` | Merged into `Subject` |
| `OptionalTeacherAssignment` | `optional_teacher_assignments` | Merged into `TeacherAssignment` |
| `CocurricularTeacherAssignment` | `cocurricular_teacher_assignments` | Merged into `TeacherAssignment` |

### 2.3 Entities to KEEP/TRANSFORM

| Current Model | New Model | Module | Key Changes |
|---------------|-----------|--------|-------------|
| `CustomUser` | `User` | identity | Remove `school` FK, simplify roles |
| `Admin` | `AdminProfile` | identity | Remove `school` FK |
| `Teacher` | `TeacherProfile` | identity | Remove `school` FK |
| `Session` | `AcademicSession` | academics | Remove `school` FK |
| `Class` | `Class` | academics | Remove `school` FK |
| `Section` | `Section` | academics | No change |
| `Subject` | `Subject` | academics | Add `subject_type` enum, remove `school` FK |
| `ClassSubjectAssignment` | `ClassSubject` | academics | Add `is_optional`, `full_marks` |
| `AssessmentCategory` | `AssessmentType` | academics | Remove `school` FK |
| `CoreSubjectMarksDistribution` | `AssessmentWeightage` | academics | Unified, links AssessmentType→ClassSubject |
| `Student` | `Student` | enrollments | Remove school FK, remove legacy class/section/session FKs |
| `StudentEnrollment` | `Enrollment` | enrollments | Remove legacy fields |
| `ClassTeacher` | `ClassTeacher` | enrollments | Simplify |
| `TeacherAssignment` | `TeacherAssignment` | academics | Add `subject_type`, merge cocurricular/optional |
| — | `GradePolicy` | academics | New: configurable grade boundaries |
| — | `MarksEntry` | results | New: dynamic per-assessment marks |
| — | `SubjectResult` | results | New: computed aggregate per subject |

---

## 3. New ERD — Normalized Database Design

### 3.1 Module: `identity`

```
┌─────────────────────────────────────────┐
│              User                        │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ email           VARCHAR(254) UNIQUE     │
│ username        VARCHAR(150) UNIQUE     │
│ password        VARCHAR(128)            │
│ first_name      VARCHAR(150)            │
│ last_name       VARCHAR(150)            │
│ role            ENUM(admin,teacher)      │
│ is_active       BOOLEAN                 │
│ is_staff        BOOLEAN                 │
│ last_login      DATETIME                │
│ date_joined     DATETIME                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           AdminProfile                  │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ user_id         UUID FK → User          │
│ name            VARCHAR(255)            │
│ created_at      DATETIME                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          TeacherProfile                 │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ user_id         UUID FK → User          │
│ name            VARCHAR(255)            │
│ created_at      DATETIME                │
└─────────────────────────────────────────┘
```

**Roles:** Only `admin` and `teacher`. Students authenticate via a separate mechanism (student_id + password) without a User record, OR we add `student` role if portal needed.

### 3.2 Module: `academics`

```
┌─────────────────────────────────────────┐
│          AcademicSession                │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ name            VARCHAR(100)            │
│ start_date      DATE                    │
│ end_date        DATE                    │
│ is_active       BOOLEAN                 │
│ is_locked       BOOLEAN                 │
│ created_at      DATETIME                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│              Class                      │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ name            VARCHAR(100)            │
│ level           INTEGER                 │
│ created_at      DATETIME                │
│ UNIQUE(name)                             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│             Section                     │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ name            VARCHAR(50)             │
│ class_id        UUID FK → Class         │
│ created_at      DATETIME                │
│ UNIQUE(class_id, name)                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│             Subject                     │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ name            VARCHAR(100)            │
│ code            VARCHAR(20) UNIQUE      │
│ subject_type    ENUM(core,optional,     │
│                      cocurricular)      │
│ default_full_marks INTEGER DEFAULT 100  │
│ created_at      DATETIME                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│            ClassSubject                 │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ class_id        UUID FK → Class         │
│ subject_id      UUID FK → Subject       │
│ is_required     BOOLEAN DEFAULT TRUE    │
│ full_marks      INTEGER                 │
│ created_at      DATETIME                │
│ UNIQUE(class_id, subject_id)            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          AssessmentType                 │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ name            VARCHAR(100)            │
│ code            VARCHAR(50) UNIQUE      │
│ category        ENUM(summative,         │
│                      formative,         │
│                      project,           │
│                      practical, other)  │
│ display_order   INTEGER                 │
│ is_active       BOOLEAN                 │
│ created_at      DATETIME                │
│ updated_at      DATETIME                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         AssessmentWeightage             │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ class_id        UUID FK → Class         │
│ subject_id      UUID FK → Subject       │
│ assessment_type_id UUID FK → AssessmentType │
│ full_marks      INTEGER                 │
│ weightage_pct   DECIMAL(5,2)            │
│ created_at      DATETIME                │
│ updated_at      DATETIME                │
│ UNIQUE(class_id, subject_id,            │
│        assessment_type_id)              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           GradePolicy                   │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ name            VARCHAR(100)            │
│ min_percentage  DECIMAL(5,2)            │
│ max_percentage  DECIMAL(5,2)            │
│ grade_label     VARCHAR(10)             │
│ grade_point     DECIMAL(3,1)            │
│ display_order   INTEGER                 │
│ is_active       BOOLEAN                 │
│ created_at      DATETIME                │
│ updated_at      DATETIME                │
│ UNIQUE(grade_label)                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        TeacherAssignment                │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ teacher_id      UUID FK → TeacherProfile│
│ class_id        UUID FK → Class         │
│ section_id      UUID FK → Section       │
│ subject_id      UUID FK → Subject       │
│ session_id      UUID FK → AcademicSession│
│ is_active       BOOLEAN                 │
│ created_at      DATETIME                │
│ updated_at      DATETIME                │
│ UNIQUE(teacher_id, class_id, section_id,│
│        subject_id, session_id)          │
└─────────────────────────────────────────┘
```

### 3.3 Module: `enrollments`

```
┌─────────────────────────────────────────┐
│              Student                    │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ student_id      VARCHAR(50) UNIQUE      │
│ name            VARCHAR(255)            │
│ date_of_birth   DATE                    │
│ father_name     VARCHAR(255)            │
│ mother_name     VARCHAR(255)            │
│ guardian_name   VARCHAR(255)            │
│ guardian_relation VARCHAR(100)          │
│ phone           VARCHAR(20)             │
│ alternate_phone VARCHAR(20)             │
│ email           VARCHAR(254)            │
│ profile_pic     VARCHAR(100)            │
│ address         TEXT                    │
│ admission_date  DATE                    │
│ admission_class_id UUID FK → Class      │
│ admission_session_id UUID FK → AcadSession│
│ password_hash   VARCHAR(128)            │
│ is_active       BOOLEAN                 │
│ created_at      DATETIME                │
│ updated_at      DATETIME                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│            Enrollment                   │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ student_id      UUID FK → Student       │
│ session_id      UUID FK → AcadSession   │
│ class_id        UUID FK → Class         │
│ section_id      UUID FK → Section       │
│ roll_no         VARCHAR(50)             │
│ status          ENUM(active,promoted,   │
│                      retained,          │
│                      transferred,       │
│                      graduated, dropped)│
│ promoted_to_id  UUID FK → Enrollment    │
│ promotion_date  DATE                    │
│ remarks         TEXT                    │
│ created_at      DATETIME                │
│ updated_at      DATETIME                │
│ UNIQUE(student_id, session_id)          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          ClassTeacher                   │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ teacher_id      UUID FK → TeacherProfile│
│ class_id        UUID FK → Class         │
│ section_id      UUID FK → Section       │
│ session_id      UUID FK → AcadSession   │
│ is_active       BOOLEAN                 │
│ created_at      DATETIME                │
│ updated_at      DATETIME                │
│ UNIQUE(class_id, section_id, session_id)│
└─────────────────────────────────────────┘
```

### 3.4 Module: `results`

```
┌─────────────────────────────────────────┐
│            MarksEntry                   │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ enrollment_id   UUID FK → Enrollment    │
│ subject_id      UUID FK → Subject       │
│ assessment_type_id UUID FK → AssessmentType│
│ full_marks      INTEGER                 │
│ obtained_marks  INTEGER                 │
│ remarks         VARCHAR(255)            │
│ entered_by_id   UUID FK → User          │
│ created_at      DATETIME                │
│ updated_at      DATETIME                │
│ UNIQUE(enrollment_id, subject_id,       │
│        assessment_type_id)              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         SubjectResult (view/table)      │
├─────────────────────────────────────────┤
│ id              UUID PK                 │
│ enrollment_id   UUID FK → Enrollment    │
│ subject_id      UUID FK → Subject       │
│ total_obtained  INTEGER (computed)      │
│ total_full      INTEGER (computed)      │
│ percentage      DECIMAL(5,2) (computed) │
│ grade           VARCHAR(10) (computed)  │
│ grade_point     DECIMAL(3,1) (computed) │
│ created_at      DATETIME                │
│ updated_at      DATETIME                │
│ UNIQUE(enrollment_id, subject_id)       │
└─────────────────────────────────────────┘
```

**Note:** `SubjectResult` is either a **materialized view** or a **computed table** refreshed via service layer when marks are entered. This avoids expensive aggregation on every report card request.

### 3.5 ERD Relationship Summary

```
User ──1:1── AdminProfile
User ──1:1── TeacherProfile

AcademicSession (standalone)
Class ──1:N── Section
Class ──M:N── Subject (via ClassSubject)
Subject (unified: core/optional/cocurricular)

AssessmentType (standalone: UT1, Mid, Final, Project...)
AssessmentType ──M:N── ClassSubject (via AssessmentWeightage)

TeacherProfile ──M:N── Class+Section+Subject+Session (via TeacherAssignment)

Student (permanent identity)
Student ──1:N── Enrollment
Enrollment ──M:1── Class, Section, AcademicSession
Enrollment ──1:N── MarksEntry
MarksEntry ──M:1── Subject, AssessmentType
MarksEntry ──M:1── User (entered_by)

GradePolicy (standalone: grade boundaries)
```

---

## 4. Module Boundaries

### 4.1 Module Structure

```
backend/
├── config/                          # Django project settings
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
│
├── identity/                        # Module 1: User Management
│   ├── __init__.py
│   ├── models.py                    # User, AdminProfile, TeacherProfile
│   ├── admin.py
│   ├── apps.py
│   ├── migrations/
│   ├── services/
│   │   ├── __init__.py
│   │   └── auth_service.py          # Login, logout, token management
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── user_repository.py       # User CRUD persistence
│   ├── selectors/
│   │   ├── __init__.py
│   │   └── user_selector.py         # User queries (get by role, etc.)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── permissions.py
│   └── tests/
│       ├── __init__.py
│       ├── test_services.py
│       └── test_repositories.py
│
├── academics/                       # Module 2: Academic Structure
│   ├── __init__.py
│   ├── models.py                    # AcademicSession, Class, Section, Subject,
│   │                                # ClassSubject, AssessmentType,
│   │                                # AssessmentWeightage, GradePolicy,
│   │                                # TeacherAssignment
│   ├── admin.py
│   ├── apps.py
│   ├── migrations/
│   ├── services/
│   │   ├── __init__.py
│   │   ├── session_service.py
│   │   ├── class_service.py
│   │   ├── subject_service.py
│   │   ├── assessment_service.py
│   │   ├── grading_service.py
│   │   └── assignment_service.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── session_repository.py
│   │   ├── class_repository.py
│   │   ├── subject_repository.py
│   │   └── assignment_repository.py
│   ├── selectors/
│   │   ├── __init__.py
│   │   ├── session_selector.py
│   │   ├── class_selector.py
│   │   └── subject_selector.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── permissions.py
│   └── tests/
│
├── enrollments/                     # Module 3: Student & Enrollment
│   ├── __init__.py
│   ├── models.py                    # Student, Enrollment, ClassTeacher
│   ├── admin.py
│   ├── apps.py
│   ├── migrations/
│   ├── services/
│   │   ├── __init__.py
│   │   ├── student_service.py
│   │   ├── enrollment_service.py    # Promote, retain, transfer
│   │   └── classteacher_service.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── student_repository.py
│   │   ├── enrollment_repository.py
│   │   └── classteacher_repository.py
│   ├── selectors/
│   │   ├── __init__.py
│   │   ├── student_selector.py
│   │   └── enrollment_selector.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── permissions.py
│   └── tests/
│
├── results/                         # Module 4: Marks Entry & Results
│   ├── __init__.py
│   ├── models.py                    # MarksEntry, SubjectResult
│   ├── admin.py
│   ├── apps.py
│   ├── migrations/
│   ├── services/
│   │   ├── __init__.py
│   │   ├── marks_entry_service.py   # Enter, update, bulk upsert marks
│   │   └── result_service.py        # Compute SubjectResult, aggregates
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── marks_entry_repository.py
│   │   └── result_repository.py
│   ├── selectors/
│   │   ├── __init__.py
│   │   ├── marks_entry_selector.py
│   │   └── result_selector.py       # Complex result queries
│   ├── api/
│   │   ├── __init__.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── permissions.py
│   └── tests/
│
└── reporting/                       # Module 5: Report Cards & Marksheets
    ├── __init__.py
    ├── services/
    │   ├── __init__.py
    │   ├── report_card_service.py   # Generate report card data
    │   └── marksheet_service.py     # Class-wide marksheet
    ├── selectors/
    │   ├── __init__.py
    │   └── report_selector.py       # Aggregation queries
    ├── api/
    │   ├── __init__.py
    │   ├── serializers.py
    │   ├── views.py
    │   └── urls.py
    └── tests/
```

### 4.2 Cross-Module Dependency Rules

```
identity       → (no internal deps)
academics      → identity (for TeacherAssignment → TeacherProfile)
enrollments    → identity, academics (for Enrollment → Student, Class, Section, Session)
results        → enrollments, academics (for MarksEntry → Enrollment, Subject, AssessmentType)
reporting      → results, enrollments, academics (reads computed data)
```

**Forbidden:** `identity` → `results`, `academics` → `results`, any circular deps.

### 4.3 Layer Responsibilities

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **API** (views/serializers) | HTTP request/response, serialization, validation. **Zero business logic.** | `api/views.py`, `api/serializers.py` |
| **Service** | Business rules, use cases, orchestration. Calls repositories and selectors. | `services/` |
| **Repository** | Persistence only. Django ORM queries, create/update/delete. | `repositories/` |
| **Selector** | Complex read queries, aggregation, filtering. Read-only. | `selectors/` |
| **Permissions** | DRF permission classes, authorization checks. | `permissions.py` |

---

## 5. Service Contracts

### 5.1 `identity` Module

```python
# services/auth_service.py
class AuthService:
    def login(self, email: str, password: str) -> TokenPair
    def logout(self, refresh_token: str) -> None
    def get_current_user(self, user_id: UUID) -> UserDTO
    def refresh_token(self, refresh_token: str) -> TokenPair

# repositories/user_repository.py
class UserRepository:
    def get_by_id(self, user_id: UUID) -> User | None
    def get_by_email(self, email: str) -> User | None
    def create(self, data: UserCreateDTO) -> User
    def update(self, user_id: UUID, data: UserUpdateDTO) -> User
    def list_by_role(self, role: str) -> QuerySet[User]
```

### 5.2 `academics` Module

```python
# services/session_service.py
class SessionService:
    def create_session(self, data: SessionCreateDTO) -> AcademicSession
    def activate_session(self, session_id: UUID) -> AcademicSession
    def lock_session(self, session_id: UUID) -> AcademicSession
    def get_active_session(self) -> AcademicSession | None

# services/subject_service.py
class SubjectService:
    def create_subject(self, data: SubjectCreateDTO) -> Subject
    def assign_to_class(self, class_id: UUID, subject_id: UUID, 
                        full_marks: int, is_required: bool) -> ClassSubject
    def get_class_subjects(self, class_id: UUID) -> list[ClassSubject]

# services/assessment_service.py
class AssessmentService:
    def create_assessment_type(self, data: AssessmentTypeCreateDTO) -> AssessmentType
    def set_weightage(self, class_id: UUID, subject_id: UUID,
                      assessment_type_id: UUID, full_marks: int,
                      weightage_pct: float) -> AssessmentWeightage
    def get_assessment_structure(self, class_id: UUID, 
                                 subject_id: UUID) -> list[AssessmentWeightage]

# services/grading_service.py
class GradingService:
    def calculate_grade(self, percentage: float) -> GradeDTO
    def get_all_grade_policies(self) -> list[GradePolicy]
    def upsert_grade_policy(self, data: GradePolicyDTO) -> GradePolicy

# services/assignment_service.py
class AssignmentService:
    def assign_teacher(self, data: TeacherAssignmentCreateDTO) -> TeacherAssignment
    def get_teacher_assignments(self, teacher_id: UUID, 
                                session_id: UUID) -> list[TeacherAssignment]
    def is_teacher_assigned(self, teacher_id: UUID, class_id: UUID,
                           section_id: UUID, subject_id: UUID,
                           session_id: UUID) -> bool
```

### 5.3 `enrollments` Module

```python
# services/student_service.py
class StudentService:
    def create_student(self, data: StudentCreateDTO) -> Student
    def get_student(self, student_id: UUID) -> StudentDTO
    def update_student(self, student_id: UUID, data: StudentUpdateDTO) -> Student
    def generate_student_id(self) -> str
    def set_default_password(self, student: Student) -> None

# services/enrollment_service.py
class EnrollmentService:
    def enroll_student(self, data: EnrollmentCreateDTO) -> Enrollment
    def promote_student(self, enrollment_id: UUID, 
                        new_class_id: UUID, new_section_id: UUID,
                        new_session_id: UUID, new_roll_no: str) -> Enrollment
    def retain_student(self, enrollment_id: UUID,
                       new_session_id: UUID, new_roll_no: str) -> Enrollment
    def transfer_out(self, enrollment_id: UUID, remarks: str) -> Enrollment
    def bulk_enroll(self, session_id: UUID, enrollments: list[EnrollmentCreateDTO]) -> list[Enrollment]
```

### 5.4 `results` Module

```python
# services/marks_entry_service.py
class MarksEntryService:
    def enter_marks(self, data: MarksEntryCreateDTO, 
                    entered_by: UUID) -> MarksEntry
    def update_marks(self, entry_id: UUID, data: MarksEntryUpdateDTO) -> MarksEntry
    def bulk_upsert(self, entries: list[MarksEntryBulkDTO],
                    entered_by: UUID) -> list[MarksEntry]
    def authorize_entry(self, user: User, enrollment: Enrollment,
                        subject: Subject) -> tuple[bool, str | None]

# services/result_service.py
class ResultService:
    def compute_subject_result(self, enrollment_id: UUID,
                               subject_id: UUID) -> SubjectResult
    def compute_all_results(self, enrollment_id: UUID) -> list[SubjectResult]
    def refresh_all_results(self, session_id: UUID) -> int  # returns count
```

### 5.5 `reporting` Module

```python
# services/report_card_service.py
class ReportCardService:
    def generate_student_report_card(self, enrollment_id: UUID) -> ReportCardDTO
    def generate_class_report_cards(self, class_id: UUID, section_id: UUID,
                                     session_id: UUID) -> list[ReportCardDTO]

# services/marksheet_service.py
class MarksheetService:
    def generate_class_marksheet(self, class_id: UUID, section_id: UUID,
                                  session_id: UUID) -> MarksheetDTO
    def generate_student_marksheet(self, enrollment_id: UUID) -> MarksheetDTO
```

---

## 6. Repository Interfaces

```python
# Generic pattern for all repositories
class BaseRepository(Generic[T]):
    model: type[T]
    
    def get_by_id(self, id: UUID) -> T | None: ...
    def create(self, **kwargs) -> T: ...
    def update(self, id: UUID, **kwargs) -> T: ...
    def delete(self, id: UUID) -> bool: ...
    def exists(self, **filters) -> bool: ...

# Specific repositories
class UserRepository(BaseRepository[User]):
    def get_by_email(self, email: str) -> User | None: ...
    def list_by_role(self, role: str) -> QuerySet[User]: ...

class StudentRepository(BaseRepository[Student]):
    def get_by_student_id(self, student_id: str) -> Student | None: ...
    def generate_next_student_id(self) -> str: ...

class EnrollmentRepository(BaseRepository[Enrollment]):
    def get_active_enrollment(self, student_id: UUID, 
                               session_id: UUID) -> Enrollment | None: ...
    def get_class_enrollments(self, class_id: UUID, section_id: UUID,
                               session_id: UUID) -> QuerySet[Enrollment]: ...

class MarksEntryRepository(BaseRepository[MarksEntry]):
    def get_entries_for_enrollment(self, enrollment_id: UUID) -> QuerySet[MarksEntry]: ...
    def bulk_create(self, entries: list[dict]) -> list[MarksEntry]: ...
    def upsert(self, enrollment_id: UUID, subject_id: UUID,
               assessment_type_id: UUID, **data) -> MarksEntry: ...

class SubjectResultRepository(BaseRepository[SubjectResult]):
    def get_results_for_enrollment(self, enrollment_id: UUID) -> QuerySet[SubjectResult]: ...
    def refresh_from_marks(self, enrollment_id: UUID) -> list[SubjectResult]: ...
```

---

## 7. API Design

### 7.1 URL Structure

```
/api/v1/
├── auth/
│   ├── POST   /login/
│   ├── POST   /logout/
│   ├── POST   /refresh/
│   └── GET    /me/
│
├── identity/
│   ├── GET,POST       /users/
│   ├── GET,PUT,DELETE  /users/{id}/
│   └── GET            /users/by-role/?role=teacher
│
├── academics/
│   ├── --- Sessions ---
│   │   ├── GET,POST       /sessions/
│   │   ├── GET,PUT        /sessions/{id}/
│   │   ├── POST           /sessions/{id}/activate/
│   │   └── POST           /sessions/{id}/lock/
│   │
│   ├── --- Classes ---
│   │   ├── GET,POST       /classes/
│   │   ├── GET,PUT        /classes/{id}/
│   │   ├── GET            /classes/{id}/sections/
│   │   └── GET            /classes/{id}/subjects/
│   │
│   ├── --- Sections ---
│   │   ├── GET,POST       /sections/
│   │   └── GET,PUT        /sections/{id}/
│   │
│   ├── --- Subjects ---
│   │   ├── GET,POST       /subjects/
│   │   ├── GET,PUT        /subjects/{id}/
│   │   ├── POST           /subjects/{id}/assign-to-class/
│   │   └── GET            /subjects/by-type/?type=core
│   │
│   ├── --- Assessment Types ---
│   │   ├── GET,POST       /assessment-types/
│   │   ├── GET,PUT        /assessment-types/{id}/
│   │   └── GET            /assessment-types/structure/{class_id}/{subject_id}/
│   │
│   ├── --- Grade Policy ---
│   │   ├── GET,POST       /grade-policy/
│   │   └── PUT            /grade-policy/{id}/
│   │
│   └── --- Teacher Assignments ---
│       ├── GET,POST       /teacher-assignments/
│       ├── GET,PUT,DELETE  /teacher-assignments/{id}/
│       └── GET            /teacher-assignments/my/?session_id=X
│
├── enrollments/
│   ├── --- Students ---
│   │   ├── GET,POST       /students/
│   │   ├── GET,PUT        /students/{id}/
│   │   ├── GET            /students/{id}/enrollments/
│   │   └── POST           /students/bulk-create/
│   │
│   ├── --- Enrollments ---
│   │   ├── GET,POST       /enrollments/
│   │   ├── GET,PUT        /enrollments/{id}/
│   │   ├── POST           /enrollments/{id}/promote/
│   │   ├── POST           /enrollments/{id}/retain/
│   │   ├── POST           /enrollments/{id}/transfer/
│   │   └── POST           /enrollments/bulk-enroll/
│   │
│   └── --- Class Teachers ---
│       ├── GET,POST       /class-teachers/
│       └── GET,PUT,DELETE  /class-teachers/{id}/
│
├── results/
│   ├── --- Marks Entry ---
│   │   ├── GET,POST       /marks-entries/
│   │   ├── GET,PUT        /marks-entries/{id}/
│   │   ├── POST           /marks-entries/bulk-upsert/
│   │   ├── GET            /marks-entries/by-class/{class_id}/{subject_id}/
│   │   └── GET            /marks-entries/check-authorization/
│   │
│   └── --- Subject Results ---
│       ├── GET            /subject-results/?enrollment_id=X
│       ├── GET            /subject-results/by-class/{class_id}/{session_id}/
│       └── POST           /subject-results/refresh/
│
└── reporting/
    ├── GET    /report-cards/student/{enrollment_id}/
    ├── GET    /report-cards/class/{class_id}/{section_id}/{session_id}/
    ├── GET    /marksheets/class/{class_id}/{section_id}/{session_id}/
    └── GET    /marksheets/student/{enrollment_id}/
```

### 7.2 Serializers Pattern

```python
# API layer: serializers handle ONLY input validation + output formatting
class MarksEntrySerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField()
    subject_id = serializers.UUIDField()
    assessment_type_id = serializers.UUIDField()
    full_marks = serializers.IntegerField(min_value=0)
    obtained_marks = serializers.IntegerField(min_value=0)
    
    def validate(self, data):
        # Delegates to service for business validation
        service = MarksEntryService()
        is_valid, error = service.validate_marks_entry(data)
        if not is_valid:
            raise serializers.ValidationError(error)
        return data

# Views: thin, delegate to service
class MarksEntryViewSet(viewsets.ModelViewSet):
    def create(self, request):
        serializer = MarksEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = MarksEntryService()
        entry = service.enter_marks(serializer.validated_data, request.user.id)
        return Response(MarksEntryReadSerializer(entry).data, status=201)
```

---

## 8. Permission Matrix

### 8.1 Roles

| Role | Description |
|------|-------------|
| `admin` | Full system access. Can manage all data, override any operation. |
| `teacher` | Can enter marks for assigned subjects. Can generate marksheets as class teacher. |

### 8.2 Permission Matrix

| Action | Admin | Teacher |
|--------|-------|---------|
| **Identity** | | |
| View all users | ✅ | ❌ |
| Create/edit users | ✅ | ❌ |
| **Academics** | | |
| Manage sessions | ✅ | ❌ |
| Lock sessions | ✅ | ❌ |
| Manage classes/sections | ✅ | ❌ |
| Manage subjects | ✅ | ❌ |
| Manage assessment types | ✅ | ❌ |
| Manage grade policy | ✅ | ❌ |
| Assign teachers | ✅ | ❌ |
| View teacher assignments | ✅ | ✅ (own) |
| **Enrollments** | | |
| View students | ✅ | ✅ (assigned classes) |
| Create/edit students | ✅ | ❌ |
| Enroll/promote/retain/transfer | ✅ | ❌ |
| View enrollments | ✅ | ✅ (assigned classes) |
| Manage class teachers | ✅ | ❌ |
| **Results** | | |
| Enter marks | ✅ (any subject) | ✅ (assigned subjects only) |
| Bulk upsert marks | ✅ (any subject) | ✅ (assigned subjects only) |
| View marks entries | ✅ | ✅ (assigned classes) |
| View subject results | ✅ | ✅ (assigned classes) |
| Refresh/compute results | ✅ | ❌ |
| **Reporting** | | |
| Generate student report card | ✅ | ✅ (class teacher) |
| Generate class report cards | ✅ | ✅ (class teacher) |
| Generate class marksheet | ✅ | ✅ (class teacher) |

### 8.3 Backend Enforcement Rules

```python
# Rule 1: Only assigned teacher can enter marks
def can_enter_marks(user: User, enrollment: Enrollment, 
                    subject: Subject, session: AcademicSession) -> tuple[bool, str]:
    if user.role == 'admin':
        return True, None
    teacher = user.teacher_profile
    return AssignmentService().is_teacher_assigned(
        teacher.id, enrollment.class_id, enrollment.section_id,
        subject.id, session.id
    ), "Not authorized to enter marks for this subject."

# Rule 2: Only class teacher can generate marksheets
def can_generate_marksheet(user: User, class_id: UUID, 
                           section_id: UUID, session_id: UUID) -> tuple[bool, str]:
    if user.role == 'admin':
        return True, None
    teacher = user.teacher_profile
    is_class_teacher = ClassTeacher.objects.filter(
        teacher_id=teacher.id, class_id=class_id,
        section_id=section_id, session_id=session_id, is_active=True
    ).exists()
    return is_class_teacher, "Only class teacher can generate marksheets."

# Rule 3: Session must not be locked for writes
def session_not_locked(session_id: UUID) -> tuple[bool, str]:
    session = AcademicSession.objects.get(id=session_id)
    if session.is_locked:
        return False, "Session is locked."
    return True, None
```

---

## 9. Database Migration Strategy

### 9.1 Migration Phases

**Phase 1: Schema Preparation (non-destructive)**
```bash
# Create new tables alongside old ones
python manage.py makemigrations identity academics enrollments results reporting
python manage.py migrate
```

**Phase 2: Data Migration**
```python
# migration 0002_migrate_data.py
class Migration(migrations.Migration):
    def forwards(apps, schema_editor):
        # 1. Migrate Users (remove school FK, keep admin/teacher roles)
        # 2. Migrate Admin/Teacher profiles
        # 3. Migrate Sessions → AcademicSession
        # 4. Migrate Classes, Sections
        # 5. Merge Subject + OptionalSubject + CocurricularSubject → Subject
        # 6. Migrate ClassSubjectAssignment → ClassSubject
        # 7. Migrate Students (remove legacy FKs)
        # 8. Migrate StudentEnrollment → Enrollment
        # 9. Migrate TeacherAssignment (merge 3 models)
        # 10. Create GradePolicy defaults
        # 11. Migrate MarksEntry from StudentResult
        # 12. Compute SubjectResult from old StudentResult
```

**Phase 3: Validation**
```python
# Verify data integrity
# Compare old vs new record counts
# Validate all FK relationships are intact
# Run full test suite
```

**Phase 4: Cutover**
```bash
# Update AUTH_USER_MODEL if changed
# Remove old models from apps
# Remove payments_management app entirely
# Update URL routing
# Deploy
```

### 9.2 Subject Merge Migration

```python
def merge_subjects(apps, schema_editor):
    """Merge 3 subject tables into unified Subject."""
    Subject = apps.get_model('academics', 'Subject')
    OldSubject = apps.get_model('core_services', 'Subject')
    OldOptional = apps.get_model('core_services', 'OptionalSubject')
    OldCocurricular = apps.get_model('core_services', 'CocurricularSubject')
    
    # Core subjects
    for s in OldSubject.objects.all():
        Subject.objects.create(
            id=s.id, name=s.name, code=s.code,
            subject_type='core', default_full_marks=s.full_marks
        )
    
    # Optional subjects
    for s in OldOptional.objects.all():
        Subject.objects.create(
            id=s.id, name=s.name, code=f"OPT_{s.code}",
            subject_type='optional', default_full_marks=s.default_full_marks
        )
    
    # Cocurricular subjects
    for s in OldCocurricular.objects.all():
        Subject.objects.create(
            id=s.id, name=s.name, code=f"CC_{s.code}",
            subject_type='cocurricular', default_full_marks=100
        )
```

### 9.3 MarksEntry Migration

```python
def migrate_student_results(apps, schema_editor):
    """Convert hardcoded StudentResult → dynamic MarksEntry."""
    OldResult = apps.get_model('result_management', 'StudentResult')
    MarksEntry = apps.get_model('results', 'MarksEntry')
    AssessmentType = apps.get_model('academics', 'AssessmentType')
    
    # Create default assessment types
    ut1, _ = AssessmentType.objects.get_or_create(code='UT1', defaults={
        'name': 'Unit Test 1', 'category': 'summative', 'display_order': 1
    })
    # ... create UT2, UT3, MID, FINAL, etc.
    
    for old in OldResult.objects.all():
        # Map old hardcoded terms → dynamic assessment entries
        # first_summative → UT1 or MID depending on class config
        # ... create MarksEntry for each term's marks
```

---

## 10. Testing Strategy

### 10.1 Test Pyramid

```
┌──────────────────────┐
│   Integration Tests   │  10% — API endpoint tests (DRF APITestCase)
│   (API layer)        │  Tests full request cycle: auth → view → service → DB
├──────────────────────┤
│    Service Tests      │  40% — Business logic tests
│    (core business)    │  Tests service methods with mocked repos
├──────────────────────┤
│  Repository Tests     │  30% — Persistence tests
│  (ORM/DB)            │  Tests actual DB queries (TransactionTestCase)
├──────────────────────┤
│   Selector Tests      │  10% — Complex query tests
│   (read queries)      │  Tests aggregation, filtering, ordering
├──────────────────────┤
│  Unit Tests           │  10% — Utility, serialization, validation
│  (pure functions)     │
└──────────────────────┘
```

### 10.2 Test Categories

| Category | Framework | Count Target |
|----------|-----------|-------------|
| Service tests | `pytest` + `pytest-django` | 150+ tests |
| Repository tests | `pytest-django` (TransactionTestCase) | 80+ tests |
| Selector tests | `pytest-django` | 40+ tests |
| API integration tests | DRF `APITestCase` | 60+ tests |
| Permission tests | DRF `APITestCase` | 40+ tests |
| **Total** | | **370+ tests** |

### 10.3 Key Test Scenarios

```python
# Service tests
class TestMarksEntryService:
    def test_enter_marks_success():
    def test_enter_marks_unauthorized_teacher():
    def test_enter_marks_locked_session():
    def test_bulk_upsert_creates_new_entries():
    def test_bulk_upsert_updates_existing_entries():
    def test_obtained_marks_exceeds_full_marks_raises_error():

class TestEnrollmentService:
    def test_promote_student_creates_new_enrollment():
    def test_promote_student_old_enrollment_marked_promoted():
    def test_retain_student_stays_in_same_class():
    def test_transfer_out_deactivates_student():
    def test_enroll_duplicate_session_raises_error():

class TestGradingService:
    def test_calculate_grade_90_plus_returns_AA():
    def test_calculate_grade_boundary_conditions():
    def test_grade_policy_update_reflects_immediately():

# Permission tests
class TestMarksEntryPermissions:
    def test_admin_can_enter_any_subject():
    def test_teacher_can_enter_assigned_subject():
    def test_teacher_cannot_enter_unassigned_subject():
    def test_locked_session_blocks_writes():

class TestMarksheetPermissions:
    def test_admin_can_generate_any_class():
    def test_class_teacher_can_generate_own_class():
    def test_non_class_teacher_cannot_generate():
```

### 10.4 Test Configuration

```python
# pyproject.toml
[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "config.settings.development"
python_files = ["tests.py", "test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "--tb=short --strict-markers -v"
markers = [
    "unit: Unit tests",
    "integration: Integration tests",
    "e2e: End-to-end tests",
    "slow: Slow tests",
]
```

---

## 11. Deployment Architecture

### 11.1 Production Stack

```
┌─────────────────────────────────────────┐
│              Cloudflare                 │
│           (CDN + SSL + WAF)             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│            Nginx                        │
│     (Reverse Proxy + Static Files)      │
│     - /static/ → WhiteNoise            │
│     - /media/  → R2 or local           │
│     - /api/    → Gunicorn              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           Gunicorn                      │
│     (4 workers, uvicorn worker)         │
│     - Django 6.0 + DRF                  │
│     - JWT auth                          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         PostgreSQL (Neon/Railway)       │
│     - Connection pooling (PgBouncer)    │
│     - SSL required                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          Redis (Upstash/similar)        │
│     - Cache (replaces LocMemCache)      │
│     - Session store (optional)          │
│     - Rate limiting                     │
└─────────────────────────────────────────┘
```

### 11.2 Settings Structure

```
config/settings/
├── base.py          # Shared settings (INSTALLED_APPS, MIDDLEWARE, etc.)
├── development.py   # DEBUG=True, LocMemCache, CORS_ALLOW_ALL
├── production.py    # DEBUG=False, Redis cache, strict CORS, security headers
└── testing.py       # SQLite in-memory, no caching, test-specific overrides
```

### 11.3 Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
SECRET_KEY=...
DJANGO_SETTINGS_MODULE=config.settings.production

# Optional (with defaults)
REDIS_URL=redis://127.0.0.1:6379/1
USE_R2_STORAGE=false
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ENDPOINT_URL=...
```

### 11.4 Docker Compose (Development)

```yaml
version: "3.9"
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: rms_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/rms_dev
      REDIS_URL: redis://redis:6379/1
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
```

---

## 12. Rollback Strategy

### 12.1 Pre-Migration Checklist

```bash
# 1. Full database backup
pg_dump -h host -U user -d rms_production -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# 2. Verify backup restores cleanly
pg_restore -h localhost -U user -d rms_test backup_*.dump

# 3. Run migrations on staging first
python manage.py migrate --settings=config.settings.staging

# 4. Run full test suite
pytest --tb=short

# 5. Verify API responses match expected
python manage.py test_api_responses --baseline=pre_migration
```

### 12.2 Migration Rollback Plan

```python
# Each migration must have a reversible operations list
class Migration(migrations.Migration):
    operations = [
        migrations.CreateModel(name='Subject', ...),
        # ... forward operations
    ]
    
    # Reverse operations auto-generated by Django
    # For complex data migrations, implement reverse() explicitly
```

### 12.3 Deployment Rollback

| Step | Action | Time |
|------|--------|------|
| 1 | Detect issue (monitoring/alerts) | 0-2 min |
| 2 | Decision: rollback vs hotfix | 2-5 min |
| 3a | **Hotfix:** Deploy patch, run `migrate` | 5-15 min |
| 3b | **Rollback:** Revert to previous Docker image | 1-3 min |
| 4 | Run `migrate` (if DB changes made) | 1-5 min |
| 5 | Verify system health | 1-2 min |
| **Total (rollback)** | | **3-10 min** |

### 12.4 Zero-Downtime Deployment

```
1. Run new migrations (backward-compatible):
   - Add new columns as nullable
   - Add new tables
   - Do NOT drop columns/tables yet

2. Deploy new code (supports both old and new schema)

3. Run data migration

4. Deploy final code (only uses new schema)

5. Drop old columns/tables (optional, in separate deploy)
```

---

## 13. File-by-File Implementation Order

### Phase 1: Foundation (Week 1-2)

| Order | File | Purpose |
|-------|------|---------|
| 1 | `config/settings/base.py` | Project settings foundation |
| 2 | `identity/models.py` | User, AdminProfile, TeacherProfile |
| 3 | `identity/services/auth_service.py` | Login/logout |
| 4 | `identity/repositories/user_repository.py` | User CRUD |
| 5 | `identity/api/views.py` | Auth endpoints |
| 6 | `identity/api/urls.py` | Auth routing |
| 7 | `identity/permissions.py` | RBAC classes |

### Phase 2: Academics (Week 2-3)

| Order | File | Purpose |
|-------|------|---------|
| 8 | `academics/models.py` | Session, Class, Section, Subject, etc. |
| 9 | `academics/services/session_service.py` | Session lifecycle |
| 10 | `academics/services/subject_service.py` | Subject CRUD |
| 11 | `academics/services/assessment_service.py` | Assessment types |
| 12 | `academics/services/grading_service.py` | Grade calculation |
| 13 | `academics/services/assignment_service.py` | Teacher assignments |

### Phase 3: Enrollments (Week 3-4)

| Order | File | Purpose |
|-------|------|---------|
| 14 | `enrollments/models.py` | Student, Enrollment, ClassTeacher |
| 15 | `enrollments/services/student_service.py` | Student CRUD |
| 16 | `enrollments/services/enrollment_service.py` | Promote/retain/transfer |
| 17 | `enrollments/services/classteacher_service.py` | Class teacher mgmt |

### Phase 4: Results (Week 4-5)

| Order | File | Purpose |
|-------|------|---------|
| 18 | `results/models.py` | MarksEntry, SubjectResult |
| 19 | `results/services/marks_entry_service.py` | Enter/update marks |
| 20 | `results/services/result_service.py` | Compute results |

### Phase 5: Reporting (Week 5-6)

| Order | File | Purpose |
|-------|------|---------|
| 21 | `reporting/services/report_card_service.py` | Report card generation |
| 22 | `reporting/services/marksheet_service.py` | Marksheet generation |

### Phase 6: Migration & Cleanup (Week 6-7)

| Order | Task | Purpose |
|-------|------|---------|
| 23 | Data migration scripts | Move old data to new schema |
| 24 | Remove `payments_management` app | Delete finance domain |
| 25 | Remove old `core_services` models | Clean up legacy code |
| 26 | Update URL routing | Point to new modules |
| 27 | Full test run | Verify everything works |

### Phase 7: Production Readiness (Week 7-8)

| Order | Task | Purpose |
|-------|------|---------|
| 28 | Docker setup | Containerization |
| 29 | Logging configuration | Structured logging |
| 30 | OpenAPI docs setup | `drf-spectacular` |
| 31 | Performance tuning | Indexes, caching, query optimization |
| 32 | Security audit | CORS, CSRF, rate limiting |

---

This plan provides a complete blueprint for transforming the current ERP into a production-grade RMS. The key architectural wins are:

1. **Dynamic assessment system** — never redesign schema for new grading patterns
2. **Clean module boundaries** — each domain owns its data and logic
3. **Service-repository separation** — business logic is testable and maintainable
4. **Configurable grading** — admin-editable, no code changes needed
5. **Pure enrollment model** — clean historical data with no legacy cruft
6. **Full test coverage target** — 370+ tests across all layers

Shall I proceed with implementation of any specific phase?