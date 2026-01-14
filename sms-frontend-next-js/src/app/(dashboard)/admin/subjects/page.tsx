"use client";

import React, { useState } from "react";
import { BookOpen, Layers, Medal } from "lucide-react";
import { CoreSubjects } from "@/components/admin/subjects/CoreSubjects";
import { OptionalSubjects } from "@/components/admin/subjects/OptionalSubjects";
import { CocurricularSubjects } from "@/components/admin/subjects/CocurricularSubjects";

export default function SubjectsPage() {
  const [activeTab, setActiveTab] = useState<
    "core" | "optional" | "cocurricular"
  >("core");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Subjects Management
        </h1>
        <p className="text-gray-500">
          Manage core subjects, optional subjects, and co-curricular activities.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("core")}
              className={`group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "core"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BookOpen
                className={`-ml-0.5 mr-2 h-5 w-5 ${
                  activeTab === "core"
                    ? "text-amber-600"
                    : "text-gray-400 group-hover:text-gray-500"
                }`}
              />
              Core Subjects
            </button>
            <button
              onClick={() => setActiveTab("optional")}
              className={`group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "optional"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Layers
                className={`-ml-0.5 mr-2 h-5 w-5 ${
                  activeTab === "optional"
                    ? "text-amber-600"
                    : "text-gray-400 group-hover:text-gray-500"
                }`}
              />
              Optional Subjects
            </button>
            <button
              onClick={() => setActiveTab("cocurricular")}
              className={`group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "cocurricular"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Medal
                className={`-ml-0.5 mr-2 h-5 w-5 ${
                  activeTab === "cocurricular"
                    ? "text-amber-600"
                    : "text-gray-400 group-hover:text-gray-500"
                }`}
              />
              Co-curricular Activities
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "core" && <CoreSubjects />}
          {activeTab === "optional" && <OptionalSubjects />}
          {activeTab === "cocurricular" && <CocurricularSubjects />}
        </div>
      </div>
    </div>
  );
}
