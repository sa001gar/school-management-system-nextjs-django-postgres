import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { sessionsApi } from '../../lib/index'
import type { Session } from '../../lib/types'

export const SessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false
  })

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const data = await sessionsApi.getAll()
      setSessions(data)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSession) {
        await sessionsApi.update(editingSession.id, formData)
      } else {
        await sessionsApi.create(formData)
      }
      
      setShowForm(false)
      setEditingSession(null)
      setFormData({ name: '', start_date: '', end_date: '', is_active: false })
      fetchSessions()
    } catch (error) {
      console.error('Error saving session:', error)
      alert('Error saving session. Please try again.')
    }
  }

  const handleEdit = (session: Session) => {
    setEditingSession(session)
    setFormData({
      name: session.name,
      start_date: session.start_date,
      end_date: session.end_date,
      is_active: session.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await sessionsApi.delete(id)
        fetchSessions()
      } catch (error) {
        console.error('Error deleting session:', error)
        alert('Error deleting session. Please try again.')
      }
    }
  }

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h2 className="text-2xl font-bold text-amber-900">Sessions Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus className="w-4 h-4" />
          Add Session
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">End Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200">
              {filteredSessions.map((session, index) => (
                <tr key={session.id} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                  <td className="px-4 py-3 text-sm font-medium text-amber-900">{session.name}</td>
                  <td className="px-4 py-3 text-sm text-amber-900">{new Date(session.start_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-amber-900">{new Date(session.end_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      session.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(session)}
                        className="p-1 text-amber-600 hover:text-amber-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
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
              {editingSession ? 'Edit Session' : 'Add Session'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Session Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-amber-900">
                  Active Session
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
                >
                  {editingSession ? 'Update' : 'Add'} Session
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingSession(null)
                    setFormData({ name: '', start_date: '', end_date: '', is_active: false })
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