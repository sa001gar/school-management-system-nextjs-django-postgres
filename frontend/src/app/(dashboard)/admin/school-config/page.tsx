"use client";

import { SchoolConfigManagement } from "@/components/admin/SchoolConfigManagement";

export default function SchoolConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          School Configuration
        </h1>
        <p className="text-gray-600 mt-2">
          Manage school days, assessment categories, and marks distribution
        </p>
      </div>

      <SchoolConfigManagement />
    </div>
  );
}
