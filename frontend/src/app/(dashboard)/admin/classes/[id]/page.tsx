"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  BookOpen,
  Users,
  LayoutGrid,
  ChevronLeft,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { classesApi } from "@/lib/api/core";
import { PageHeader } from "@/components/layout/page-header";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { ClassSubjectsConfig } from "@/components/admin/classes/class-subjects-config";
import { ClassTeachersConfig } from "@/components/admin/classes/class-teachers-config";
import { ClassCocurricularConfig } from "@/components/admin/classes/class-cocurricular-config";
import { ClassOptionalConfig } from "@/components/admin/classes/class-optional-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClassDetailsPage() {
  const params = useParams();
  const classId = params.id as string;
  const [activeTab, setActiveTab] = useState<
    "overview" | "subjects" | "teachers" | "cocurricular" | "optional"
  >("subjects");

  const { data: classData, isLoading } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => classesApi.getById(classId),
    enabled: !!classId,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Class not found</h2>
        <Button variant="link" asChild className="mt-4">
          <Link href="/admin/classes">Back to Classes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4 pl-0 hover:bg-transparent hover:text-amber-600"
        >
          <Link href="/admin/classes" className="flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to All Classes
          </Link>
        </Button>
        <PageHeader
          title={`${classData.name} Details`}
          description={`Manage curriculum and teachers for ${classData.name}`}
          icon={GraduationCap}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex gap-6 min-w-max">
          <button
            onClick={() => setActiveTab("subjects")}
            className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "subjects"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <BookOpen
              className={`w-4 h-4 ${
                activeTab === "subjects" ? "text-amber-600" : "text-gray-400"
              }`}
            />
            Subjects
          </button>

          <button
            onClick={() => setActiveTab("optional")}
            className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "optional"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Layers
              className={`w-4 h-4 ${
                activeTab === "optional" ? "text-amber-600" : "text-gray-400"
              }`}
            />
            Optional Subjects
          </button>

          <button
            onClick={() => setActiveTab("cocurricular")}
            className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "cocurricular"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Sparkles
              className={`w-4 h-4 ${
                activeTab === "cocurricular"
                  ? "text-amber-600"
                  : "text-gray-400"
              }`}
            />
            Co-curricular
          </button>

          <button
            onClick={() => setActiveTab("teachers")}
            className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "teachers"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users
              className={`w-4 h-4 ${
                activeTab === "teachers" ? "text-amber-600" : "text-gray-400"
              }`}
            />
            Teachers
          </button>

          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "overview"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <LayoutGrid
              className={`w-4 h-4 ${
                activeTab === "overview" ? "text-amber-600" : "text-gray-400"
              }`}
            />
            Overview
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "subjects" && (
          <ClassSubjectsConfig classId={classId} className={classData.name} />
        )}

        {activeTab === "optional" && (
          <ClassOptionalConfig classId={classId} className={classData.name} />
        )}

        {activeTab === "cocurricular" && (
          <ClassCocurricularConfig
            classId={classId}
            className={classData.name}
          />
        )}

        {activeTab === "teachers" && (
          <ClassTeachersConfig classId={classId} className={classData.name} />
        )}

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Class Name</span>
                  <span className="font-medium">{classData.name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Level</span>
                  <span className="font-medium">{classData.level}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50/50 border-amber-200">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">
                  Use the tabs above to configure the curriculum structure for
                  this class.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Subjects:</strong> Core academic subjects.
                  <br />
                  <strong>Optional:</strong> Elective subjects (with selection).
                  <br />
                  <strong>Co-curricular:</strong> Activity-based grading.
                  <br />
                  <strong>Teachers:</strong> Assign teachers to
                  sections/subjects.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
