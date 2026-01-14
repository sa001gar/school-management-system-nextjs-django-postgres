"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  X,
  Clock,
} from "lucide-react";
import { sessionsApi } from "@/lib/api/core";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Session } from "@/types";

export default function SessionsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [lockConfirmation, setLockConfirmation] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_active: false,
  });

  // Fetch Sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: sessionsApi.getAll,
  });

  // Mutations
  const createSessionMutation = useMutation({
    mutationFn: sessionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session created successfully");
      setShowCreateModal(false);
      setFormData({ name: "", start_date: "", end_date: "", is_active: false });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create session");
    },
  });

  const activateSessionMutation = useMutation({
    mutationFn: (id: string) => sessionsApi.update(id, { is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session activated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to activate session");
    },
  });

  const lockSessionMutation = useMutation({
    mutationFn: sessionsApi.lock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session locked successfully");
      setShowLockModal(false);
      setSelectedSession(null);
      setLockConfirmation("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to lock session");
    },
  });

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    createSessionMutation.mutate(formData);
  };

  const handleLockSession = () => {
    if (selectedSession && lockConfirmation === selectedSession.name) {
      lockSessionMutation.mutate(selectedSession.id);
    }
  };

  const openLockModal = (session: Session) => {
    setSelectedSession(session);
    setShowLockModal(true);
    setLockConfirmation("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Session Management
          </h1>
          <p className="text-gray-500">
            Manage academic sessions and fiscal years
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4">
        <div className="p-2 bg-blue-100 rounded-lg h-fit">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-blue-900">About Session Locking</h3>
          <p className="text-sm text-blue-700 mt-1 leading-relaxed">
            Locking a session prevents any further modifications to academic
            records (such as marks, attendance, and results). This is typically
            done after the academic year is concluded and results are published.
            <strong className="block mt-1">
              Note: This action ensures historical data integrity.
            </strong>
          </p>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${
              session.is_active
                ? "border-green-500/50 ring-1 ring-green-500/20"
                : session.is_locked
                ? "border-red-200 bg-red-50/10"
                : "border-gray-100"
            }`}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {session.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(session.start_date).getFullYear()} -{" "}
                      {new Date(session.end_date).getFullYear()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {session.is_active && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  )}
                  {session.is_locked && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Start Date</span>
                  <span className="font-medium text-gray-900">
                    {new Date(session.start_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">End Date</span>
                  <span className="font-medium text-gray-900">
                    {new Date(session.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex gap-2">
              {!session.is_active && !session.is_locked && (
                <button
                  onClick={() => activateSessionMutation.mutate(session.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-green-200 text-green-700 text-sm font-medium rounded-lg hover:bg-green-50 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Set Active
                </button>
              )}
              {!session.is_locked && (
                <button
                  onClick={() => openLockModal(session)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Lock
                </button>
              )}
              {session.is_locked && (
                <div className="w-full py-1.5 text-center text-sm text-gray-400 font-medium bg-gray-50 rounded-lg border border-gray-100 cursor-not-allowed">
                  Session Locked
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && !isLoading && (
        <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No Sessions Found
          </h3>
          <p className="text-gray-500 mb-6">
            Create a new academic session to get started.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            <Plus className="w-4 h-4" />
            Create First Session
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">
                Create New Session
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024-2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <label
                  htmlFor="isActive"
                  className="text-sm text-gray-700 select-none cursor-pointer"
                >
                  Set as current active session
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSessionMutation.isPending}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createSessionMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lock Confirmation Modal */}
      {showLockModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-red-900">
                  Lock Session
                </h2>
              </div>
              <button
                onClick={() => setShowLockModal(false)}
                className="text-red-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  Are you sure you want to lock the session{" "}
                  <span className="font-bold text-gray-900">
                    "{selectedSession.name}"
                  </span>
                  ?
                </p>
                <p className="text-red-600 font-medium">
                  This action is irreversible. Once locked:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Marks cannot be modified</li>
                  <li>Attendance cannot be changed</li>
                  <li>Grading records become permanent</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type session name to confirm:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={selectedSession.name}
                    className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    value={lockConfirmation}
                    onChange={(e) => setLockConfirmation(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLockModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLockSession}
                  disabled={
                    lockConfirmation !== selectedSession.name ||
                    lockSessionMutation.isPending
                  }
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-red-200"
                >
                  {lockSessionMutation.isPending
                    ? "Locking..."
                    : "Lock Session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
