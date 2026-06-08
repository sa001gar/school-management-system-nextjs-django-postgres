"use client";

import React, { useState } from "react";
import { Plus, Edit, Trash2, Search, Settings } from "lucide-react";
import {
  optionalSubjectsApi,
  classesApi,
  classOptionalConfigApi,
  classOptionalAssignmentsApi,
} from "@/lib/api/core";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OptionalSubject, Class, ClassOptionalConfig } from "@/types";

export function OptionalSubjects() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"subjects" | "assignments">(
    "subjects"
  );
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<OptionalSubject | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFormData, setSubjectFormData] = useState({
    name: "",
    code: "",
    default_full_marks: 50,
  });

  // Queries
  const { data: optionalSubjects = [], isLoading: isLoadingSubjects } =
    useQuery({
      queryKey: ["optionalSubjects"],
      queryFn: optionalSubjectsApi.getAll,
    });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: classesApi.getAll,
  });

  const { data: classConfigs = [] } = useQuery({
    queryKey: ["classOptionalConfigs"],
    queryFn: classOptionalConfigApi.getAll,
  });

  // Mutations
  const createSubjectMutation = useMutation({
    mutationFn: optionalSubjectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["optionalSubjects"] });
      toast.success("Optional subject created");
      closeForm();
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to create subject"),
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<OptionalSubject>;
    }) => optionalSubjectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["optionalSubjects"] });
      toast.success("Optional subject updated");
      closeForm();
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to update subject"),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: optionalSubjectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["optionalSubjects"] });
      toast.success("Optional subject deleted");
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to delete subject"),
  });

  const toggleConfigMutation = useMutation({
    mutationFn: async ({
      id,
      classId,
      currentStatus,
    }: {
      id?: string;
      classId: string;
      currentStatus: boolean;
    }) => {
      if (id) {
        return classOptionalConfigApi.update(id, {
          has_optional: !currentStatus,
        });
      } else {
        return classOptionalConfigApi.create({
          class_id: classId,
          has_optional: !currentStatus,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classOptionalConfigs"] });
      toast.success("Configuration updated");
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to update configuration"),
  });

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      updateSubjectMutation.mutate({
        id: editingSubject.id,
        data: subjectFormData,
      });
    } else {
      createSubjectMutation.mutate(subjectFormData);
    }
  };

  const handleEdit = (subject: OptionalSubject) => {
    setEditingSubject(subject);
    setSubjectFormData({
      name: subject.name,
      code: subject.code,
      default_full_marks: subject.default_full_marks,
    });
    setShowSubjectForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this optional subject?")) {
      deleteSubjectMutation.mutate(id);
    }
  };

  const handleToggleClass = (classId: string) => {
    const config = classConfigs.find((c) => c.class_id === classId);
    toggleConfigMutation.mutate({
      id: config?.id,
      classId,
      currentStatus: config?.has_optional || false,
    });
  };

  const closeForm = () => {
    setShowSubjectForm(false);
    setEditingSubject(null);
    setSubjectFormData({ name: "", code: "", default_full_marks: 50 });
  };

  const filteredSubjects = optionalSubjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasOptional = (classId: string) =>
    classConfigs.find((c) => c.class_id === classId)?.has_optional || false;

  if (isLoadingSubjects) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("subjects")}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "subjects"
              ? "text-amber-600 border-amber-600"
              : "text-gray-500 border-transparent hover:text-gray-700"
          }`}
        >
          Optional Subjects
        </button>
        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "assignments"
              ? "text-amber-600 border-amber-600"
              : "text-gray-500 border-transparent hover:text-gray-700"
          }`}
        >
          Class Configuration
        </button>
      </div>

      {activeTab === "subjects" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search optional subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowSubjectForm(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Optional Subject
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Default Marks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {subject.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {subject.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {subject.default_full_marks} Marks
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(subject)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(subject.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSubjects.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No optional subjects found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "assignments" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              Class Usage Configuration
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Enable optional subjects for specific classes to allow mark entry.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classes.map((cls) => {
                  const enabled = hasOptional(cls.id);
                  return (
                    <tr key={cls.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {cls.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            enabled
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {enabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleClass(cls.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                            enabled
                              ? "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                              : "bg-white border border-green-200 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {enabled ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showSubjectForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSubject
                  ? "Edit Optional Subject"
                  : "Add Optional Subject"}
              </h3>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={subjectFormData.name}
                  onChange={(e) =>
                    setSubjectFormData({
                      ...subjectFormData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                  placeholder="e.g. Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={subjectFormData.code}
                  onChange={(e) =>
                    setSubjectFormData({
                      ...subjectFormData,
                      code: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                  placeholder="e.g. CS101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Marks
                </label>
                <input
                  type="number"
                  value={subjectFormData.default_full_marks}
                  onChange={(e) =>
                    setSubjectFormData({
                      ...subjectFormData,
                      default_full_marks: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                  min="0"
                  max="1000"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createSubjectMutation.isPending ||
                    updateSubjectMutation.isPending
                  }
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50"
                >
                  {createSubjectMutation.isPending ||
                  updateSubjectMutation.isPending
                    ? "Saving..."
                    : editingSubject
                    ? "Update"
                    : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for X icon since Lucide might not export it directly as XIcon or similar sometimes in older versions
function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
