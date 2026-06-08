# Plan: Teacher Students Page

## File to Create
`frontend/src/app/(dashboard)/teacher/students/page.tsx`

## Architecture

### Data Flow
1. **Session selector** defaults to active session via `useActiveSession()`
2. **Class filter** populated via `useClasses()`
3. **Section filter** populated via `useSections(classId)` (reset when class changes)
4. **Enrollment list** fetched via inline `api.get('/enrollments/enrollments/', { session_id, class_id, section_id })` with `useQuery`
5. **Student detail modal** on row click:
   - Fetches student record: `api.get('/students/{student_id}/')`
   - Fetches academic results: `api.get('/results/subject-results/by-enrollment/{enrollment_id}/')`

### Component Structure
- `useEffect` sets active session as default on mount
- State: `sessionId`, `classId`, `sectionId`, `selectedEnrollment`, `selectedStudent`, `studentResults`, `isDetailLoading`, `modalOpen`
- `useQuery` for enrollments list keyed by filter params
- `useQuery` for classes/sections via existing hooks
- Modal uses existing `Modal` component with `size="lg"`

### API Endpoints (inline via `api` client)
```
GET /enrollments/enrollments/?session_id=X&class_field_id=Y&section_id=Z
GET /students/{student_id}/
GET /results/subject-results/by-enrollment/{enrollment_id}/
```

### Table Columns
| Column | Source |
|--------|--------|
| Roll No | `enrollment.roll_no` |
| Student Name | `enrollment.student_name` |
| Student ID | `enrollment.student_id` |
| Father Name | `student.father_name` (from detail fetch) |
| Phone | `student.phone` (from detail fetch) |
| Status | `enrollment.status` → Badge |

### Modal Content
**Profile Section**: name, student_id, DOB, father_name, mother_name, phone, address
**Enrollment Section**: class_name, section_name, roll_no, session_name
**Academic Section**: Table with subject_name, marks_obtained, full_marks, percentage, grade
**Summary**: total_marks, total_full_marks, overall_percentage, overall_grade

### Dependencies (existing)
- `use-sessions.ts`: `useSessions`, `useActiveSession`
- `use-classes.ts`: `useClasses`, `useSections`
- `ui/table.tsx`: Table, TableHeader, TableBody, TableRow, TableHead, TableCell
- `ui/select.tsx`: Select
- `ui/button.tsx`: Button
- `ui/badge.tsx`: Badge
- `ui/modal.tsx`: Modal
- `ui/empty-state.tsx`: EmptyState
- `ui/loading.tsx`: Loading
- `layout/page-header.tsx`: PageHeader
- `lib/api/client.ts`: api (default export)
- `types/index.ts`: Session, Class, Section, Enrollment, Student, PaginatedResponse

### Pattern References
- Enrollments page: `admin/enrollments/page.tsx` (session/class/section filter pattern)
- Admin students page: `admin/students/page.tsx` (table + modal pattern)
- Teacher dashboard: `teacher/page.tsx` (loading/error states)

## Implementation Notes
- Use `class_field_id` for the filter param (as specified in user's API endpoint)
- Father Name and Phone columns require fetching the student record — populate lazily on row click in the detail modal (not in the table, as it would require N+1 API calls)
- Wait — the user specified "Father Name" and "Phone" as table columns. This means we need to fetch student data. Two options:
  - Option A: Fetch all students for the selected filters via `/students/?session_id=X&class_field_id=Y&section_id=Z` and merge with enrollments
  - Option B: Show "-" for these columns and only populate in the modal
  - Decision: Use Option A — fetch students list alongside enrollments, merge by student_id. This avoids N+1 calls and matches the user's requirement for table columns.
- The enrollments endpoint returns student_id, student_name but NOT father_name/phone. The students endpoint does return father_name/phone. We'll fetch both and merge.
