'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useIsHydrated } from '@/stores/auth-store';
import { validateSession, clearTokens } from '@/lib/auth/session';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Loading } from '@/components/ui/loading';
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

const navItems = [
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const isHydrated = useIsHydrated();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/login/admin');
      return;
    }
    const validate = async () => {
      const { valid } = await validateSession();
      if (!valid) {
        clearTokens();
        logout();
        router.push('/login/admin');
        return;
      }
      setIsValidating(false);
    };
    validate();
  }, [isHydrated, isAuthenticated, user?.role]);

  if (!isHydrated || isValidating) return <Loading message="Verifying session..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar items={navItems} title="Admin" color="from-amber-500 to-orange-600" />
      <div className="lg:ml-64">
        <div className="lg:hidden h-16" />
        <Header />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
