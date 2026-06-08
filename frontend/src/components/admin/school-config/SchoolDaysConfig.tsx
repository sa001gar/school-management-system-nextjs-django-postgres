"use client";

import React, { useState } from "react";
import { Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schoolConfigApi } from "@/lib/api/core";
import type { Class, Session, SchoolConfig } from "@/types";

interface SchoolDaysConfigProps {
  classes: Class[];
  sessions: Session[];
}

export const SchoolDaysConfig: React.FC<SchoolDaysConfigProps> = ({
  classes,
  sessions,
}) => {
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<{
    [classId: string]: { [sessionId: string]: number };
  }>({});

  const { data: schoolConfigs = [] } = useQuery({
    queryKey: ["school-configs"],
    queryFn: async () => {
      if (classes.length === 0) return [];
      return schoolConfigApi.getByClasses(classes.map((c) => c.id));
    },
    enabled: classes.length > 0,
  });

  const handleChange = (classId: string, sessionId: string, days: number) => {
    setPendingChanges((prev) => ({
      ...prev,
      [classId]: { ...prev[classId], [sessionId]: days },
    }));
  };

  const getDays = (classId: string, sessionId: string): number => {
    if (pendingChanges[classId]?.[sessionId] !== undefined) {
      return pendingChanges[classId][sessionId];
    }
    const config = schoolConfigs.find(
      (c) => c.class_id === classId && c.session_id === sessionId,
    );
    return config?.total_school_days || 200;
  };

  const saveChanges = async () => {
    const updates: Array<{
      class_id: string;
      session_id: string;
      total_school_days: number;
    }> = [];

    Object.entries(pendingChanges).forEach(([classId, sessions]) => {
      Object.entries(sessions).forEach(([sessionId, totalDays]) => {
        updates.push({
          class_id: classId,
          session_id: sessionId,
          total_school_days: totalDays,
        });
      });
    });

    if (updates.length === 0) {
      alert("No changes to save.");
      return;
    }

    for (const update of updates) {
      const existing = schoolConfigs.find(
        (c) =>
          c.class_id === update.class_id && c.session_id === update.session_id,
      );
      if (existing?.id) {
        await schoolConfigApi.update(existing.id, {
          total_school_days: update.total_school_days,
        });
      } else {
        await schoolConfigApi.create(update);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["school-configs"] });
    setPendingChanges({});
    alert("School days saved successfully!");
  };

  const hasPendingChanges = Object.keys(pendingChanges).some(
    (classId) => Object.keys(pendingChanges[classId] || {}).length > 0,
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-amber-50 border-b border-amber-200">
        <div>
          <h3 className="font-semibold text-amber-900">
            Total School Days per Class & Session
          </h3>
          <p className="text-sm text-amber-600 mt-1">
            Configure the total number of effective teaching days for each class
            and session.
          </p>
        </div>
        <button
          onClick={saveChanges}
          disabled={!hasPendingChanges}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-amber-50 border-b border-amber-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">
                Class
              </th>
              {sessions.map((session) => (
                <th
                  key={session.id}
                  className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase"
                >
                  {session.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-200">
            {classes.map((cls, index) => (
              <tr
                key={cls.id}
                className={index % 2 === 0 ? "bg-white" : "bg-amber-50/50"}
              >
                <td className="px-4 py-3 text-sm font-medium text-amber-900">
                  {cls.name}
                </td>
                {sessions.map((session) => {
                  const hasChanges =
                    pendingChanges[cls.id]?.[session.id] !== undefined;
                  return (
                    <td key={session.id} className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={getDays(cls.id, session.id)}
                        onChange={(e) =>
                          handleChange(
                            cls.id,
                            session.id,
                            parseInt(e.target.value) || 200,
                          )
                        }
                        className={`w-20 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-amber-500 ${
                          hasChanges
                            ? "border-amber-500 bg-amber-50"
                            : "border-amber-300"
                        }`}
                        min="1"
                        max="365"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
