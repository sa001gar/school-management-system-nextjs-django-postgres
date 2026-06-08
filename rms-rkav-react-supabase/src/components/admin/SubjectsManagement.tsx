import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { subjectsApi } from '../../lib/index'
import type { Subject } from '../../lib/types'

export const SubjectsManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    full_marks: 100
  })

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    setLoading(true)
    try {
      const data = await subjectsApi.getAll()
      setSubjects(data)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSubject) {
        await subjectsApi.update(editingSubject.id, formData)
      } else {
        await subjectsApi.create(formData)
      }
      
      setShowForm(false)
      setEditingSubject(null)
      setFormData({ name: '', code: '', full_marks: 100 })
      fetchSubjects()
    } catch (error) {
      console.error('Error saving subject:', error)
      alert('Error saving subject. Please try again.')
    }
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setFormData({
      name: subject.name,
      code: subject.code,
      full_marks: subject.full_marks
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectsApi.delete(id)
        fetchSubjects()
      } catch (error) {
        console.error('Error deleting subject:', error)
        alert('Error deleting subject. Please try again.')
      }
    }
  }

  const filteredSubjects = subjects.filter(subject =>
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
        <h2 className="text-2xl font-bold text-amber-900">Subjects Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
        <input
          type="text"
          placeholder="Search subjects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Code</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Full Marks</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200">
              {filteredSubjects.map((subject, index) => (
                <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                  <td className="px-4 py-3 text-sm font-medium text-amber-900">{subject.name}</td>
                  <td className="px-4 py-3 text-sm text-amber-900">{subject.code}</td>
                  <td className="px-4 py-3 text-sm text-amber-900 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
                      {subject.full_marks}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="p-1 text-amber-600 hover:text-amber-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-amber-900 mb-4">
              {editingSubject ? 'Edit Subject' : 'Add Subject'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Full Marks</label>
                <input
                  type="number"
                  value={formData.full_marks}
                  onChange={(e) => setFormData({ ...formData, full_marks: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  min="1"
                  max="200"
                  required
                />
                <p className="text-xs text-amber-600 mt-1">
                  This will be the default full marks for this subject. Can be overridden by class-specific marks distribution.
                </p>
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
                    setShowForm(false)
                    setEditingSubject(null)
                    setFormData({ name: '', code: '', full_marks: 100 })
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