'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  Award,
} from 'lucide-react';

const adminNavItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Sessions', href: '/admin/sessions', icon: Calendar },
  { title: 'Classes', href: '/admin/classes', icon: GraduationCap },
  { title: 'Subjects', href: '/admin/subjects', icon: BookOpen },
  { title: 'Teachers', href: '/admin/teachers', icon: UserCheck },
  { title: 'Students', href: '/admin/students', icon: Users },
  { title: 'Assessments', href: '/admin/assessments', icon: FileText },
  { title: 'Grading', href: '/admin/grading', icon: Award },
  { title: 'Assignments', href: '/admin/assignments', icon: UserCheck },
];

const teacherNavItems = [
  { title: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
  { title: 'Marks Entry', href: '/teacher/marks', icon: BookOpen },
  { title: 'Marksheet', href: '/teacher/marksheet', icon: FileText },
];

const studentNavItems = [
  { title: 'Dashboard', href: '/student', icon: LayoutDashboard },
  { title: 'My Results', href: '/student/results', icon: FileText },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return null;
}
