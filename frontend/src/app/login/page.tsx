import { redirect } from 'next/navigation';
import Link from 'next/link';
import { School, Shield, User, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <School className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Result Management System</h1>
          <p className="text-gray-500 mt-2">Select your login type</p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/login/admin"
            className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all"
          >
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Administrator</h3>
              <p className="text-sm text-gray-500">Manage school and results</p>
            </div>
          </Link>

          <Link
            href="/login/teacher"
            className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all"
          >
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Teacher</h3>
              <p className="text-sm text-gray-500">Enter marks and results</p>
            </div>
          </Link>

          <Link
            href="/login/student"
            className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all"
          >
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <GraduationCap className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Student</h3>
              <p className="text-sm text-gray-500">View your results</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
