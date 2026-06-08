export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
}

export interface StudentProfile {
  id: string;
  student_id: string;
  name: string;
  email?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  teacher: TeacherProfile | null;
  admin: AdminProfile | null;
  student: StudentProfile | null;
}

export interface StudentLoginResponse {
  access: string;
  refresh: string;
  student: StudentProfile;
  user: User;
}

export interface CurrentUserResponse {
  user: User;
  teacher: TeacherProfile | null;
  admin: AdminProfile | null;
  student: StudentProfile | null;
}
