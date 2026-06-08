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

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  teacher: TeacherProfile | null;
  admin: AdminProfile | null;
}

export interface StudentLoginResponse {
  access: string;
  refresh: string;
  student: {
    id: string;
    name: string;
    student_id: string;
  };
}

export interface CurrentUserResponse {
  user: User;
  teacher: TeacherProfile | null;
  admin: AdminProfile | null;
}
