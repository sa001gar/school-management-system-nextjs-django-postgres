import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, BookOpen, Settings } from 'lucide-react'
import { optionalSubjectsApi, classesApi, classOptionalConfigApi, classOptionalAssignmentsApi } from '../../lib/index'
import type { OptionalSubject, Class, ClassOptionalConfig, ClassOptionalAssignment } from '../../lib/types'

export const OptionalSubjectsManagement: React.FC = () => {
  const [optionalSubjects, setOptionalSubjects] = useState<OptionalSubject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [classConfigs, setClassConfigs] = useState<ClassOptionalConfig[]>([])
  const [classAssignments, setClassAssignments] = useState<ClassOptionalAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState<OptionalSubject | null>(null)
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'subjects' | 'assignments'>('subjects')
  
  const [subjectFormData, setSubjectFormData] = useState({
    name: '',
    code: '',
    default_full_marks: 50
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [subjects, classesData] = await Promise.all([
        optionalSubjectsApi.getAll(),
        classesApi.getAll()
      ])

      setOptionalSubjects(subjects)
      setClasses(classesData)

      // Fetch configs and assignments for all classes
      const configs: ClassOptionalConfig[] = []
      const assignments: ClassOptionalAssignment[] = []
      
      for (const cls of classesData) {
        const config = await classOptionalConfigApi.getByClass(cls.id)
        if (config) configs.push(config)
        const classAssignments = await classOptionalAssignmentsApi.getByClass(cls.id)
        assignments.push(...classAssignments)
      }
      
      setClassConfigs(configs)
      setClassAssignments(assignments)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSubject) {
        await optionalSubjectsApi.update(editingSubject.id, subjectFormData)
      } else {
        await optionalSubjectsApi.create(subjectFormData)
      }
      
      setShowSubjectForm(false)
      setEditingSubject(null)
      setSubjectFormData({ name: '', code: '', default_full_marks: 50 })
      fetchData()
    } catch (error) {
      console.error('Error saving optional subject:', error)
      alert('Error saving optional subject. Please try again.')
    }
  }

  const handleEditSubject = (subject: OptionalSubject) => {
    setEditingSubject(subject)
    setSubjectFormData({
      name: subject.name,
      code: subject.code,
      default_full_marks: subject.default_full_marks
    })
    setShowSubjectForm(true)
  }

  const handleDeleteSubject = async (id: string) => {
    if (confirm('Are you sure you want to delete this optional subject?')) {
      try {
        await optionalSubjectsApi.delete(id)
        fetchData()
      } catch (error) {
        console.error('Error deleting optional subject:', error)
        alert('Error deleting optional subject. Please try again.')
      }
    }
  }

  const toggleClassOptional = async (classId: string) => {
    try {
      const existingConfig = classConfigs.find(c => c.class_id === classId)
      const newValue = !existingConfig?.has_optional

      if (existingConfig) {
        await classOptionalConfigApi.update(existingConfig.id, { has_optional: newValue })
      } else {
        await classOptionalConfigApi.create({ class_id: classId, has_optional: newValue })
      }

      fetchData()
    } catch (error) {
      console.error('Error updating class optional config:', error)
      alert('Error updating class configuration. Please try again.')
    }
  }

  const hasOptional = (classId: string) => {
    return classConfigs.find(c => c.class_id === classId)?.has_optional || false
  }

  const filteredSubjects = optionalSubjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-amber-900">Optional Subjects Management</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAssignmentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Settings className="w-4 h-4" />
            Class Assignment
          </button>
          <button
            onClick={() => setShowSubjectForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            <Plus className="w-4 h-4" />
            Add Optional Subject
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-200">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'subjects'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-amber-500 hover:text-amber-700'
          }`}
        >
          Optional Subjects
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'assignments'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-amber-500 hover:text-amber-700'
          }`}
        >
          Class Configuration
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
        <input
          type="text"
          placeholder="Search optional subjects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Content based on active tab */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Code</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Default Full Marks</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {filteredSubjects.map((subject, index) => (
                  <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                    <td className="px-4 py-3 text-sm font-medium text-amber-900">{subject.name}</td>
                    <td className="px-4 py-3 text-sm text-amber-900">{subject.code}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
                        {subject.default_full_marks}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditSubject(subject)}
                          className="p-1 text-amber-600 hover:text-amber-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="p-1 text-red-600 hover:text-red-800"
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
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="p-4 bg-amber-50 border-b border-amber-200">
            <h3 className="font-semibold text-amber-900">Class Optional Subject Configuration</h3>
            <p className="text-sm text-amber-600 mt-1">
              Enable or disable optional subjects for each class. When enabled, teachers can enter optional subject marks.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Class</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Has Optional Subjects</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {classes.map((cls, index) => (
                  <tr key={cls.id} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                    <td className="px-4 py-3 text-sm font-medium text-amber-900">{cls.name}</td>
                    <td className="px-4 py-3 text-center">
                      {hasOptional(cls.id) ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleClassOptional(cls.id)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          hasOptional(cls.id)
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {hasOptional(cls.id) ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subject Form Modal */}
      {showSubjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-amber-900 mb-4">
              {editingSubject ? 'Edit Optional Subject' : 'Add Optional Subject'}
            </h3>
            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={subjectFormData.name}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={subjectFormData.code}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Default Full Marks</label>
                <input
                  type="number"
                  value={subjectFormData.default_full_marks}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, default_full_marks: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  min="1"
                  max="200"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
                >
                  {editingSubject ? 'Update' : 'Add'} Subject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubjectForm(false)
                    setEditingSubject(null)
                    setSubjectFormData({ name: '', code: '', default_full_marks: 50 })
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
    </div>
  )
}