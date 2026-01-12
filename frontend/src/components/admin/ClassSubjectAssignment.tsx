import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Save, 
  Search, 
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import { classesApi, subjectsApi, classSubjectAssignmentsApi } from '../../lib/index'
import type { Class, Subject, ClassSubjectAssignment as ClassSubjectAssignmentType } from '../../lib/types'

interface ClassSubjectAssignment {
  id: string
  class_id: string
  subject_id: string
  is_required: boolean
  created_at: string
}

interface Props {
  onClose: () => void
}

export const ClassSubjectAssignment: React.FC<Props> = ({ onClose }) => {
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<ClassSubjectAssignment[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchAssignments()
    }
  }, [selectedClass])

  const fetchInitialData = async () => {
    try {
      const [classesData, subjectsData] = await Promise.all([
        classesApi.getAll(),
        subjectsApi.getAll()
      ])

      setClasses(classesData)
      setSubjects(subjectsData)
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    try {
      const data = await classSubjectAssignmentsApi.getByClass(selectedClass)
      // Map the response to match the local interface
      const mappedAssignments = data.map(a => ({
        id: a.id,
        class_id: a.class_id,
        subject_id: a.subject?.id || a.subject_id || '',
        is_required: a.is_required,
        created_at: a.created_at
      }))
      setAssignments(mappedAssignments)
    } catch (error) {
      console.error('Error fetching assignments:', error)
      setAssignments([])
    }
  }

  const isSubjectAssigned = (subjectId: string): boolean => {
    return assignments.some(assignment => assignment.subject_id === subjectId)
  }

  const toggleSubjectAssignment = async (subjectId: string) => {
    if (!selectedClass) return

    try {
      const isAssigned = isSubjectAssigned(subjectId)
      const existingAssignment = assignments.find(a => a.subject_id === subjectId)
      
      if (isAssigned && existingAssignment) {
        // Remove assignment
        await classSubjectAssignmentsApi.delete(existingAssignment.id)
      } else {
        // Add assignment
        await classSubjectAssignmentsApi.create({
          class_id: selectedClass,
          subject_id: subjectId,
          is_required: true
        })
      }

      // Refresh assignments
      await fetchAssignments()
      
      const subject = subjects.find(s => s.id === subjectId)
      setSuccessMessage(
        isAssigned 
          ? `${subject?.name} removed from class`
          : `${subject?.name} assigned to class`
      )
      
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error toggling assignment:', error)
      alert('Error updating assignment. Please try again.')
    }
  }

  const saveAllAssignments = async () => {
    if (!selectedClass) return

    setSaving(true)
    try {
      setSuccessMessage('Subject assignments saved successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving assignments:', error)
      alert('Error saving assignments. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-amber-800">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-amber-600" />
            <h2 className="text-2xl font-bold text-amber-900">Class Subject Assignment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* Class Selection */}
        <div className="p-6 border-b border-amber-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-amber-900 mb-2">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Choose a class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            {selectedClass && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  Search Subjects
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                  <input
                    type="text"
                    placeholder="Search subjects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {!selectedClass ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-amber-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-amber-900 mb-2">Select a Class</h3>
              <p className="text-amber-600">Choose a class to manage its subject assignments.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-medium text-amber-900 mb-2">
                  Managing subjects for: <span className="font-bold">{selectedClassName}</span>
                </h3>
                <p className="text-sm text-amber-700">
                  Click on subjects to assign/unassign them to this class. Assigned subjects will be available for teachers to enter marks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map(subject => {
                  const isAssigned = isSubjectAssigned(subject.id)
                  
                  return (
                    <div
                      key={subject.id}
                      onClick={() => toggleSubjectAssignment(subject.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isAssigned
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : 'border-amber-200 bg-white text-amber-900 hover:border-amber-400 hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{subject.name}</h4>
                          <p className="text-sm opacity-75">Code: {subject.code}</p>
                          <p className="text-sm opacity-75">Full Marks: {subject.full_marks}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {isAssigned ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <Plus className="w-6 h-6 text-amber-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredSubjects.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-amber-300 mx-auto mb-4" />
                  <p className="text-amber-600">No subjects found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedClass && (
          <div className="flex items-center justify-between p-6 border-t border-amber-200">
            <div className="text-sm text-amber-600">
              {assignments.length} subjects assigned to {selectedClassName}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={saveAllAssignments}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}