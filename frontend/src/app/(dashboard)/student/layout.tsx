'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useIsHydrated } from '@/stores/auth-store';
import { clearTokens } from '@/lib/api/client';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Loading } from '@/components/ui/loading';
import { LayoutDashboard, FileText, Award, User, BarChart3 } from 'lucide-react';

const navItems = [
  { title: 'Dashboard', href: '/student', icon: LayoutDashboard },
  { title: 'My Results', href: '/student/results', icon: FileText },
  { title: 'Report Card', href: '/student/report-card', icon: Award },
  { title: 'Profile', href: '/student/profile', icon: User },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { student, isAuthenticated, logout } = useAuthStore();
  const isHydrated = useIsHydrated();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated && !student) {
      router.push('/login/student');
      return;
    }
    setIsValidating(false);
  }, [isHydrated, isAuthenticated, student]);

  if (!isHydrated || isValidating) return <Loading message="Verifying session..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar items={navItems} title="Student" color="from-green-500 to-emerald-600" />
      <div className="lg:ml-64">
        <div className="lg:hidden h-16" />
        <Header />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
