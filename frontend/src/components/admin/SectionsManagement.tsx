import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { sectionsApi, classesApi } from '../../lib/index'
import type { Section, Class } from '../../lib/types'

export const SectionsManagement: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    class_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sectionsData, classesData] = await Promise.all([
        sectionsApi.getAll(),
        classesApi.getAll()
      ])

      setSections(sectionsData)
      setClasses(classesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSection) {
        await sectionsApi.update(editingSection.id, formData)
      } else {
        await sectionsApi.create(formData)
      }
      
      setShowForm(false)
      setEditingSection(null)
      setFormData({ name: '', class_id: '' })
      fetchData()
    } catch (error) {
      console.error('Error saving section:', error)
      alert('Error saving section. Please try again.')
    }
  }

  const handleEdit = (section: Section) => {
    setEditingSection(section)
    setFormData({
      name: section.name,
      class_id: section.class_id || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      try {
        await sectionsApi.delete(id)
        fetchData()
      } catch (error) {
        console.error('Error deleting section:', error)
        alert('Error deleting section. Please try again.')
      }
    }
  }

  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || 'N/A'
  }

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
        <h2 className="text-2xl font-bold text-amber-900">Sections Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
        <input
          type="text"
          placeholder="Search sections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Sections Table */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Class</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200">
              {filteredSections.map((section, index) => (
                <tr key={section.id} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                  <td className="px-4 py-3 text-sm font-medium text-amber-900">{section.name}</td>
                  <td className="px-4 py-3 text-sm text-amber-900">{getClassName(section.class_id || '')}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(section)}
                        className="p-1 text-amber-600 hover:text-amber-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(section.id)}
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
              {editingSection ? 'Edit Section' : 'Add Section'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Section Name</label>
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
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
                >
                  {editingSection ? 'Update' : 'Add'} Section
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingSection(null)
                    setFormData({ name: '', class_id: '' })
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