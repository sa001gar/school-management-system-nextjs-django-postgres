export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

function addError(errors: ValidationError[], field: string, message: string): void {
  errors.push({ field, message });
}

export function validateRequired(value: unknown, field: string, label: string, errors: ValidationError[]): void {
  if (!value || (typeof value === 'string' && !value.trim())) {
    addError(errors, field, `${label} is required`);
  }
}

export function validateMinLength(value: string, min: number, field: string, label: string, errors: ValidationError[]): void {
  if (value && value.trim().length < min) {
    addError(errors, field, `${label} must be at least ${min} characters`);
  }
}

export function validateMaxLength(value: string, max: number, field: string, label: string, errors: ValidationError[]): void {
  if (value && value.length > max) {
    addError(errors, field, `${label} must be at most ${max} characters`);
  }
}

export function validatePositiveNumber(value: number | undefined | null, field: string, label: string, errors: ValidationError[]): void {
  if (value === undefined || value === null || value <= 0) {
    addError(errors, field, `${label} must be a positive number`);
  }
}

export function validatePercentage(value: number | undefined | null, field: string, label: string, errors: ValidationError[]): void {
  if (value === undefined || value === null) {
    addError(errors, field, `${label} is required`);
    return;
  }
  if (value < 0 || value > 100) {
    addError(errors, field, `${label} must be between 0 and 100`);
  }
}

export function validateDateRange(start: string, end: string, errors: ValidationError[]): void {
  if (start && end && new Date(start) >= new Date(end)) {
    addError(errors, 'end_date', 'End date must be after start date');
  }
}

export function validateEmail(value: string, field: string, errors: ValidationError[]): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (value && !emailRegex.test(value)) {
    addError(errors, field, 'Invalid email address');
  }
}

export function validateClassForm(data: { name: string; display_name?: string }): ValidationResult {
  const errors: ValidationError[] = [];
  validateRequired(data.name, 'name', 'Class name', errors);
  validateMinLength(data.name, 1, 'name', 'Class name', errors);
  validateMaxLength(data.name, 20, 'name', 'Class name', errors);
  return { valid: errors.length === 0, errors };
}

export function validateSectionForm(data: { name: string; class_id: string }): ValidationResult {
  const errors: ValidationError[] = [];
  validateRequired(data.name, 'name', 'Section name', errors);
  validateMinLength(data.name, 1, 'name', 'Section name', errors);
  validateMaxLength(data.name, 5, 'name', 'Section name', errors);
  validateRequired(data.class_id, 'class_id', 'Class', errors);
  return { valid: errors.length === 0, errors };
}

export function validateSubjectForm(data: { name: string; code?: string; subject_type: string; class_ids?: string[] }): ValidationResult {
  const errors: ValidationError[] = [];
  validateRequired(data.name, 'name', 'Subject name', errors);
  validateMinLength(data.name, 1, 'name', 'Subject name', errors);
  validateMaxLength(data.name, 100, 'name', 'Subject name', errors);
  if (data.code) {
    validateMinLength(data.code, 1, 'code', 'Subject code', errors);
    validateMaxLength(data.code, 10, 'code', 'Subject code', errors);
  }
  validateRequired(data.subject_type, 'subject_type', 'Subject type', errors);
  return { valid: errors.length === 0, errors };
}

export function validateAssessmentTypeForm(data: { name: string; code: string; weightage: number }): ValidationResult {
  const errors: ValidationError[] = [];
  validateRequired(data.name, 'name', 'Assessment name', errors);
  validateMinLength(data.name, 1, 'name', 'Assessment name', errors);
  validateMaxLength(data.name, 50, 'name', 'Assessment name', errors);
  validateRequired(data.code, 'code', 'Assessment code', errors);
  validateMinLength(data.code, 1, 'code', 'Assessment code', errors);
  validateRequired(data.weightage, 'weightage', 'Weightage', errors);
  if (data.weightage && (data.weightage < 0 || data.weightage > 100)) {
    addError(errors, 'weightage', 'Weightage must be between 0 and 100');
  }
  return { valid: errors.length === 0, errors };
}

export function validateGradePolicyForm(data: { min_percentage: number; max_percentage: number; grade: string; gpa?: number; description?: string }): ValidationResult {
  const errors: ValidationError[] = [];
  validateRequired(data.min_percentage, 'min_percentage', 'Minimum percentage', errors);
  validateRequired(data.max_percentage, 'max_percentage', 'Maximum percentage', errors);
  validateRequired(data.grade, 'grade', 'Grade', errors);
  validateMinLength(data.grade, 1, 'grade', 'Grade', errors);
  if (data.min_percentage !== undefined && data.max_percentage !== undefined) {
    if (data.min_percentage > data.max_percentage) {
      addError(errors, 'min_percentage', 'Minimum percentage must be less than maximum');
    }
    if (data.min_percentage < 0 || data.min_percentage > 100) {
      addError(errors, 'min_percentage', 'Minimum percentage must be between 0 and 100');
    }
    if (data.max_percentage < 0 || data.max_percentage > 100) {
      addError(errors, 'max_percentage', 'Maximum percentage must be between 0 and 100');
    }
  }
  if (data.gpa !== undefined && (data.gpa < 0 || data.gpa > 4)) {
    addError(errors, 'gpa', 'GPA must be between 0 and 4');
  }
  return { valid: errors.length === 0, errors };
}

export function validateEnrollmentForm(data: { student_id: string; class_id: string; section_id: string; session_id: string }): ValidationResult {
  const errors: ValidationError[] = [];
  validateRequired(data.student_id, 'student_id', 'Student', errors);
  validateRequired(data.class_id, 'class_id', 'Class', errors);
  validateRequired(data.section_id, 'section_id', 'Section', errors);
  validateRequired(data.session_id, 'session_id', 'Session', errors);
  return { valid: errors.length === 0, errors };
}

export function validateTeacherAssignmentForm(data: { teacher_id: string; class_id: string; section_id: string; subject_id: string }): ValidationResult {
  const errors: ValidationError[] = [];
  validateRequired(data.teacher_id, 'teacher_id', 'Teacher', errors);
  validateRequired(data.class_id, 'class_id', 'Class', errors);
  validateRequired(data.section_id, 'section_id', 'Section', errors);
  validateRequired(data.subject_id, 'subject_id', 'Subject', errors);
  return { valid: errors.length === 0, errors };
}

export function validateMarksEntry(marks: Record<string, number | undefined>, maxMarks: number): ValidationResult {
  const errors: ValidationError[] = [];
  for (const [key, value] of Object.entries(marks)) {
    if (value !== undefined) {
      if (value < 0) {
        addError(errors, key, 'Marks cannot be negative');
      }
      if (value > maxMarks) {
        addError(errors, key, `Marks cannot exceed ${maxMarks}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateSessionForm(data: { name: string; start_date: string; end_date: string; is_active?: boolean }): ValidationResult {
  const errors: ValidationError[] = [];
  validateRequired(data.name, 'name', 'Session name', errors);
  validateMinLength(data.name, 1, 'name', 'Session name', errors);
  validateRequired(data.start_date, 'start_date', 'Start date', errors);
  validateRequired(data.end_date, 'end_date', 'End date', errors);
  if (data.start_date && data.end_date) {
    validateDateRange(data.start_date, data.end_date, errors);
  }
  return { valid: errors.length === 0, errors };
}

export function validateUserForm(data: { email: string; first_name: string; last_name: string; role: string; password?: string }): ValidationResult {
  const errors: ValidationError[] = [];
  validateRequired(data.email, 'email', 'Email', errors);
  validateEmail(data.email, 'email', errors);
  validateRequired(data.first_name, 'first_name', 'First name', errors);
  validateRequired(data.last_name, 'last_name', 'Last name', errors);
  validateRequired(data.role, 'role', 'Role', errors);
  if (data.password !== undefined) {
    validateMinLength(data.password, 8, 'password', 'Password', errors);
  }
  return { valid: errors.length === 0, errors };
}
