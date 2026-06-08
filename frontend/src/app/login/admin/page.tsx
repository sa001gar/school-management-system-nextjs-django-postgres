'use client';

import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to login options
        </Link>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Administrator Login</h1>
          <p className="text-gray-500 mt-2">Sign in to manage the school</p>
        </div>
        <LoginForm role="admin" />
      </div>
    </div>
  );
}
