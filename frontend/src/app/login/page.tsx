import Link from "next/link";
import { User, School, GraduationCap, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Login - School Management System",
  description: "Select your role to login to the portal",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Please select your role to access the school management portal.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Student Login */}
          <Link href="/login/student" className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-none bg-white/50 hover:bg-white backdrop-blur-sm group-hover:-translate-y-1">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-green-200 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Student
                </h2>
                <p className="text-gray-500 mb-6">
                  Access your results, payments, and academic records
                </p>
                <div className="mt-auto w-full py-2.5 rounded-lg bg-green-50 text-green-700 font-medium flex items-center justify-center gap-2 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  Login as Student
                  <ChevronRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Teacher Login */}
          <Link href="/login/teacher" className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-none bg-white/50 hover:bg-white backdrop-blur-sm group-hover:-translate-y-1">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Teacher
                </h2>
                <p className="text-gray-500 mb-6">
                  Manage assignments, marks, and student attendance
                </p>
                <div className="mt-auto w-full py-2.5 rounded-lg bg-blue-50 text-blue-700 font-medium flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  Login as Teacher
                  <ChevronRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Admin Login */}
          <Link href="/login/admin" className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-none bg-white/50 hover:bg-white backdrop-blur-sm group-hover:-translate-y-1">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform duration-300">
                  <School className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin</h2>
                <p className="text-gray-500 mb-6">
                  System administration and institutional management
                </p>
                <div className="mt-auto w-full py-2.5 rounded-lg bg-purple-50 text-purple-700 font-medium flex items-center justify-center gap-2 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  Login as Admin
                  <ChevronRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
