"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Search, Users, Upload, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { studentsApi, classesApi, sectionsApi, sessionsApi } from "../../lib/index"
import type { Student, Class, Section, Session } from "../../lib/types"
import { BulkStudentEntry } from "./BulkStudentEntry"

const ITEMS_PER_PAGE = 20

export const StudentsManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBulkEntry, setShowBulkEntry] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter states
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSection, setSelectedSection] = useState<string>("")
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [formData, setFormData] = useState({
    roll_no: "",
    name: "",
    class_id: "",
    section_id: "",
    session_id: "",
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchSectionsForClass(selectedClass)
    }
  }, [selectedClass])

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [searchTerm, selectedClass, selectedSection, selectedSession])

  useEffect(() => {
    // Fetch data when page or filters change
    fetchStudents()
  }, [currentPage, searchTerm, selectedClass, selectedSection, selectedSession])

  const fetchInitialData = async () => {
    try {
      const [classesData, sectionsData, sessionsData] = await Promise.all([
        classesApi.getAll(),
        sectionsApi.getAll(),
        sessionsApi.getAll(),
      ])

      setClasses(classesData)
      setSections(sectionsData)
      setSessions(sessionsData)
    } catch (error) {
      console.error("Error fetching initial data:", error)
    }
  }

  const fetchSectionsForClass = async (classId: string) => {
    try {
      const data = await sectionsApi.getByClass(classId)
      setSections(data)
    } catch (error) {
      console.error("Error fetching sections:", error)
    }
  }

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params: {
        class_id?: string;
        section_id?: string;
        session_id?: string;
        search?: string;
        page?: number;
      } = { page: currentPage }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      if (selectedClass) {
        params.class_id = selectedClass
      }
      if (selectedSection) {
        params.section_id = selectedSection
      }
      if (selectedSession) {
        params.session_id = selectedSession
      }

      const response = await studentsApi.getAll(params)

      // Update pagination info
      setTotalCount(response.count || 0)
      setTotalPages(Math.ceil((response.count || 0) / ITEMS_PER_PAGE))

      setStudents(response.results || [])
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingStudent) {
        await studentsApi.update(editingStudent.id, formData)
      } else {
        await studentsApi.create(formData)
      }

      setShowForm(false)
      setEditingStudent(null)
      setFormData({ roll_no: "", name: "", class_id: "", section_id: "", session_id: "" })

      // Refresh current page data
      await fetchStudents()
    } catch (error) {
      console.error("Error saving student:", error)
      alert("Error saving student. Please try again.")
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      roll_no: student.roll_no,
      name: student.name,
      class_id: student.class_id || "",
      section_id: student.section_id || "",
      session_id: student.session_id || "",
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await studentsApi.delete(id)

        // Refresh current page data
        await fetchStudents()
      } catch (error) {
        console.error("Error deleting student:", error)
        alert("Error deleting student. Please try again.")
      }
    }
  }

  const clearFilters = () => {
    setSelectedClass("")
    setSelectedSection("")
    setSelectedSession("")
    setSearchTerm("")
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

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || "N/A"
  }

  const getSectionName = (sectionId: string) => {
    return sections.find((s) => s.id === sectionId)?.name || "N/A"
  }

  const getSessionName = (sessionId: string) => {
    return sessions.find((s) => s.id === sessionId)?.name || "N/A"
  }

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-amber-900">Students Management</h2>
          <p className="text-sm text-amber-600 mt-1">{totalCount} students total</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkEntry(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Bulk Entry
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
            <input
              type="text"
              placeholder="Search students by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-amber-200">
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value)
                  setSelectedSection("") // Reset section when class changes
                }}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
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
              <label className="block text-sm font-medium text-amber-900 mb-1">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
              >
                <option value="">All Sections</option>
                {sections
                  .filter((section) => !selectedClass || section.class_id === selectedClass)
                  .map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Session</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Sessions</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Filter Summary */}
        {(selectedClass || selectedSection || selectedSession) && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-amber-700">
                <span className="font-medium">Active Filters:</span>
                {selectedClass && (
                  <span className="ml-2 px-2 py-1 bg-amber-200 rounded text-xs">{getClassName(selectedClass)}</span>
                )}
                {selectedSection && (
                  <span className="ml-2 px-2 py-1 bg-amber-200 rounded text-xs">{getSectionName(selectedSection)}</span>
                )}
                {selectedSession && (
                  <span className="ml-2 px-2 py-1 bg-amber-200 rounded text-xs">{getSessionName(selectedSession)}</span>
                )}
              </div>
              <span className="text-sm text-amber-600">{totalCount} students found</span>
            </div>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-50 border-b border-amber-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Roll No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Section</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Session</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {students.map((student, index) => (
                    <tr key={student.id} className={index % 2 === 0 ? "bg-white" : "bg-amber-50/50"}>
                      <td className="px-4 py-3 text-sm font-medium text-amber-900">{student.roll_no}</td>
                      <td className="px-4 py-3 text-sm text-amber-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-amber-900">{getClassName(student.class_id || "")}</td>
                      <td className="px-4 py-3 text-sm text-amber-900">{getSectionName(student.section_id || "")}</td>
                      <td className="px-4 py-3 text-sm text-amber-900">{getSessionName(student.session_id || "")}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                            title="Delete Student"
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
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-amber-200 gap-4">
                <div className="text-sm text-amber-600">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} students
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
                <h3 className="text-lg font-medium text-amber-900 mb-2">No Students Found</h3>
                <p className="text-amber-600">
                  {searchTerm || selectedClass || selectedSection || selectedSession
                    ? "No students match your current search and filter criteria."
                    : 'No students have been added yet. Click "Add Student" to get started.'}
                </p>
                {(searchTerm || selectedClass || selectedSection || selectedSession) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Single Student Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-amber-900 mb-4">
              {editingStudent ? "Edit Student" : "Add Student"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Roll No</label>
                <input
                  type="text"
                  value={formData.roll_no}
                  onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Class</label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value, section_id: "" })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Section</label>
                <select
                  value={formData.section_id}
                  onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                  required
                  disabled={!formData.class_id}
                >
                  <option value="">Select Section</option>
                  {sections
                    .filter((section) => section.class_id === formData.class_id)
                    .map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Session</label>
                <select
                  value={formData.session_id}
                  onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Select Session</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700">
                  {editingStudent ? "Update" : "Add"} Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingStudent(null)
                    setFormData({ roll_no: "", name: "", class_id: "", section_id: "", session_id: "" })
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Entry Modal */}
      {showBulkEntry && (
        <BulkStudentEntry
          onClose={() => {
            setShowBulkEntry(false)
            fetchStudents() // Refresh data after bulk entry
          }}
        />
      )}
    </div>
  )
}
