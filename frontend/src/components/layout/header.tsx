'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, teacher, admin, student, logout } = useAuthStore();
  const router = useRouter();

  const displayName = admin?.name || teacher?.name || student?.name || user?.name || 'User';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white hidden lg:block">
      <div className="flex h-16 items-center justify-end px-6">
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">{user?.role || 'student'}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-medium">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
