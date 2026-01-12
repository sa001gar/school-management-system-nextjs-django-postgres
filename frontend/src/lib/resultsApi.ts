/**
 * Results API Service
 * API functions for result management: Student Results, Cocurricular Results, Optional Results, Marksheets
 */
import api from './api';
import type {
  StudentResult,
  StudentCocurricularResult,
  StudentOptionalResult,
  StudentMarksheet,
  StudentWithResult,
  PaginatedResponse,
} from './types';

// Student Results API
export const studentResultsApi = {
  getAll: async (params?: {
    student_id?: string;
    subject_id?: string;
    session_id?: string;
    page?: number;
  }): Promise<PaginatedResponse<StudentResult>> => {
    return api.get<PaginatedResponse<StudentResult>>('/results/student-results/', params);
  },

  getById: async (id: string): Promise<StudentResult> => {
    return api.get<StudentResult>(`/results/student-results/${id}/`);
  },

  create: async (data: {
    student_id: string;
    subject_id: string;
    session_id: string;
    first_summative_full?: number;
    first_summative_obtained?: number;
    first_formative_full?: number;
    first_formative_obtained?: number;
    second_summative_full?: number;
    second_summative_obtained?: number;
    second_formative_full?: number;
    second_formative_obtained?: number;
    third_summative_full?: number;
    third_summative_obtained?: number;
    third_formative_full?: number;
    third_formative_obtained?: number;
    conduct?: string;
    attendance_days?: number;
  }): Promise<StudentResult> => {
    return api.post<StudentResult>('/results/student-results/', data);
  },

  update: async (id: string, data: Partial<StudentResult>): Promise<StudentResult> => {
    return api.patch<StudentResult>(`/results/student-results/${id}/`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/results/student-results/${id}/`);
  },

  /**
   * Create or update a result (upsert)
   */
  upsert: async (data: {
    student_id: string;
    subject_id: string;
    session_id: string;
    first_summative_full?: number;
    first_summative_obtained?: number;
    first_formative_full?: number;
    first_formative_obtained?: number;
    second_summative_full?: number;
    second_summative_obtained?: number;
    second_formative_full?: number;
    second_formative_obtained?: number;
    third_summative_full?: number;
    third_summative_obtained?: number;
    third_formative_full?: number;
    third_formative_obtained?: number;
    conduct?: string;
    attendance_days?: number;
  }): Promise<StudentResult> => {
    return api.post<StudentResult>('/results/student-results/upsert/', data);
  },

  /**
   * Bulk create or update results
   */
  bulkUpsert: async (results: Array<{
    student_id: string;
    subject_id: string;
    session_id: string;
    first_summative_full?: number;
    first_summative_obtained?: number;
    first_formative_full?: number;
    first_formative_obtained?: number;
    second_summative_full?: number;
    second_summative_obtained?: number;
    second_formative_full?: number;
    second_formative_obtained?: number;
    third_summative_full?: number;
    third_summative_obtained?: number;
    third_formative_full?: number;
    third_formative_obtained?: number;
    conduct?: string;
    attendance_days?: number;
  }>): Promise<StudentResult[]> => {
    return api.post<StudentResult[]>('/results/student-results/bulk-upsert/', { results });
  },

  /**
   * Get results by class/section with student info
   */
  getByClassSection: async (params: {
    session_id: string;
    class_id: string;
    section_id: string;
    subject_id: string;
  }): Promise<StudentWithResult[]> => {
    return api.get<StudentWithResult[]>('/results/student-results/by-class-section/', params);
  },
};

// Cocurricular Results API
export const cocurricularResultsApi = {
  getAll: async (params?: {
    student_id?: string;
    session_id?: string;
    page?: number;
  }): Promise<PaginatedResponse<StudentCocurricularResult>> => {
    return api.get<PaginatedResponse<StudentCocurricularResult>>('/results/cocurricular-results/', params);
  },

  getAllUnpaginated: async (params?: {
    student_id?: string;
    session_id?: string;
  }): Promise<StudentCocurricularResult[]> => {
    const response = await api.get<{ results?: StudentCocurricularResult[] } | StudentCocurricularResult[]>(
      '/results/cocurricular-results/',
      params
    );
    return Array.isArray(response) ? response : (response.results || []);
  },

  getById: async (id: string): Promise<StudentCocurricularResult> => {
    return api.get<StudentCocurricularResult>(`/results/cocurricular-results/${id}/`);
  },

  create: async (data: {
    student_id: string;
    cocurricular_subject_id: string;
    session_id: string;
    first_term_marks?: number;
    second_term_marks?: number;
    final_term_marks?: number;
    full_marks?: number;
    first_term_grade?: string;
    second_term_grade?: string;
    final_term_grade?: string;
    overall_grade?: string;
  }): Promise<StudentCocurricularResult> => {
    return api.post<StudentCocurricularResult>('/results/cocurricular-results/', data);
  },

  update: async (id: string, data: Partial<StudentCocurricularResult>): Promise<StudentCocurricularResult> => {
    return api.patch<StudentCocurricularResult>(`/results/cocurricular-results/${id}/`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/results/cocurricular-results/${id}/`);
  },

  /**
   * Create or update a cocurricular result (upsert)
   */
  upsert: async (data: {
    student_id: string;
    cocurricular_subject_id: string;
    session_id: string;
    first_term_marks?: number;
    second_term_marks?: number;
    final_term_marks?: number;
    full_marks?: number;
    first_term_grade?: string;
    second_term_grade?: string;
    final_term_grade?: string;
    overall_grade?: string;
  }): Promise<StudentCocurricularResult> => {
    return api.post<StudentCocurricularResult>('/results/cocurricular-results/upsert/', data);
  },

  /**
   * Bulk create or update cocurricular results
   */
  bulkUpsert: async (results: Array<{
    student_id: string;
    cocurricular_subject_id: string;
    session_id: string;
    first_term_marks?: number;
    second_term_marks?: number;
    final_term_marks?: number;
    full_marks?: number;
    first_term_grade?: string;
    second_term_grade?: string;
    final_term_grade?: string;
    overall_grade?: string;
  }>): Promise<StudentCocurricularResult[]> => {
    return api.post<StudentCocurricularResult[]>('/results/cocurricular-results/bulk-upsert/', { results });
  },
};

// Optional Results API
export const optionalResultsApi = {
  getAll: async (params?: {
    student_id?: string;
    session_id?: string;
    page?: number;
  }): Promise<PaginatedResponse<StudentOptionalResult>> => {
    return api.get<PaginatedResponse<StudentOptionalResult>>('/results/optional-results/', params);
  },

  getAllUnpaginated: async (params?: {
    student_id?: string;
    session_id?: string;
  }): Promise<StudentOptionalResult[]> => {
    const response = await api.get<{ results?: StudentOptionalResult[] } | StudentOptionalResult[]>(
      '/results/optional-results/',
      params
    );
    return Array.isArray(response) ? response : (response.results || []);
  },

  getById: async (id: string): Promise<StudentOptionalResult> => {
    return api.get<StudentOptionalResult>(`/results/optional-results/${id}/`);
  },

  create: async (data: {
    student_id: string;
    optional_subject_id: string;
    session_id: string;
    obtained_marks?: number;
    full_marks?: number;
  }): Promise<StudentOptionalResult> => {
    return api.post<StudentOptionalResult>('/results/optional-results/', data);
  },

  update: async (id: string, data: Partial<StudentOptionalResult>): Promise<StudentOptionalResult> => {
    return api.patch<StudentOptionalResult>(`/results/optional-results/${id}/`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/results/optional-results/${id}/`);
  },

  /**
   * Create or update an optional result (upsert)
   */
  upsert: async (data: {
    student_id: string;
    optional_subject_id: string;
    session_id: string;
    obtained_marks?: number;
    full_marks?: number;
  }): Promise<StudentOptionalResult> => {
    return api.post<StudentOptionalResult>('/results/optional-results/upsert/', data);
  },

  /**
   * Bulk create or update optional results
   */
  bulkUpsert: async (results: Array<{
    student_id: string;
    optional_subject_id: string;
    session_id: string;
    obtained_marks?: number;
    full_marks?: number;
    grade?: string;
  }>): Promise<StudentOptionalResult[]> => {
    return api.post<StudentOptionalResult[]>('/results/optional-results/bulk-upsert/', { results });
  },
};

// Marksheet API
export const marksheetApi = {
  /**
   * Get complete marksheet for a student
   */
  getStudentMarksheet: async (studentId: string, sessionId?: string): Promise<StudentMarksheet> => {
    return api.get<StudentMarksheet>(`/results/marksheet/student/${studentId}/`, { session_id: sessionId });
  },

  /**
   * Get marksheet data for all students in a class/section
   */
  getClassMarksheet: async (params: {
    session_id: string;
    class_id: string;
    section_id: string;
  }): Promise<Array<{
    id: string;
    roll_no: string;
    name: string;
    total_marks: number;
    total_full_marks: number;
    percentage: number;
    position: number;
    results: StudentResult[];
    optional_results: StudentOptionalResult[];
  }>> => {
    return api.get('/results/marksheet/class-section/', params);
  },
};

// Re-export all APIs
export {
  studentResultsApi as studentResults,
  cocurricularResultsApi as cocurricularResults,
  optionalResultsApi as optionalResults,
  marksheetApi as marksheet,
};
