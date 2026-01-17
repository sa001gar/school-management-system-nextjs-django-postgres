"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api/client";
import { School } from "@/types";
import { SchoolProfileForm } from "@/components/admin/school-profile-form";
import { Loader2, AlertCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const schoolId = user?.school?.id;

  const {
    data: school,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["school", schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error("No school ID found");
      return api.get<School>(`/schools/${schoolId}/`);
    },
    enabled: !!schoolId,
  });

  if (!user?.school) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
        <div className="bg-amber-100 p-3 rounded-full mb-4">
          <AlertCircle className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          No School Assigned
        </h2>
        <p className="text-gray-500 mt-2">
          You are not associated with any school. Please contact the site
          administrator.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
        <div className="bg-red-100 p-3 rounded-full mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Failed to load settings
        </h2>
        <p className="text-gray-500 mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Settings
        </h1>
        <p className="text-sm text-gray-500">
          Manage your school's configuration and profile.
        </p>
      </div>

      <SchoolProfileForm initialData={school} />
    </div>
  );
}
