import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Key, Mail, BookOpen } from 'lucide-react'
import { teacherApi } from '../../lib/authApi'
import type { Teacher } from '../../lib/types'
import { ClassSubjectAssignment } from './ClassSubjectAssignment'

export const TeachersManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showSubjectAssignment, setShowSubjectAssignment] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: ''
  })

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    setLoading(true)
    try {
      const data = await teacherApi.getAll()
      if (data) setTeachers(data)
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTeacher) {
        // Update existing teacher
        await teacherApi.update(editingTeacher.id, {
          email: formData.email,
          name: formData.name
        })
        
        alert('Teacher updated successfully!')
      } else {
        // Create new teacher
        await teacherApi.create({
          email: formData.email,
          password: formData.password,
          name: formData.name
        })
        
        alert('Teacher created successfully! They can now log in with their email and password.')
      }
      
      setShowForm(false)
      setEditingTeacher(null)
      setFormData({ email: '', name: '', password: '' })
      fetchTeachers()
      
    } catch (error: any) {
      console.error('Error saving teacher:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Error saving teacher. Please try again.'
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
      } else if (error.message?.includes('User already registered') || error.message?.includes('already exists')) {
        errorMessage = 'A user with this email already exists.'
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.message?.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.'
      } else if (error.message?.includes('duplicate key')) {
        errorMessage = 'A teacher with this email already exists.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    }
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      email: teacher.email,
      name: teacher.name,
      password: ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this teacher? This will also remove their login access.')) {
      try {
        await teacherApi.delete(id)
        fetchTeachers()
        alert('Teacher deleted successfully.')
      } catch (error: any) {
        console.error('Error deleting teacher:', error)
        alert(`Error deleting teacher: ${error.message || 'Please try again.'}`)
      }
    }
  }

  const handleResetPassword = async (teacher: Teacher) => {
    if (confirm(`Send password reset email to ${teacher.email}?`)) {
      try {
        await teacherApi.resetPassword(teacher.id)
        
        alert(`Password reset email sent to ${teacher.email}`)
      } catch (error: any) {
        console.error('Error sending reset email:', error)
        alert(`Error sending password reset email: ${error.message || 'Please try again.'}`)
      }
    }
  }

  const handleChangePassword = async (teacher: Teacher) => {
    alert('Password changes must be done through the reset password email option for security reasons.')
  }

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-amber-900">Teachers Management</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSubjectAssignment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Subject Assignment
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
        <input
          type="text"
          placeholder="Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl shadow-professional border-2 border-amber-200 overflow-hidden">
        <div className="table-responsive thin-scrollbar">
          <table className="w-full min-w-[600px]">
            <thead className="bg-amber-50 border-b-2 border-amber-200">
              <tr>
                <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Name</th>
                <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Email</th>
                <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase mobile-hidden">Created At</th>
                <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200">
              {filteredTeachers.map((teacher, index) => (
                <tr key={teacher.id} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                  <td className="px-2 lg:px-4 py-3 text-sm font-medium text-amber-900">{teacher.name}</td>
                  <td className="px-2 lg:px-4 py-3 text-sm text-amber-900">{teacher.email}</td>
                  <td className="px-2 lg:px-4 py-3 text-sm text-amber-900 mobile-hidden">{new Date(teacher.created_at).toLocaleDateString()}</td>
                  <td className="px-2 lg:px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 lg:gap-2">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                        title="Edit Teacher"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(teacher)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                        title="Send Reset Password Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleChangePassword(teacher)}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                        title="Change Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                        title="Delete Teacher"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-amber-900 mb-4">
              {editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              {!editingTeacher && (
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                  />
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editingTeacher ? 'Update' : 'Add'} Teacher
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingTeacher(null)
                    setFormData({ email: '', name: '', password: '' })
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Assignment Modal */}
      {showSubjectAssignment && (
        <ClassSubjectAssignment onClose={() => setShowSubjectAssignment(false)} />
      )}
    </div>
  )
}