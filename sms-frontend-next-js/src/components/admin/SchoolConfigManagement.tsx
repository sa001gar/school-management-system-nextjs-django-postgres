"use client";

import React, { useState } from "react";
import { Calendar, Calculator, BookOpen, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { classesApi, sessionsApi } from "@/lib/api/core";
import { SchoolDaysConfig } from "./school-config/SchoolDaysConfig";
import { ClassAssessmentConfig } from "./school-config/ClassAssessmentConfig";

type TabType = "school_days" | "class_assessments";

export const SchoolConfigManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("school_days");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classesApi.getAll(),
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => sessionsApi.getAll(),
  });

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const loading = loadingClasses || loadingSessions;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-amber-200">
        <button
          onClick={() => setActiveTab("school_days")}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === "school_days"
              ? "text-amber-600 border-b-2 border-amber-600"
              : "text-amber-500 hover:text-amber-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            School Days
          </div>
        </button>
        <button
          onClick={() => setActiveTab("class_assessments")}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === "class_assessments"
              ? "text-amber-600 border-b-2 border-amber-600"
              : "text-amber-500 hover:text-amber-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Class Assessments & Marks
          </div>
        </button>
      </div>

      {/* School Days Tab */}
      {activeTab === "school_days" && (
        <SchoolDaysConfig classes={classes} sessions={sessions} />
      )}

      {/* Class Assessments Tab */}
      {activeTab === "class_assessments" && (
        <div className="space-y-4">
          {/* Class Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class to Configure
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                  <input
                    type="text"
                    placeholder="Search classes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Class Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
              {filteredClasses.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedClassId === cls.id
                      ? "border-amber-600 bg-amber-50 shadow-md"
                      : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-gray-900">
                      {cls.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Class Assessment Configuration */}
          {selectedClassId && (
            <ClassAssessmentConfig
              classId={selectedClassId}
              className={
                classes.find((c) => c.id === selectedClassId)?.name || ""
              }
            />
          )}

          {!selectedClassId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Select a Class to Configure
              </h3>
              <p className="text-blue-700">
                Choose a class above to set up assessments and marks
                distribution
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
