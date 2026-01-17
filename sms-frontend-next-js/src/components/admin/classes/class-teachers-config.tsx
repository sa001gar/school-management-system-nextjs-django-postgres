"use client";

import React, { useState, useEffect } from "react";
import {
  teacherAssignmentsApi,
  classTeachersApi,
  sessionsApi,
  sectionsApi,
  subjectsApi,
} from "@/lib/api/core";
import { teacherApi } from "@/lib/api/auth";
import { Loader2, Trash2, Plus, Calendar, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  TeacherAssignment,
  ClassTeacher,
  Session,
  Section,
  Subject,
  Teacher,
} from "@/types";

interface ClassTeachersConfigProps {
  classId: string;
  className: string;
}

export function ClassTeachersConfig({
  classId,
  className,
}: ClassTeachersConfigProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"subject" | "class">("subject");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [showModal, setShowModal] = useState(false);

  // Form selection states
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // --- Data Fetching ---

  // 1. Sessions (Global)
  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: sessionsApi.getAll,
  });

  // Default Session Selection
  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      const active = sessions.find((s) => s.is_active);
      if (active) setSelectedSession(active.id);
      else setSelectedSession(sessions[0].id);
    }
  }, [sessions, selectedSession]);

  // 2. Sections (Specific to this class)
  const { data: sections = [] } = useQuery({
    queryKey: ["sections", classId],
    queryFn: () => sectionsApi.getByClass(classId),
  });

  // 3. Teachers (Global)
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: teacherApi.getAll,
  });

  // 4. Subjects (Global) - specific subjects for this class would be better but global is fine for assignment
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsApi.getAll,
  });

  // 5. Existing Assignments (Filtered by Class & Session)
  const {
    data: subjectAssignments = [],
    isLoading: isLoadingSubjectAssignments,
  } = useQuery({
    queryKey: ["teacherAssignments", selectedSession, classId],
    queryFn: () =>
      teacherAssignmentsApi.getAll({
        session_id: selectedSession,
        class_id: classId,
      }),
    enabled: !!selectedSession && !!classId && activeTab === "subject",
  });

  const {
    data: classTeacherAssignments = [],
    isLoading: isLoadingClassTeachers,
  } = useQuery({
    queryKey: ["classTeachers", selectedSession, classId],
    queryFn: () =>
      classTeachersApi.getAll({
        session_id: selectedSession,
        class_id: classId,
      }),
    enabled: !!selectedSession && !!classId && activeTab === "class",
  });

  // --- Mutations ---

  const createSubjectAssignmentMutation = useMutation({
    mutationFn: teacherAssignmentsApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teacherAssignments"] });
      toast.success("Subject assignment created");
      closeModal();
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to assign teacher"),
  });

  const createClassTeacherMutation = useMutation({
    mutationFn: classTeachersApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classTeachers"] });
      toast.success("Class teacher assigned");
      closeModal();
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to assign class teacher"),
  });

  const deleteSubjectAssignmentMutation = useMutation({
    mutationFn: teacherAssignmentsApi.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teacherAssignments"] });
      toast.success("Assignment removed");
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to delete assignment"),
  });

  const deleteClassTeacherMutation = useMutation({
    mutationFn: classTeachersApi.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classTeachers"] });
      toast.success("Class teacher removed");
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to delete assignment"),
  });

  // --- Handlers ---

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;

    if (!selectedTeacher) {
      toast.error("Please select a teacher");
      return;
    }
    if (!selectedSection) {
      toast.error("Please select a section");
      return;
    }

    if (activeTab === "subject") {
      if (!selectedSubject) {
        toast.error("Please select a subject");
        return;
      }
      createSubjectAssignmentMutation.mutate({
        teacher_id: selectedTeacher,
        class_id: classId,
        section_id: selectedSection,
        subject_id: selectedSubject,
        session_id: selectedSession,
      });
    } else {
      createClassTeacherMutation.mutate({
        teacher_id: selectedTeacher,
        class_id: classId,
        section_id: selectedSection,
        session_id: selectedSession,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this assignment?")) {
      if (activeTab === "subject") {
        deleteSubjectAssignmentMutation.mutate(id);
      } else {
        deleteClassTeacherMutation.mutate(id);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTeacher("");
    setSelectedSection("");
    setSelectedSubject("");
  };

  const isLoading =
    activeTab === "subject"
      ? isLoadingSubjectAssignments
      : isLoadingClassTeachers;

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Toggle Tabs */}
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab("subject")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === "subject"
                ? "bg-white text-amber-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Subject Teachers
          </button>
          <button
            onClick={() => setActiveTab("class")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === "class"
                ? "bg-white text-amber-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Class Teachers
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Session Filter */}
          <div className="relative w-64">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <SearchableSelect
              value={selectedSession}
              onChange={setSelectedSession}
              options={sessions.map((s) => ({
                value: s.id,
                label: `${s.name} ${s.is_active ? "(Active)" : ""}`,
              }))}
              placeholder="Select Session"
              className="pl-9"
            />
          </div>
          {/* Add Button */}
          <Button
            onClick={() => setShowModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Assign {activeTab === "subject" ? "Subject" : "Class"} Teacher
          </Button>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Section
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Teacher
                  </th>
                  {activeTab === "subject" && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Subject
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeTab === "subject"
                  ? // Subject Assignments
                    subjectAssignments.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          Section {item.section_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                              {item.teacher_name?.charAt(0) || "T"}
                            </div>
                            <span className="font-medium text-gray-700">
                              {item.teacher_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-100"
                          >
                            {item.subject_name}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  : // Class Teacher Assignments
                    classTeacherAssignments.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          Section {item.section_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                              {item.teacher_name?.charAt(0) || "T"}
                            </div>
                            <span className="font-medium text-gray-700">
                              {item.teacher_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                {(activeTab === "subject"
                  ? subjectAssignments
                  : classTeacherAssignments
                ).length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No assignments found for this session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeTab === "subject"
                  ? "Assign Subject Teacher"
                  : "Assign Class Teacher"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Class Info (Read-only) */}
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 mb-2">
                Assigning to <strong>{className}</strong> for{" "}
                <strong>
                  {sessions.find((s) => s.id === selectedSession)?.name}
                </strong>
              </div>

              {/* Section Select */}
              <div className="space-y-1">
                <SearchableSelect
                  label={
                    <>
                      Section <span className="text-red-500">*</span>
                    </>
                  }
                  value={selectedSection}
                  onChange={setSelectedSection}
                  options={sections.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  placeholder="Select Section"
                />
              </div>

              {/* Teacher Select */}
              <div className="space-y-1">
                <SearchableSelect
                  label={
                    <>
                      Teacher <span className="text-red-500">*</span>
                    </>
                  }
                  value={selectedTeacher}
                  onChange={setSelectedTeacher}
                  options={teachers.map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))}
                  placeholder="Select Teacher"
                />
              </div>

              {/* Subject Select (Only for Subject Tab) */}
              {activeTab === "subject" && (
                <div>
                  <SearchableSelect
                    label={
                      <>
                        Subject <span className="text-red-500">*</span>
                      </>
                    }
                    value={selectedSubject}
                    onChange={setSelectedSubject}
                    options={subjects.map((s) => ({
                      value: s.id,
                      label: s.name,
                    }))}
                    placeholder="Select Subject"
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createSubjectAssignmentMutation.isPending ||
                    createClassTeacherMutation.isPending
                  }
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  Assign
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
