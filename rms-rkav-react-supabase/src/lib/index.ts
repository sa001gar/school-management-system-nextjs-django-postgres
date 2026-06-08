/**
 * API Service Index
 * Re-exports all API services for easy importing
 */

// Core API utilities
export { default as api, ApiError, getAccessToken, setTokens, clearTokens } from './api';

// Auth API
export { authApi, teacherApi } from './authApi';

// Core Services API
export {
  sessionsApi,
  classesApi,
  sectionsApi,
  subjectsApi,
  cocurricularSubjectsApi,
  optionalSubjectsApi,
  classSubjectAssignmentsApi,
  classOptionalConfigApi,
  classOptionalAssignmentsApi,
  classCocurricularConfigApi,
  classMarksDistributionApi,
  schoolConfigApi,
  studentsApi,
} from './coreApi';

// Results API
export {
  studentResultsApi,
  cocurricularResultsApi,
  optionalResultsApi,
  marksheetApi,
} from './resultsApi';

// Payments API
export {
  feeStructuresApi,
  feeDiscountsApi,
  studentFeesApi,
  paymentsApi,
  paymentRemindersApi,
} from './paymentsApi';

// Types
export * from './types';
