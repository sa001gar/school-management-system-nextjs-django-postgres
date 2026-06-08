"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Save, Award, BookOpen } from "lucide-react"
import { studentsApi, classOptionalAssignmentsApi, optionalResultsApi } from "../lib/index"
import type { Student, OptionalSubject as BaseOptionalSubject, StudentOptionalResult } from "../lib/types"

interface Props {
  sessionId: string
  classId: string
  sectionId: string
}

interface OptionalSubject extends BaseOptionalSubject {
  full_marks: number
}

interface StudentWithOptionalResults extends Student {
  optionalResults: StudentOptionalResult[]
}

// Store marks data separately to preserve input values
interface MarksData {
  [studentId: string]: {
    [subjectId: string]: {
      obtained_marks: number
      full_marks: number
      grade: string
    }
  }
}

export const OptionalFieldMarksEntry: React.FC<Props> = ({ sessionId, classId, sectionId }) => {
  const [students, setStudents] = useState<StudentWithOptionalResults[]>([])
  const [optionalSubjects, setOptionalSubjects] = useState<OptionalSubject[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true) // Initialized to true
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [saving, setSaving] = useState(false)
  const [marksData, setMarksData] = useState<MarksData>({})
  // Default full marks for each subject
  const [subjectFullMarks, setSubjectFullMarks] = useState<{ [subjectId: string]: number }>({})

  // Convert marks to grade
  const marksToGrade = useCallback((obtainedMarks: number, fullMarks: number): string => {
    if (fullMarks === 0) return "D"
    const percentage = (obtainedMarks / fullMarks) * 100
    if (percentage >= 90) return "AA"
    if (percentage >= 80) return "A+"
    if (percentage >= 70) return "A"
    if (percentage >= 60) return "B+"
    if (percentage >= 50) return "B"
    if (percentage >= 40) return "C"
    return "D"
  }, [])

  // Fetch optional subjects
  const fetchOptionalSubjects = useCallback(async () => {
    setLoadingSubjects(true)
    try {
      const assignmentsData = await classOptionalAssignmentsApi.getByClass(classId)

      const subjects =
        assignmentsData?.map((assignment) => ({
          id: assignment.optional_subject?.id || '',
          name: assignment.optional_subject?.name || '',
          code: assignment.optional_subject?.code || '',
          default_full_marks: assignment.optional_subject?.default_full_marks || 50,
          full_marks: assignment.full_marks || 50,
          created_at: assignment.optional_subject?.created_at || '',
        })) || []
      setOptionalSubjects(subjects)
    } catch (error) {
      console.error("Error fetching optional subjects:", error)
      setOptionalSubjects([])
    } finally {
      setLoadingSubjects(false)
    }
  }, [classId])

  // Fetch students and their existing optional results
  const fetchStudentsAndResults = useCallback(async () => {
    setLoadingStudents(true)
    console.log("Fetching students and results for session:", sessionId, "class:", classId, "section:", sectionId)
    try {
      const studentsData = await studentsApi.getByFilters(sessionId, classId, sectionId)
      console.log("Fetched studentsData:", studentsData)

      const resultsData = await optionalResultsApi.getAllUnpaginated({
        session_id: sessionId
      })
      console.log("Fetched resultsData (student_optional_results):", resultsData)

      const studentsWithResults =
        studentsData?.map((student) => {
          const studentResults = resultsData?.filter((r) => r.student_id === student.id) || []
          return { ...student, optionalResults: studentResults }
        }) || []
      setStudents(studentsWithResults)
    } catch (error) {
      console.error("Error fetching student data:", error)
    } finally {
      setLoadingStudents(false)
    }
  }, [sessionId, classId, sectionId])

  // Effect to fetch subjects when classId changes
  useEffect(() => {
    if (classId) {
      fetchOptionalSubjects()
    }
  }, [classId, fetchOptionalSubjects])

  // Effect to fetch students when session, class, or section changes
  useEffect(() => {
    if (sessionId && classId && sectionId) {
      fetchStudentsAndResults()
    }
  }, [sessionId, classId, sectionId, fetchStudentsAndResults])

  // Load full marks from localStorage when subjects change
  useEffect(() => {
    if (optionalSubjects.length > 0) {
      const savedFullMarks: { [subjectId: string]: number } = {}
      optionalSubjects.forEach((subject) => {
        const saved = localStorage.getItem(`optionalFullMarks_${subject.id}_${sessionId}_${classId}_${sectionId}`)
        savedFullMarks[subject.id] = saved ? Number.parseInt(saved) : subject.full_marks || 50
      })
      setSubjectFullMarks(savedFullMarks)
    }
  }, [optionalSubjects, sessionId, classId, sectionId])

  // Initialize marksData from existing results or defaults once both students and subjects are loaded
  useEffect(() => {
    console.log("Initializing marksData...")
    console.log("Students for initialization:", students)
    console.log("Optional Subjects for initialization:", optionalSubjects)

    if (students.length === 0 || optionalSubjects.length === 0) {
      setMarksData({}) // Clear if no students or subjects
      return
    }

    const initialMarksData: MarksData = {}
    students.forEach((student) => {
      initialMarksData[student.id] = {}
      optionalSubjects.forEach((subject) => {
        // Find existing result by matching optional_subject_id with subject.id
        const existingResult = student.optionalResults.find((r) => r.optional_subject_id === subject.id)
        console.log(`Student: ${student.name} (${student.id}), Subject: ${subject.name} (${subject.id})`)
        console.log("Existing result found:", existingResult)

        if (existingResult) {
          initialMarksData[student.id][subject.id] = {
            obtained_marks: existingResult.obtained_marks,
            full_marks: existingResult.full_marks,
            grade: existingResult.grade,
          }
        } else {
          initialMarksData[student.id][subject.id] = {
            obtained_marks: 0,
            full_marks: subjectFullMarks[subject.id] || subject.full_marks || 50,
            grade: "D",
          }
        }
        console.log("Initial marks for this student/subject:", initialMarksData[student.id][subject.id])
      })
    })
    setMarksData(initialMarksData)
    console.log("Final marksData after initialization:", initialMarksData)
  }, [students, optionalSubjects, subjectFullMarks]) // Dependencies for marksData initialization

  // Save full marks to localStorage when changed
  const handleFullMarksChange = useCallback(
    (subjectId: string, newFullMarks: number) => {
      setSubjectFullMarks((prev) => ({
        ...prev,
        [subjectId]: newFullMarks,
      }))
      localStorage.setItem(
        `optionalFullMarks_${subjectId}_${sessionId}_${classId}_${sectionId}`,
        newFullMarks.toString(),
      )
      // Update existing marks data with new full marks and recalculate grade
      setMarksData((prev) => {
        const updatedMarksData: MarksData = { ...prev }
        Object.keys(prev).forEach((studentId) => {
          if (prev[studentId][subjectId]) {
            const currentData = prev[studentId][subjectId]
            updatedMarksData[studentId][subjectId] = {
              ...currentData,
              full_marks: newFullMarks,
              grade: marksToGrade(currentData.obtained_marks, newFullMarks),
            }
          }
        })
        return updatedMarksData
      })
    },
    [sessionId, classId, sectionId, marksToGrade],
  )

  const handleMarksChange = useCallback(
    (studentId: string, subjectId: string, value: string) => {
      const numValue = value === "" ? 0 : Number.parseInt(value)
      const fullMarks = subjectFullMarks[subjectId] || 50
      const grade = marksToGrade(numValue, fullMarks)

      setMarksData((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [subjectId]: {
            obtained_marks: numValue,
            full_marks: fullMarks,
            grade: grade,
          },
        },
      }))
    },
    [marksToGrade, subjectFullMarks],
  )

  const saveResults = useCallback(async () => {
    setSaving(true)
    console.log("Saving results...")
    console.log("Marks data to be saved:", marksData)
    try {
      const resultsToSave = []
      for (const student of students) {
        for (const subject of optionalSubjects) {
          const studentMarks = marksData[student.id]?.[subject.id]
          // Only push if marksData exists for this student/subject and obtained_marks is >= 0
          // This ensures that explicitly set 0s are saved, and existing data is not lost.
          if (studentMarks && studentMarks.obtained_marks >= 0) {
            const resultToSave = {
              student_id: student.id,
              optional_subject_id: subject.id,
              session_id: sessionId,
              obtained_marks: studentMarks.obtained_marks,
              full_marks: studentMarks.full_marks,
              grade: studentMarks.grade,
            }
            resultsToSave.push(resultToSave)
          }
        }
      }
      console.log("Results to be upserted:", resultsToSave)

      if (resultsToSave.length > 0) {
        await optionalResultsApi.bulkUpsert(resultsToSave)
      }
      alert("Optional subject results saved successfully!")
      // Re-fetch all data to ensure UI is fully updated with saved results
      await Promise.all([fetchStudentsAndResults(), fetchOptionalSubjects()])
    } catch (error) {
      console.error("Error saving results:", error)
      alert("Error saving results. Please try again.")
    } finally {
      setSaving(false)
    }
  }, [students, marksData, sessionId, optionalSubjects, fetchStudentsAndResults, fetchOptionalSubjects])

  if (loadingStudents || loadingSubjects) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-amber-800">Loading data...</p>
        </div>
      </div>
    )
  }

  if (optionalSubjects.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-amber-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-amber-900 mb-2">No Optional Subjects</h3>
        <p className="text-amber-600">No optional subjects are assigned to this class.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-amber-900">Optional Subjects</h2>
        <button
          onClick={saveResults}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Results"}
        </button>
      </div>

      {/* Full Marks Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
        <h3 className="text-lg font-semibold text-amber-900 mb-4">Full Marks Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {optionalSubjects.map((subject) => (
            <div key={subject.id}>
              <label className="block text-sm font-medium text-amber-900 mb-2">{subject.name} - Full Marks</label>
              <input
                type="number"
                value={subjectFullMarks[subject.id] || subject.full_marks || 50}
                onChange={(e) => handleFullMarksChange(subject.id, Number.parseInt(e.target.value) || 50)}
                className="w-32 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                min="1"
                max="100"
              />
              <p className="text-sm text-amber-600 mt-1">Current full marks for {subject.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                  Roll No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider min-w-48">
                  Student Name
                </th>
                {optionalSubjects.map((subject) => (
                  <th
                    key={subject.id}
                    className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider"
                  >
                    {subject.name}
                    <div className="text-xs font-normal mt-1">
                      <span className="block">Obtained | Grade</span>
                      <span className="block">({subjectFullMarks[subject.id] || subject.full_marks || 50} marks)</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200">
              {students.map((student, index) => (
                <tr key={student.id} className={index % 2 === 0 ? "bg-white" : "bg-amber-50/50"}>
                  <td className="px-4 py-3 text-sm font-medium text-amber-900">{student.roll_no}</td>
                  <td className="px-4 py-3 text-sm text-amber-900">{student.name}</td>
                  {optionalSubjects.map((subject) => {
                    const studentMarks = marksData[student.id]?.[subject.id] || {
                      obtained_marks: 0,
                      full_marks: subjectFullMarks[subject.id] || subject.full_marks || 50,
                      grade: "D",
                    }
                    const fullMarks = subjectFullMarks[subject.id] || subject.full_marks || 50
                    const percentage =
                      fullMarks > 0 ? ((studentMarks.obtained_marks / fullMarks) * 100).toFixed(1) : "0.0"
                    return (
                      <td key={subject.id} className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            {/* Obtained Marks Input */}
                            <input
                              type="number"
                              value={studentMarks.obtained_marks || ""}
                              onChange={(e) => handleMarksChange(student.id, subject.id, e.target.value)}
                              className="w-16 px-2 py-1 text-sm text-center border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                              min="0"
                              max={fullMarks}
                              placeholder="0"
                            />
                            <span className="text-amber-400">|</span>
                            {/* Grade Display */}
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${
                                studentMarks.grade === "AA" || studentMarks.grade === "A+"
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : studentMarks.grade === "A" || studentMarks.grade === "B+"
                                    ? "bg-blue-100 text-blue-800 border-blue-300"
                                    : studentMarks.grade === "B" || studentMarks.grade === "C"
                                      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                      : "bg-red-100 text-red-800 border-red-300"
                              }`}
                            >
                              {studentMarks.grade}
                            </span>
                          </div>
                          {/* Percentage Display */}
                          <span className="text-xs text-amber-600">{percentage}%</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900 mb-1">Optional Subject Entry</h3>
            <p className="text-sm text-amber-700">
              Enter marks for optional subjects assigned to this class. Full marks can be customized above. Grades are
              automatically calculated based on percentage and will be displayed on the marksheet.
            </p>
            <div className="mt-2 text-xs text-amber-600">
              <strong>Grade Scale:</strong> AA (90-100%) | A+ (80-89%) | A (70-79%) | B+ (60-69%) | B (50-59%) | C
              (40-49%) | D (Below 40%)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
