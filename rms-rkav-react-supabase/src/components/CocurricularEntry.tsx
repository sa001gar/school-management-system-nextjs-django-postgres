"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Save, Award } from "lucide-react"
import { studentsApi, cocurricularResultsApi } from "../lib/index"
import type { Student, StudentCocurricularResult, CocurricularSubject } from "../lib/types"

interface Props {
  sessionId: string
  classId: string
  sectionId: string
  cocurricularSubjects: CocurricularSubject[]
}

interface StudentWithCocurricularResults extends Student {
  cocurricularResults: (StudentCocurricularResult & { cocurricular_subject: CocurricularSubject })[]
}

// Store marks data separately to preserve input values
interface MarksData {
  [studentId: string]: {
    [subjectId: string]: {
      // subjectId here should be the UUID from CocurricularSubject
      first_term_marks: number
      second_term_marks: number
      final_term_marks: number
      full_marks: number
    }
  }
}

export const CocurricularEntry: React.FC<Props> = ({ sessionId, classId, sectionId, cocurricularSubjects }) => {
  const [students, setStudents] = useState<StudentWithCocurricularResults[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [marksData, setMarksData] = useState<MarksData>({}) // Use {} instead of \{\}

  // Default full marks for each subject
  const [subjectFullMarks, setSubjectFullMarks] = useState<{ [subjectId: string]: number }>({}) // Use {} instead of \{\}

  // Convert marks to grade (for internal storage compatibility)
  const marksToGrade = useCallback((marks: number, fullMarks: number): string => {
    const percentage = (marks / fullMarks) * 100
    if (percentage >= 90) return "AA"
    if (percentage >= 80) return "A+"
    if (percentage >= 70) return "A"
    if (percentage >= 60) return "B+"
    if (percentage >= 50) return "B"
    if (percentage >= 40) return "C"
    return "D"
  }, [])

  // Convert grade to approximate marks (for reverse engineering)
  const gradeToMarks = useCallback((grade: string, fullMarks: number): number => {
    const gradeValues: { [key: string]: number } = { AA: 95, "A+": 85, A: 75, "B+": 65, B: 55, C: 45, D: 35 }
    const percentage = gradeValues[grade] || 0
    return Math.round((percentage / 100) * fullMarks)
  }, [])

  // Load full marks from localStorage
  useEffect(() => {
    const savedFullMarks: { [subjectId: string]: number } = {}
    cocurricularSubjects.forEach((subject) => {
      // Use cocurricularSubjects prop
      const saved = localStorage.getItem(`cocurricularFullMarks_${subject.id}_${sessionId}_${classId}_${sectionId}`)
      savedFullMarks[subject.id] = saved ? Number.parseInt(saved) : 50 // Default 50 marks
    })
    setSubjectFullMarks(savedFullMarks)
  }, [sessionId, classId, sectionId, cocurricularSubjects]) // Add cocurricularSubjects to dependencies

  // Save full marks to localStorage when changed
  const handleFullMarksChange = useCallback(
    (subjectId: string, fullMarks: number) => {
      setSubjectFullMarks((prev) => ({
        ...prev,
        [subjectId]: fullMarks,
      }))
      localStorage.setItem(
        `cocurricularFullMarks_${subjectId}_${sessionId}_${classId}_${sectionId}`,
        fullMarks.toString(),
      )
    },
    [sessionId, classId, sectionId],
  )

  const fetchStudentsAndResults = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch students
      const studentsData = await studentsApi.getByFilters(sessionId, classId, sectionId)

      // Fetch existing co-curricular results
      const resultsData = await cocurricularResultsApi.getAllUnpaginated({
        session_id: sessionId
      })

      // Combine students with their results
      const studentsWithResults =
        studentsData?.map((student) => {
          const studentResults = resultsData?.filter((r) => r.student_id === student.id) || []
          return { ...student, cocurricularResults: studentResults as any }
        }) || []
      setStudents(studentsWithResults)

      // Initialize marks data from existing results or defaults
      const initialMarksData: MarksData = {}
      studentsWithResults.forEach((student) => {
        initialMarksData[student.id] = {}
        cocurricularSubjects.forEach((subject) => {
          // Use cocurricularSubjects prop here
          // Try to find existing result by matching subject ID (UUID)
          const existingResult = student.cocurricularResults.find((r) => r.cocurricular_subject?.id === subject.id)

          if (existingResult) {
            // Use marks columns if available, otherwise convert from grades
            const firstMarks =
              existingResult.first_term_marks !== undefined
                ? existingResult.first_term_marks
                : isNaN(Number.parseInt(existingResult.first_term_grade))
                  ? gradeToMarks(existingResult.first_term_grade, subjectFullMarks[subject.id] || 50)
                  : Number.parseInt(existingResult.first_term_grade)
            const secondMarks =
              existingResult.second_term_marks !== undefined
                ? existingResult.second_term_marks
                : isNaN(Number.parseInt(existingResult.second_term_grade))
                  ? gradeToMarks(existingResult.second_term_grade, subjectFullMarks[subject.id] || 50)
                  : Number.parseInt(existingResult.second_term_grade)
            const finalMarks =
              existingResult.final_term_marks !== undefined
                ? existingResult.final_term_marks
                : isNaN(Number.parseInt(existingResult.final_term_grade))
                  ? gradeToMarks(existingResult.final_term_grade, subjectFullMarks[subject.id] || 50)
                  : Number.parseInt(existingResult.final_term_grade)

            initialMarksData[student.id][subject.id] = {
              // Use subject.id (UUID) as key
              first_term_marks: firstMarks,
              second_term_marks: secondMarks,
              final_term_marks: finalMarks,
              full_marks: existingResult.full_marks || subjectFullMarks[subject.id] || 50,
            }
          } else {
            initialMarksData[student.id][subject.id] = {
              // Use subject.id (UUID) as key
              first_term_marks: 0,
              second_term_marks: 0,
              final_term_marks: 0,
              full_marks: subjectFullMarks[subject.id] || 50,
            }
          }
        })
      })
      setMarksData(initialMarksData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }, [sessionId, classId, sectionId, cocurricularSubjects, subjectFullMarks, gradeToMarks])

  useEffect(() => {
    if (sessionId && classId && sectionId) {
      fetchStudentsAndResults()
    }
  }, [sessionId, classId, sectionId, fetchStudentsAndResults])

  const handleMarksChange = useCallback(
    (studentId: string, subjectId: string, field: string, value: string) => {
      const numValue = value === "" ? 0 : Number.parseInt(value)

      // Update marks data
      setMarksData((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [subjectId]: {
            // subjectId here is the UUID
            ...prev[studentId]?.[subjectId],
            [field]: numValue,
            full_marks: subjectFullMarks[subjectId] || 50,
          },
        },
      }))

      setStudents((prev) =>
        prev.map((student) => {
          if (student.id === studentId) {
            const existingResults = [...student.cocurricularResults]
            const subject = cocurricularSubjects.find((s) => s.id === subjectId) // Find subject by UUID
            if (!subject) return student

            // Find existing result by subject ID (UUID) or create new one
            const resultIndex = existingResults.findIndex((r) => r.cocurricular_subject?.id === subject.id)

            if (resultIndex >= 0) {
              // Update existing result - store marks as string in grade fields
              const updatedResult = { ...existingResults[resultIndex] }

              const currentMarks = marksData[studentId]?.[subjectId] || {}
              const firstMarks = field === "first_term_marks" ? numValue : currentMarks.first_term_marks || 0
              const secondMarks = field === "second_term_marks" ? numValue : currentMarks.second_term_marks || 0
              const finalMarks = field === "final_term_marks" ? numValue : currentMarks.final_term_marks || 0

              // Store marks as strings in grade fields for compatibility
              updatedResult.first_term_grade = firstMarks.toString()
              updatedResult.second_term_grade = secondMarks.toString()
              updatedResult.final_term_grade = finalMarks.toString()

              // Calculate overall grade based on average marks
              const avgMarks = (firstMarks + secondMarks + finalMarks) / 3
              updatedResult.overall_grade = marksToGrade(avgMarks, subjectFullMarks[subjectId] || 50)

              existingResults[resultIndex] = updatedResult
            } else {
              // Create new result
              const newResult: StudentCocurricularResult & { cocurricular_subject: CocurricularSubject } = {
                id: "",
                student_id: studentId,
                cocurricular_subject_id: subject.id,
                session_id: sessionId,
                first_term_marks: field === "first_term_marks" ? numValue : 0,
                second_term_marks: field === "second_term_marks" ? numValue : 0,
                final_term_marks: field === "final_term_marks" ? numValue : 0,
                full_marks: subjectFullMarks[subjectId] || 50,
                total_marks: 0,
                first_term_grade: field === "first_term_marks" ? numValue.toString() : "0",
                second_term_grade: field === "second_term_marks" ? numValue.toString() : "0",
                final_term_grade: field === "final_term_marks" ? numValue.toString() : "0",
                overall_grade: "A",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                cocurricular_subject: {
                  id: subject.id,
                  name: subject.name,
                  code: subject.code,
                  created_at: "",
                },
              }
              existingResults.push(newResult)
            }
            return { ...student, cocurricularResults: existingResults }
          }
          return student
        }),
      )
    },
    [marksData, sessionId, cocurricularSubjects, subjectFullMarks, marksToGrade],
  )

  const saveResults = useCallback(async () => {
    setSaving(true)
    try {
      // Prepare results to save
      const resultsToSave = []

      for (const student of students) {
        for (const subject of cocurricularSubjects) {
          // Use cocurricularSubjects prop here
          const studentMarks = marksData[student.id]?.[subject.id]
          if (
            studentMarks &&
            (studentMarks.first_term_marks > 0 ||
              studentMarks.second_term_marks > 0 ||
              studentMarks.final_term_marks > 0)
          ) {
            const avgMarks =
              (studentMarks.first_term_marks + studentMarks.second_term_marks + studentMarks.final_term_marks) / 3

            resultsToSave.push({
              student_id: student.id,
              cocurricular_subject_id: subject.id, // This is the UUID from the prop
              session_id: sessionId,
              first_term_marks: studentMarks.first_term_marks,
              second_term_marks: studentMarks.second_term_marks,
              final_term_marks: studentMarks.final_term_marks,
              full_marks: studentMarks.full_marks,
              first_term_grade: studentMarks.first_term_marks.toString(),
              second_term_grade: studentMarks.second_term_marks.toString(),
              final_term_grade: studentMarks.final_term_marks.toString(),
              overall_grade: marksToGrade(avgMarks, studentMarks.full_marks),
            })
          }
        }
      }

      if (resultsToSave.length > 0) {
        await cocurricularResultsApi.bulkUpsert(resultsToSave)
      }
      alert("Co-curricular results saved successfully!")

      // Refresh data to show saved results
      await fetchStudentsAndResults()
    } catch (error) {
      console.error("Error saving results:", error)
      alert("Error saving results. Please try again.")
    } finally {
      setSaving(false)
    }
  }, [students, marksData, sessionId, cocurricularSubjects, marksToGrade, fetchStudentsAndResults])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-amber-800">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-amber-900">Co-curricular Activities</h2>
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
          {cocurricularSubjects.map(
            (
              subject, // Use cocurricularSubjects prop here
            ) => (
              <div key={subject.id}>
                <label className="block text-sm font-medium text-amber-900 mb-2">{subject.name} - Full Marks</label>
                <input
                  type="number"
                  value={subjectFullMarks[subject.id] || 50}
                  onChange={(e) => handleFullMarksChange(subject.id, Number.parseInt(e.target.value) || 50)}
                  className="w-32 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  min="1"
                  max="100"
                />
                <p className="text-sm text-amber-600 mt-1">Current full marks for {subject.name}</p>
              </div>
            ),
          )}
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
                {cocurricularSubjects.map(
                  (
                    subject, // Use cocurricularSubjects prop here
                  ) => (
                    <th
                      key={subject.id}
                      className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider"
                    >
                      {subject.name}
                      <div className="text-xs font-normal mt-1">
                        <span className="block">1st | 2nd | Final | Total</span>
                        <span className="block">({subjectFullMarks[subject.id] || 50} marks each)</span>
                      </div>
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200">
              {students.map((student, index) => (
                <tr key={student.id} className={index % 2 === 0 ? "bg-white" : "bg-amber-50/50"}>
                  <td className="px-4 py-3 text-sm font-medium text-amber-900">{student.roll_no}</td>
                  <td className="px-4 py-3 text-sm text-amber-900">{student.name}</td>
                  {cocurricularSubjects.map((subject) => {
                    // Use cocurricularSubjects prop here
                    const studentMarks = marksData[student.id]?.[subject.id] || {}
                    const fullMarks = subjectFullMarks[subject.id] || 50
                    const totalMarks =
                      (studentMarks.first_term_marks || 0) +
                      (studentMarks.second_term_marks || 0) +
                      (studentMarks.final_term_marks || 0)
                    return (
                      <td key={subject.id} className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* First Term Marks */}
                          <input
                            type="number"
                            value={studentMarks.first_term_marks || ""}
                            onChange={(e) =>
                              handleMarksChange(student.id, subject.id, "first_term_marks", e.target.value)
                            }
                            className="w-12 px-1 py-1 text-xs text-center border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                            min="0"
                            max={fullMarks}
                            placeholder="0"
                          />
                          <span className="text-amber-400">|</span>
                          {/* Second Term Marks */}
                          <input
                            type="number"
                            value={studentMarks.second_term_marks || ""}
                            onChange={(e) =>
                              handleMarksChange(student.id, subject.id, "second_term_marks", e.target.value)
                            }
                            className="w-12 px-1 py-1 text-xs text-center border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                            min="0"
                            max={fullMarks}
                            placeholder="0"
                          />
                          <span className="text-amber-400">|</span>
                          {/* Final Term Marks */}
                          <input
                            type="number"
                            value={studentMarks.final_term_marks || ""}
                            onChange={(e) =>
                              handleMarksChange(student.id, subject.id, "final_term_marks", e.target.value)
                            }
                            className="w-12 px-1 py-1 text-xs text-center border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                            min="0"
                            max={fullMarks}
                            placeholder="0"
                          />
                          <span className="text-amber-400">|</span>
                          {/* Total Marks (Read-only) */}
                          <span className="w-12 px-1 py-1 text-xs text-center bg-amber-50 font-medium rounded border">
                            {totalMarks}
                          </span>
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
            <h3 className="font-medium text-amber-900 mb-1">Co-curricular Activities Entry</h3>
            <p className="text-sm text-amber-700">
              Enter marks for Health & Physical Education and Art Education. Full marks for each subject can be
              customized above. The total marks will be calculated automatically and displayed on the marksheet.
            </p>
            <div className="mt-2 text-xs text-amber-600">
              <strong>Subjects:</strong> Health & Physical Education, Art Education |<strong> Terms:</strong> 1st Term,
              2nd Term, Final Term |<strong> Display:</strong> Marks will be shown on marksheet instead of grades
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
