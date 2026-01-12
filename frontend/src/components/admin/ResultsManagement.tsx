"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Trash2, Edit, Users, BookOpen, Award, ChevronLeft, ChevronRight } from "lucide-react"
import { sessionsApi, classesApi, sectionsApi, studentsApi, studentResultsApi, cocurricularResultsApi } from "../../lib/index"
import type {
  StudentResult,
  Subject,
  Session,
  Class,
  Section,
  StudentCocurricularResult,
  CocurricularSubject,
  Student,
} from "../../lib/types"
import { ResultEditModal } from "./ResultEditModal"

interface StudentWithAllResults {
  id: string
  roll_no: string
  name: string
  class: Class
  section: Section
  session: Session
  results: (StudentResult & { subject: Subject })[]
  cocurricularResults: (StudentCocurricularResult & { cocurricular_subject: CocurricularSubject })[]
  totalMarks: number
  totalFullMarks: number
  percentage: number
  overallGrade: string
}

const ITEMS_PER_PAGE = 20

export const ResultsManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentWithAllResults[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSection, setSelectedSection] = useState<string>("")
  const [sessions, setSessions] = useState<Session[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [editingStudent, setEditingStudent] = useState<StudentWithAllResults | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchSections()
    } else {
      setSections([])
      setSelectedSection("")
    }
  }, [selectedClass])

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [searchTerm, selectedSession, selectedClass, selectedSection])

  useEffect(() => {
    // Fetch data when page or filters change
    fetchStudentsWithResults()
  }, [currentPage, searchTerm, selectedSession, selectedClass, selectedSection])

  const fetchInitialData = async () => {
    try {
      const [sessionsData, classesData] = await Promise.all([
        sessionsApi.getAll(),
        classesApi.getAll(),
      ])

      setSessions(sessionsData)
      setClasses(classesData)
    } catch (error) {
      console.error("Error fetching initial data:", error)
    }
  }

  const fetchSections = async () => {
    try {
      const data = await sectionsApi.getByClass(selectedClass)
      setSections(data)
    } catch (error) {
      console.error("Error fetching sections:", error)
    }
  }

  const fetchStudentsWithResults = async () => {
    setLoading(true)
    try {
      // Build params for API call
      const params: Record<string, string | number> = {
        page: currentPage,
      }
      if (searchTerm.trim()) params.search = searchTerm
      if (selectedSession) params.session_id = selectedSession
      if (selectedClass) params.class_id = selectedClass
      if (selectedSection) params.section_id = selectedSection

      // Fetch students with pagination
      const studentsResponse = await studentsApi.getAll(params as { class_id?: string; section_id?: string; session_id?: string; search?: string; page?: number })
      const studentsData = studentsResponse.results || []
      const count = studentsResponse.count || 0

      // Update pagination info
      setTotalCount(count)
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE))

      if (!studentsData || studentsData.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      // Fetch results for each student
      const studentIds = studentsData.map((s) => s.id)
      
      // Fetch all results and cocurricular results for these students
      const [resultsResponse, cocurricularResponse] = await Promise.all([
        Promise.all(studentIds.map(id => studentResultsApi.getAll({ student_id: id }))),
        Promise.all(studentIds.map(id => cocurricularResultsApi.getAll({ student_id: id }))),
      ])

      // Flatten results
      const allResults = resultsResponse.flatMap(r => r.results || [])
      const allCocurricularResults = cocurricularResponse.flatMap(r => r.results || [])

      // Process and combine data
      const studentsWithResults = studentsData.map((student) => {
        const studentResults = allResults.filter((r) => r.student_id === student.id) || []
        const studentCocurricularResults = allCocurricularResults.filter((r) => r.student_id === student.id) || []

        const totalMarks = studentResults.reduce((sum, result) => sum + (result.total_marks || 0), 0)
        const totalFullMarks = studentResults.reduce((sum, result) => {
          return (
            sum +
            (result.first_summative_full || 0) +
            (result.first_formative_full || 0) +
            (result.second_summative_full || 0) +
            (result.second_formative_full || 0) +
            (result.third_summative_full || 0) +
            (result.third_formative_full || 0)
          )
        }, 0)

        const percentage = totalFullMarks > 0 ? (totalMarks / totalFullMarks) * 100 : 0
        const overallGrade = calculateOverallGrade(percentage)

        return {
          ...student,
          class: student.class_info,
          section: student.section_info,
          session: student.session_info,
          results: studentResults as (StudentResult & { subject: Subject })[],
          cocurricularResults: studentCocurricularResults as (StudentCocurricularResult & { cocurricular_subject: CocurricularSubject })[],
          totalMarks,
          totalFullMarks,
          percentage,
          overallGrade,
        }
      })

      setStudents(studentsWithResults)
    } catch (error) {
      console.error("Error fetching students with results:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateOverallGrade = (percentage: number): string => {
    if (percentage >= 90) return "AA"
    if (percentage >= 75) return "A+"
    if (percentage >= 60) return "A"
    if (percentage >= 45) return "B+"
    if (percentage >= 34) return "B"
    if (percentage >= 25) return "C"
    return "D"
  }

  const handleEdit = (student: StudentWithAllResults) => {
    setEditingStudent(student)
    setShowEditModal(true)
  }

  const handleDelete = async (studentId: string) => {
    if (confirm("Are you sure you want to delete all results for this student? This action cannot be undone.")) {
      try {
        setLoading(true)
        // Find all results for this student and delete them
        const student = students.find(s => s.id === studentId)
        if (student) {
          // Delete all academic results
          await Promise.all(
            student.results.map(result => studentResultsApi.delete(result.id))
          )
          // Delete all cocurricular results
          await Promise.all(
            student.cocurricularResults.map(result => cocurricularResultsApi.delete(result.id))
          )
        }

        // Refresh current page data
        await fetchStudentsWithResults()
      } catch (error) {
        console.error("Error deleting results:", error)
        alert("Error deleting results. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedSession("")
    setSelectedClass("")
    setSelectedSection("")
    setCurrentPage(1)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i)
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i)
        }
      }
    }

    return pages
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl lg:text-2xl font-bold text-amber-900">Results Management</h2>
        <div className="text-sm text-amber-600">{totalCount} students found</div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-professional border-2 border-amber-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <h3 className="text-lg font-semibold text-amber-900">Filters</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-amber-600 hover:text-amber-800 font-medium px-3 py-1 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-900 mb-2">Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Sessions</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-900 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-900 mb-2">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
              className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => fetchStudentsWithResults()}
              disabled={loading}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-amber-700"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-professional border-2 border-amber-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="table-responsive thin-scrollbar">
              <table className="w-full min-w-[600px]">
                <thead className="bg-amber-50 border-b-2 border-amber-200">
                  <tr>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">
                      Student
                    </th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">
                      Roll No
                    </th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">
                      Class Details
                    </th>
                    <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {students.map((student, index) => (
                    <tr key={student.id} className={index % 2 === 0 ? "bg-white" : "bg-amber-50/50"}>
                      <td className="px-2 lg:px-4 py-3 text-sm font-medium text-amber-900">
                        <div>
                          {student.name}
                          <div className="text-xs text-amber-600 mt-1">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-amber-600" />
                                <span>{student.results.length} subjects</span>
                              </div>
                              {student.cocurricularResults.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Award className="w-3 h-3 text-green-600" />
                                  <span className="text-green-700">
                                    {student.cocurricularResults.length} activities
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 lg:px-4 py-3 text-sm text-amber-900">{student.roll_no}</td>
                      <td className="px-2 lg:px-4 py-3 text-sm text-amber-900">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Class:</span>
                            <span>{student.class?.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Section:</span>
                            <span>{student.section?.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Session:</span>
                            <span>{student.session?.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 lg:px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 lg:gap-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                            title="Edit Results"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                            title="Delete All Results"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 lg:px-6 py-4 border-t-2 border-amber-200 gap-4">
                <div className="text-sm text-amber-600">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} results
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-amber-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-1 text-sm rounded transition-colors border ${
                          currentPage === pageNum
                            ? "bg-amber-600 text-white border-amber-700"
                            : "text-amber-600 hover:bg-amber-100 border-amber-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-amber-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {students.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-amber-900 mb-2">No Results Found</h3>
                <p className="text-amber-600">
                  {searchTerm || selectedSession || selectedClass || selectedSection
                    ? "No students match your current filters."
                    : "No student results available. Results will appear here once teachers enter marks."}
                </p>
                {(searchTerm || selectedSession || selectedClass || selectedSection) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors border-2 border-amber-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <ResultEditModal
          student={editingStudent}
          onClose={() => {
            setShowEditModal(false)
            setEditingStudent(null)
          }}
          onSave={() => {
            setShowEditModal(false)
            setEditingStudent(null)
            fetchStudentsWithResults() // Refresh data
          }}
        />
      )}
    </div>
  )
}
