import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Award } from 'lucide-react'
import { classesApi, classCocurricularConfigApi } from '../../lib/index'
import type { Class, ClassCocurricularConfig } from '../../lib/types'

export const ClassesManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([])
  const [cocurricularConfigs, setCocurricularConfigs] = useState<ClassCocurricularConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    level: 1,
    has_cocurricular: false
  })

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const classesData = await classesApi.getAll()
      setClasses(classesData)
      
      // Fetch cocurricular configs for all classes
      const configs: ClassCocurricularConfig[] = []
      for (const cls of classesData) {
        const config = await classCocurricularConfigApi.getByClass(cls.id)
        if (config) configs.push(config)
      }
      setCocurricularConfigs(configs)
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingClass) {
        // Update class
        await classesApi.update(editingClass.id, { name: formData.name, level: formData.level })

        // Update co-curricular config
        const existingConfig = cocurricularConfigs.find(c => c.class_id === editingClass.id)
        if (existingConfig) {
          await classCocurricularConfigApi.update(existingConfig.id, { has_cocurricular: formData.has_cocurricular })
        } else {
          await classCocurricularConfigApi.create({
            class_id: editingClass.id,
            has_cocurricular: formData.has_cocurricular
          })
        }
      } else {
        // Create class
        const classData = await classesApi.create({ name: formData.name, level: formData.level })

        // Create co-curricular config
        await classCocurricularConfigApi.create({
          class_id: classData.id,
          has_cocurricular: formData.has_cocurricular
        })
      }
      
      setShowForm(false)
      setEditingClass(null)
      setFormData({ name: '', level: 1, has_cocurricular: false })
      fetchClasses()
    } catch (error) {
      console.error('Error saving class:', error)
      alert('Error saving class. Please try again.')
    }
  }

  const handleEdit = (cls: Class) => {
    setEditingClass(cls)
    const config = cocurricularConfigs.find(c => c.class_id === cls.id)
    setFormData({
      name: cls.name,
      level: cls.level,
      has_cocurricular: config?.has_cocurricular || false
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      try {
        await classesApi.delete(id)
        fetchClasses()
      } catch (error) {
        console.error('Error deleting class:', error)
        alert('Error deleting class. Please try again.')
      }
    }
  }

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getHasCocurricular = (classId: string) => {
    return cocurricularConfigs.find(c => c.class_id === classId)?.has_cocurricular || false
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
        <h2 className="text-2xl font-bold text-amber-900">Classes Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
        <input
          type="text"
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Name</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Co-curricular</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200">
              {filteredClasses.map((cls, index) => (
                <tr key={cls.id} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                  <td className="px-4 py-3 text-sm font-medium text-amber-900">{cls.level}</td>
                  <td className="px-4 py-3 text-sm text-amber-900">{cls.name}</td>
                  <td className="px-4 py-3 text-center">
                    {getHasCocurricular(cls.id) ? (
                      <div className="flex items-center justify-center">
                        <Award className="w-4 h-4 text-green-600" />
                        <span className="ml-1 text-sm text-green-600">Yes</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(cls)}
                        className="p-1 text-amber-600 hover:text-amber-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
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
              {editingClass ? 'Edit Class' : 'Add Class'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Class Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Level</label>
                <input
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  min="1"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="has_cocurricular"
                  checked={formData.has_cocurricular}
                  onChange={(e) => setFormData({ ...formData, has_cocurricular: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="has_cocurricular" className="ml-2 text-sm text-amber-900">
                  Has Co-curricular Activities
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
                >
                  {editingClass ? 'Update' : 'Add'} Class
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingClass(null)
                    setFormData({ name: '', level: 1, has_cocurricular: false })
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