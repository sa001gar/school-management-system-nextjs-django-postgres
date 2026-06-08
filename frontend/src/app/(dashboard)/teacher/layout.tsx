'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useIsHydrated } from '@/stores/auth-store';
import { clearTokens } from '@/lib/api/client';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Loading } from '@/components/ui/loading';
import { LayoutDashboard, BookOpen, FileText, ClipboardList, Users } from 'lucide-react';

const navItems = [
  { title: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
  { title: 'Marks Entry', href: '/teacher/marks', icon: BookOpen },
  { title: 'Marksheet', href: '/teacher/marksheet', icon: FileText },
  { title: 'Reports', href: '/teacher/reports', icon: ClipboardList },
  { title: 'Students', href: '/teacher/students', icon: Users },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const isHydrated = useIsHydrated();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || (user?.role !== 'teacher' && user?.role !== 'admin')) {
      router.push('/login/teacher');
      return;
    }
    setIsValidating(false);
  }, [isHydrated, isAuthenticated, user?.role]);

  if (!isHydrated || isValidating) return <Loading message="Verifying session..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar items={navItems} title="Teacher" color="from-blue-500 to-cyan-600" />
      <div className="lg:ml-64">
        <div className="lg:hidden h-16" />
        <Header />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
