'use client';

import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';
import { School, ArrowLeft } from 'lucide-react';

export default function TeacherLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to login options
        </Link>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <School className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Login</h1>
          <p className="text-gray-500 mt-2">Sign in to manage results</p>
        </div>
        <LoginForm role="teacher" />
      </div>
    </div>
  );
}
