"use client";

import React, { useState } from "react";
import { Save, Plus, Trash2, Zap } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assessmentCategoriesApi,
  coreMarksDistributionApi,
} from "@/lib/api/core";
import type { AssessmentCategory, CoreSubjectMarksDistribution } from "@/types";

interface ClassAssessmentConfigProps {
  classId: string;
  className: string;
}

type ExamType =
  | "only_summative"
  | "only_formative"
  | "summative_formative"
  | "practical"
  | "other";

interface ExamForm {
  name: string;
  type: ExamType;
  summativeMarks: number;
  formativeMarks: number;
  customType: string;
}

export const ClassAssessmentConfig: React.FC<ClassAssessmentConfigProps> = ({
  classId,
  className,
}) => {
  const queryClient = useQueryClient();
  const [exams, setExams] = useState<ExamForm[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data: assessmentCategories = [] } = useQuery({
    queryKey: ["assessment-categories"],
    queryFn: () => assessmentCategoriesApi.getAll(),
  });

  const { data: existingDistributions = [] } = useQuery({
    queryKey: ["core-marks-distributions", classId],
    queryFn: () => coreMarksDistributionApi.getAll(classId),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: Partial<AssessmentCategory>) =>
      assessmentCategoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-categories"] });
    },
  });

  const updateMarksMutation = useMutation({
    mutationFn: (data: {
      class_id: string;
      distributions: Array<{
        assessment_category_id: string;
        full_marks: number;
      }>;
    }) => coreMarksDistributionApi.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["core-marks-distributions"] });
    },
  });

  const addExam = () => {
    setExams([
      ...exams,
      {
        name: "",
        type: "only_summative",
        summativeMarks: 0,
        formativeMarks: 0,
        customType: "",
      },
    ]);
  };

  const removeExam = (index: number) => {
    setExams(exams.filter((_, i) => i !== index));
  };

  const updateExam = (index: number, field: keyof ExamForm, value: any) => {
    const updated = [...exams];
    updated[index] = { ...updated[index], [field]: value };
    setExams(updated);
  };

  const quickAddUnits = () => {
    const unitCount = parseInt(prompt("How many unit tests?") || "0");
    if (unitCount > 0) {
      const newExams: ExamForm[] = [];
      for (let i = 1; i <= unitCount; i++) {
        newExams.push({
          name: `Unit Test ${i}`,
          type: "only_summative",
          summativeMarks: 20,
          formativeMarks: 0,
          customType: "",
        });
      }
      setExams([...exams, ...newExams]);
    }
  };

  const saveConfiguration = async () => {
    if (exams.length === 0) {
      alert("Please add at least one exam");
      return;
    }

    // Create assessment categories and distributions
    const distributions: Array<{
      assessment_category_id: string;
      full_marks: number;
    }> = [];

    for (const exam of exams) {
      if (!exam.name) {
        alert("Please fill in all exam names");
        return;
      }

      if (exam.type === "summative_formative") {
        // Create two categories
        const summative = await createCategoryMutation.mutateAsync({
          name: `${exam.name} (Summative)`,
          code: `${exam.name.replace(/\s+/g, "_").toUpperCase()}_SUM`,
          category_type: "summative",
        });
        const formative = await createCategoryMutation.mutateAsync({
          name: `${exam.name} (Formative)`,
          code: `${exam.name.replace(/\s+/g, "_").toUpperCase()}_FOR`,
          category_type: "formative",
        });
        distributions.push(
          {
            assessment_category_id: summative.id,
            full_marks: exam.summativeMarks,
          },
          {
            assessment_category_id: formative.id,
            full_marks: exam.formativeMarks,
          },
        );
      } else {
        // Create single category
        const categoryType =
          exam.type === "only_summative"
            ? "summative"
            : exam.type === "only_formative"
              ? "formative"
              : exam.type === "practical"
                ? "practical"
                : exam.customType || "other";

        const category = await createCategoryMutation.mutateAsync({
          name: exam.name,
          code: exam.name.replace(/\s+/g, "_").toUpperCase(),
          category_type: categoryType as any,
        });

        const marks =
          exam.type === "only_summative" ||
          exam.type === "practical" ||
          exam.type === "other"
            ? exam.summativeMarks
            : exam.formativeMarks;

        distributions.push({
          assessment_category_id: category.id,
          full_marks: marks,
        });
      }
    }

    // Save marks distribution
    await updateMarksMutation.mutateAsync({
      class_id: classId,
      distributions,
    });

    setExams([]);
    alert("Configuration saved successfully!");
  };

  const totalMarks = exams.reduce((sum, exam) => {
    if (exam.type === "summative_formative") {
      return sum + exam.summativeMarks + exam.formativeMarks;
    }
    return sum + (exam.summativeMarks || exam.formativeMarks);
  }, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-amber-50 border-b border-amber-200">
        <div>
          <h3 className="font-semibold text-amber-900">
            Configure Assessments for {className}
          </h3>
          <p className="text-sm text-amber-600 mt-1">
            Add all exams and set marks distribution at once
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={quickAddUnits}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Zap className="w-4 h-4" />
            Quick Add Units
          </button>
          <button
            onClick={addExam}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Exam
          </button>
          <button
            onClick={saveConfiguration}
            disabled={exams.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save All
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {exams.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No exams added yet</p>
            <p className="text-sm">
              Click "Add Exam" or "Quick Add Units" to get started
            </p>
          </div>
        ) : (
          <>
            {exams.map((exam, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="grid grid-cols-12 gap-4 items-start">
                  {/* Exam Name */}
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Exam Name
                    </label>
                    <input
                      type="text"
                      value={exam.name}
                      onChange={(e) =>
                        updateExam(index, "name", e.target.value)
                      }
                      placeholder="e.g., 1st Summative"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      list={`exam-suggestions-${index}`}
                    />
                    <datalist id={`exam-suggestions-${index}`}>
                      <option value="1st Summative" />
                      <option value="2nd Summative" />
                      <option value="3rd Summative" />
                      <option value="Unit Test 1" />
                      <option value="Mid-Term Exam" />
                      <option value="Final Exam" />
                      <option value="Annual Exam" />
                    </datalist>
                  </div>

                  {/* Type */}
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={exam.type}
                      onChange={(e) =>
                        updateExam(index, "type", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="only_summative">Only Summative</option>
                      <option value="only_formative">Only Formative</option>
                      <option value="summative_formative">
                        Summative + Formative
                      </option>
                      <option value="practical">Practical</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Marks */}
                  {exam.type === "summative_formative" ? (
                    <>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Summative Marks
                        </label>
                        <input
                          type="number"
                          value={exam.summativeMarks}
                          onChange={(e) =>
                            updateExam(
                              index,
                              "summativeMarks",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                          min="0"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Formative Marks
                        </label>
                        <input
                          type="number"
                          value={exam.formativeMarks}
                          onChange={(e) =>
                            updateExam(
                              index,
                              "formativeMarks",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                          min="0"
                        />
                      </div>
                    </>
                  ) : exam.type === "other" ? (
                    <>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Custom Type
                        </label>
                        <input
                          type="text"
                          value={exam.customType}
                          onChange={(e) =>
                            updateExam(index, "customType", e.target.value)
                          }
                          placeholder="e.g., Assignment"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Marks
                        </label>
                        <input
                          type="number"
                          value={exam.summativeMarks}
                          onChange={(e) =>
                            updateExam(
                              index,
                              "summativeMarks",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                          min="0"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Marks
                      </label>
                      <input
                        type="number"
                        value={
                          exam.type === "only_formative"
                            ? exam.formativeMarks
                            : exam.summativeMarks
                        }
                        onChange={(e) => {
                          const field =
                            exam.type === "only_formative"
                              ? "formativeMarks"
                              : "summativeMarks";
                          updateExam(
                            index,
                            field,
                            parseInt(e.target.value) || 0,
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        min="0"
                      />
                    </div>
                  )}

                  {/* Remove Button */}
                  <div className="col-span-1 flex items-end">
                    <button
                      onClick={() => removeExam(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-end">
              <div className="bg-amber-100 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-amber-900">
                  Total Marks:{" "}
                  <span className="text-lg font-bold">{totalMarks}</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
