"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Save,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  cocurricularSubjectsApi,
  classCocurricularConfigApi,
} from "@/lib/api/core";
import type { CocurricularSubject, ClassCocurricularConfig } from "@/types";
import { Button } from "@/components/ui/button";
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

interface ClassCocurricularConfigProps {
  classId: string;
  className: string;
}

export function ClassCocurricularConfig({
  classId,
  className,
}: ClassCocurricularConfigProps) {
  const [subjects, setSubjects] = useState<CocurricularSubject[]>([]);
  const [config, setConfig] = useState<ClassCocurricularConfig | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [classId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch available cocurricular subjects and current config in parallel
      const [subjectsData, configData] = await Promise.all([
        cocurricularSubjectsApi.getAll(),
        classCocurricularConfigApi.getByClass(classId),
      ]);

      setSubjects(subjectsData);
      setConfig(configData);
      setIsEnabled(configData?.has_cocurricular || false);
    } catch (error) {
      console.error("Error fetching cocurricular data:", error);
      toast.error("Failed to load cocurricular configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (config) {
        // Update existing
        const updated = await classCocurricularConfigApi.update(config.id, {
          has_cocurricular: isEnabled,
        });
        setConfig(updated);
      } else {
        // Create new
        const created = await classCocurricularConfigApi.create({
          class_id: classId,
          has_cocurricular: isEnabled,
        });
        setConfig(created);
      }
      toast.success(
        isEnabled
          ? "Co-curricular activities enabled for this class"
          : "Co-curricular activities disabled for this class",
      );
    } catch (error) {
      console.error("Error saving cocurricular config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  // Check if there are unsaved changes
  const hasChanges = (config?.has_cocurricular || false) !== isEnabled;

  return (
    <div className="space-y-6">
      {/* Main Configuration Card */}
      <Card className="border-amber-100 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles className="w-24 h-24 text-amber-600 transform rotate-12" />
        </div>

        <CardHeader className="bg-amber-50/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                Co-curricular Configuration
              </CardTitle>
              <CardDescription className="mt-1">
                Enable or disable co-curricular activities for {className}
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
              <Switch
                id="cocurricular-mode"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                className="data-[state=checked]:bg-amber-600"
              />
              <Label
                htmlFor="cocurricular-mode"
                className="font-medium cursor-pointer"
              >
                {isEnabled ? "Enabled" : "Disabled"}
              </Label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="flex justify-end mb-6">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <div
            className={`transition-all duration-300 ${!isEnabled ? "opacity-50 grayscale" : ""}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">
                Available Activities
              </h3>
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800 hover:bg-amber-100"
              >
                {subjects.length} Total
              </Badge>
            </div>

            {subjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center p-3 rounded-lg border border-gray-100 bg-white hover:border-amber-200 hover:shadow-sm transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mr-3 text-amber-600">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {subject.name}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {subject.code}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">
                  No co-curricular subjects defined in the system.
                </p>
                <Button
                  variant="link"
                  className="text-amber-600 h-auto p-0 mt-1"
                >
                  Add subjects in Master Settings
                </Button>
              </div>
            )}
          </div>

          {!isEnabled && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-500 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <p>
                When disabled, co-curricular grading will not be available for
                students in this class. Any existing grades will be hidden but
                not deleted.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
