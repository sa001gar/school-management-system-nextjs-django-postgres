"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Save,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  optionalSubjectsApi,
  classOptionalConfigApi,
  classOptionalAssignmentsApi,
} from "@/lib/api/core";
import type {
  OptionalSubject,
  ClassOptionalConfig,
  ClassOptionalAssignment,
} from "@/types";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface ClassOptionalConfigProps {
  classId: string;
  className: string;
}

export function ClassOptionalConfig({
  classId,
  className,
}: ClassOptionalConfigProps) {
  const [subjects, setSubjects] = useState<OptionalSubject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<OptionalSubject[]>(
    [],
  );
  const [assignments, setAssignments] = useState<ClassOptionalAssignment[]>([]);
  const [config, setConfig] = useState<ClassOptionalConfig | null>(null);

  const [isEnabled, setIsEnabled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Local state for batch editing
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(
    new Set(),
  );
  const [assignmentsHasChanges, setAssignmentsHasChanges] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [classId]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSubjects(subjects);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      setFilteredSubjects(
        subjects.filter(
          (s) =>
            s.name.toLowerCase().includes(lowerTerm) ||
            s.code.toLowerCase().includes(lowerTerm),
        ),
      );
    }
  }, [searchTerm, subjects]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [subjectsData, configData, assignmentsData] = await Promise.all([
        optionalSubjectsApi.getAll(),
        classOptionalConfigApi.getByClass(classId),
        classOptionalAssignmentsApi.getByClass(classId),
      ]);

      setSubjects(subjectsData);
      setFilteredSubjects(subjectsData);
      setConfig(configData);
      setIsEnabled(configData?.has_optional || false);
      setAssignments(assignmentsData);

      // Initialize selection state
      const currentIds = new Set(
        assignmentsData
          .map((a) => a.optional_subject?.id || a.optional_subject_id)
          .filter((id): id is string => !!id),
      );
      setSelectedSubjectIds(currentIds);
    } catch (error) {
      console.error("Error fetching optional config data:", error);
      toast.error("Failed to load optional subjects configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = async () => {
    setSavingConfig(true);
    try {
      if (config) {
        const updated = await classOptionalConfigApi.update(config.id, {
          has_optional: isEnabled,
        });
        setConfig(updated);
      } else {
        const created = await classOptionalConfigApi.create({
          class_id: classId,
          has_optional: isEnabled,
        });
        setConfig(created);
      }
      toast.success(
        isEnabled
          ? "Optional subjects enabled for this class"
          : "Optional subjects disabled for this class",
      );
    } catch (error) {
      console.error("Error saving optional config:", error);
      toast.error("Failed to save configuration status");
    } finally {
      setSavingConfig(false);
    }
  };

  const toggleSubjectAssignment = (subjectId: string) => {
    if (!isEnabled) return;

    const newSelected = new Set(selectedSubjectIds);
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId);
    } else {
      newSelected.add(subjectId);
    }

    setSelectedSubjectIds(newSelected);
    checkChanges(newSelected);
  };

  const checkChanges = (newSelected: Set<string>) => {
    const originalIds = new Set(
      assignments.map((a) => a.optional_subject?.id || a.optional_subject_id),
    );

    let isChanged = newSelected.size !== originalIds.size;
    if (!isChanged) {
      for (let id of newSelected) {
        if (!originalIds.has(id)) {
          isChanged = true;
          break;
        }
      }
    }
    setAssignmentsHasChanges(isChanged);
  };

  const handleRevert = () => {
    const currentIds = new Set(
      assignments
        .map((a) => a.optional_subject?.id || a.optional_subject_id)
        .filter((id): id is string => !!id),
    );
    setSelectedSubjectIds(currentIds);
    setAssignmentsHasChanges(false);
    toast.info("Changes reverted");
  };

  const handleAssignmentsSave = async () => {
    setSavingAssignments(true);
    setShowConfirmModal(false);

    try {
      await classOptionalAssignmentsApi.bulkUpdate({
        class_id: classId,
        optional_subject_ids: Array.from(selectedSubjectIds),
      });

      toast.success("Optional subject assignments saved");

      // Refresh assignments
      const newAssignments =
        await classOptionalAssignmentsApi.getByClass(classId);
      setAssignments(newAssignments);
      setAssignmentsHasChanges(false);
    } catch (error) {
      console.error("Error saving assignments:", error);
      toast.error("Failed to save assignments");
    } finally {
      setSavingAssignments(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  const configHasChanges = (config?.has_optional || false) !== isEnabled;

  return (
    <div className="space-y-6">
      {/* Enable/Disable Card */}
      <Card className="border-amber-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Layers className="w-24 h-24 text-amber-600 transform -rotate-12" />
        </div>

        <CardHeader className="bg-amber-50/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                Optional Subjects Configuration
              </CardTitle>
              <CardDescription className="mt-1">
                Manage optional subjects for {className}
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm z-10">
              <Switch
                id="optional-mode"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                className="data-[state=checked]:bg-amber-600"
              />
              <Label
                htmlFor="optional-mode"
                className="font-medium cursor-pointer"
              >
                {isEnabled ? "Enabled" : "Disabled"}
              </Label>
            </div>
          </div>
        </CardHeader>

        {configHasChanges && (
          <CardContent className="pt-0 pb-4">
            <div className="flex justify-end mt-4 px-6">
              <Button
                onClick={handleConfigSave}
                disabled={savingConfig}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                size="sm"
              >
                {savingConfig ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Saving Status...
                  </>
                ) : (
                  "Save Status to Enable Editing"
                )}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Assignments Area */}
      {isEnabled && !configHasChanges && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Optional Subjects
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRevert}
                disabled={!assignmentsHasChanges || savingAssignments}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowConfirmModal(true)}
                disabled={!assignmentsHasChanges || savingAssignments}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {savingAssignments ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Assignments
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((subject) => {
              const isSelected = selectedSubjectIds.has(subject.id);

              return (
                <div
                  key={subject.id}
                  onClick={() => toggleSubjectAssignment(subject.id)}
                  className={`
                    relative group cursor-pointer p-4 rounded-xl border-2 transition-all duration-200
                    ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/50 shadow-sm transform scale-[1.01]"
                        : "border-gray-100 bg-white hover:border-amber-200 hover:shadow-md"
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4
                        className={`font-semibold ${
                          isSelected ? "text-amber-900" : "text-gray-900"
                        }`}
                      >
                        {subject.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="bg-gray-100 font-normal"
                        >
                          {subject.code}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Marks: {subject.default_full_marks}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`
                      w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                      ${
                        isSelected
                          ? "bg-amber-600 text-white rotate-0"
                          : "bg-gray-100 text-gray-300 group-hover:bg-amber-100 group-hover:text-amber-600 rotate-90"
                      }
                    `}
                    >
                      {isSelected ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-amber-500 rounded-xl pointer-events-none animate-in fade-in zoom-in-95 duration-200" />
                  )}
                </div>
              );
            })}

            {filteredSubjects.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>No optional subjects found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!isEnabled && !configHasChanges && (
        <div className="p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
          <h3 className="text-gray-900 font-semibold mb-2">
            Optional Subjects Disabled
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Enable optional subjects above to assign specific optional subjects
            to this class.
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Optional Assignments"
        size="sm"
      >
        <div className="p-4 space-y-4">
          <p className="text-gray-600 text-sm">
            You are about to update the optional subject assignments for{" "}
            <strong>{className}</strong>.
          </p>

          <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-center flex-1">
              <div className="text-xs text-gray-500 uppercase font-medium tracking-wide mb-1">
                Previous
              </div>
              <div className="text-xl font-semibold text-gray-700">
                {assignments.length}
              </div>
            </div>

            <div className="text-gray-300">
              <span className="text-2xl">→</span>
            </div>

            <div className="text-center flex-1">
              <div className="text-xs text-amber-600 uppercase font-medium tracking-wide mb-1">
                New
              </div>
              <div className="text-xl font-bold text-amber-600">
                {selectedSubjectIds.size}
              </div>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignmentsSave}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Confirm Update
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
