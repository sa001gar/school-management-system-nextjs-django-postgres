import React, { useState, useEffect } from 'react'
import { Save, Search, Calendar, Calculator, BookOpen } from 'lucide-react'
import { classesApi, sessionsApi, schoolConfigApi, classMarksDistributionApi } from '../../lib/index'
import type { Class, Session, SchoolConfig, ClassMarksDistribution } from '../../lib/types'

export const SchoolConfigManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [schoolConfigs, setSchoolConfigs] = useState<SchoolConfig[]>([])
  const [marksDistributions, setMarksDistributions] = useState<ClassMarksDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'school_days' | 'marks_distribution'>('school_days')
  
  // Local state for pending changes - using nested object structure
  const [pendingSchoolDays, setPendingSchoolDays] = useState<{[classId: string]: {[sessionId: string]: number}}>({})
  const [pendingMarksDistribution, setPendingMarksDistribution] = useState<{[key: string]: Partial<ClassMarksDistribution>}>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [classesData, sessionsData] = await Promise.all([
        classesApi.getAll(),
        sessionsApi.getAll()
      ])

      setClasses(classesData)
      setSessions(sessionsData)

      // Fetch school configs and marks distributions for all classes in batch
      const classIds = classesData.map(cls => cls.id)
      const [configs, distributions] = await Promise.all([
        schoolConfigApi.getByClasses(classIds),
        classMarksDistributionApi.getByClasses(classIds)
      ])

      setSchoolConfigs(configs)
      setMarksDistributions(distributions)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSchoolDaysChange = (classId: string, sessionId: string, totalDays: number) => {
    setPendingSchoolDays(prev => ({
      ...prev,
      [classId]: {
        ...prev[classId],
        [sessionId]: totalDays
      }
    }))
  }

  const handleMarksDistributionChange = (classId: string, field: string, value: number) => {
    setPendingMarksDistribution(prev => ({
      ...prev,
      [classId]: {
        ...prev[classId],
        [field]: value
      }
    }))
  }

  const saveSchoolDays = async () => {
    setSaving(true)
    try {
      const updates: Array<{class_id: string, session_id: string, total_school_days: number}> = []
      
      // Convert nested object structure to flat array of updates
      Object.entries(pendingSchoolDays).forEach(([classId, sessions]) => {
        Object.entries(sessions).forEach(([sessionId, totalDays]) => {
          updates.push({
            class_id: classId,
            session_id: sessionId,
            total_school_days: totalDays
          })
        })
      })

      if (updates.length === 0) {
        alert('No data to save.')
        return
      }

      // Process each update - create or update based on existence
      for (const update of updates) {
        const existingConfig = schoolConfigs.find(c => 
          c.class_id === update.class_id && c.session_id === update.session_id
        )
        if (existingConfig && existingConfig.id) {
          await schoolConfigApi.update(existingConfig.id, { total_school_days: update.total_school_days })
        } else {
          await schoolConfigApi.create(update)
        }
      }

      // Update local state
      setSchoolConfigs(prev => {
        const updated = [...prev]
        updates.forEach(update => {
          const existingIndex = updated.findIndex(c => 
            c.class_id === update.class_id && c.session_id === update.session_id
          )
          if (existingIndex >= 0) {
            updated[existingIndex] = { ...updated[existingIndex], total_school_days: update.total_school_days }
          } else {
            updated.push({
              id: '',
              class_id: update.class_id,
              session_id: update.session_id,
              total_school_days: update.total_school_days,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        })
        return updated
      })

      setPendingSchoolDays({})
      alert('School days configuration saved successfully!')
    } catch (error) {
      console.error('Error saving school days:', error)
      alert('Error saving school days. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const saveMarksDistribution = async () => {
    setSaving(true)
    try {
      const updateEntries = Object.entries(pendingMarksDistribution)
        .map(([classId, changes]) => {
          const existing = getMarksDistribution(classId)
          const updated = { ...existing, ...changes }
          
          // Remove total_marks and other non-updatable fields
          const { total_marks, id, created_at, updated_at, ...distributionPayload } = updated
          return { classId, id: existing.id, payload: distributionPayload }
        })

      if (updateEntries.length === 0) {
        alert('No data to save.')
        return
      }

      // Process each update - create or update based on existence
      for (const entry of updateEntries) {
        const existingDistribution = marksDistributions.find(d => d.class_id === entry.classId)
        if (existingDistribution && existingDistribution.id) {
          await classMarksDistributionApi.update(existingDistribution.id, entry.payload)
        } else {
          await classMarksDistributionApi.create({ class_id: entry.classId, ...entry.payload })
        }
      }

      // Update local state
      setMarksDistributions(prev => {
        const updated = [...prev]
        updateEntries.forEach(entry => {
          const existingIndex = updated.findIndex(d => d.class_id === entry.classId)
          const calculatedTotal = entry.payload.first_summative_marks + entry.payload.first_formative_marks +
                                 entry.payload.second_summative_marks + entry.payload.second_formative_marks +
                                 entry.payload.third_summative_marks + entry.payload.third_formative_marks
          
          if (existingIndex >= 0) {
            updated[existingIndex] = { 
              ...updated[existingIndex], 
              ...entry.payload,
              total_marks: calculatedTotal
            }
          } else {
            updated.push({
              id: '',
              class_id: entry.classId,
              ...entry.payload,
              total_marks: calculatedTotal,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as ClassMarksDistribution)
          }
        })
        return updated
      })

      setPendingMarksDistribution({})
      alert('Marks distribution saved successfully!')
    } catch (error) {
      console.error('Error saving marks distribution:', error)
      alert('Error saving marks distribution. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getSchoolDays = (classId: string, sessionId: string): number => {
    // Check nested pending changes first
    if (pendingSchoolDays[classId]?.[sessionId] !== undefined) {
      return pendingSchoolDays[classId][sessionId]
    }
    const config = schoolConfigs.find(c => c.class_id === classId && c.session_id === sessionId)
    return config?.total_school_days || 200
  }

  const getMarksDistribution = (classId: string): ClassMarksDistribution => {
    const pending = pendingMarksDistribution[classId]
    const existing = marksDistributions.find(d => d.class_id === classId) || {
      id: '',
      class_id: classId,
      first_summative_marks: 40,
      first_formative_marks: 10,
      second_summative_marks: 40,
      second_formative_marks: 10,
      third_summative_marks: 40,
      third_formative_marks: 10,
      total_marks: 150,
      created_at: '',
      updated_at: ''
    }
    
    return { ...existing, ...pending }
  }

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Check if there are any pending school days changes
  const hasPendingSchoolDays = Object.keys(pendingSchoolDays).some(classId => 
    Object.keys(pendingSchoolDays[classId] || {}).length > 0
  )
  const hasPendingMarksDistribution = Object.keys(pendingMarksDistribution).length > 0

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
        <h2 className="text-2xl font-bold text-amber-900">School Configuration</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-200">
        <button
          onClick={() => setActiveTab('school_days')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'school_days'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-amber-500 hover:text-amber-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            School Days Configuration
            {hasPendingSchoolDays && (
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('marks_distribution')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'marks_distribution'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-amber-500 hover:text-amber-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Marks Distribution
            {hasPendingMarksDistribution && (
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </div>
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

      {/* School Days Configuration */}
      {activeTab === 'school_days' && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-amber-50 border-b border-amber-200">
            <div>
              <h3 className="font-semibold text-amber-900">Total School Days per Class & Session</h3>
              <p className="text-sm text-amber-600 mt-1">
                Configure the total number of effective teaching days for each class and session.
              </p>
            </div>
            <button
              onClick={saveSchoolDays}
              disabled={saving || !hasPendingSchoolDays}
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
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Class</th>
                  {sessions.map(session => (
                    <th key={session.id} className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">
                      {session.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {filteredClasses.map((cls, index) => (
                  <tr key={cls.id} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                    <td className="px-4 py-3 text-sm font-medium text-amber-900">{cls.name}</td>
                    {sessions.map(session => {
                      const hasChanges = pendingSchoolDays[cls.id]?.[session.id] !== undefined
                      return (
                        <td key={session.id} className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={getSchoolDays(cls.id, session.id)}
                            onChange={(e) => handleSchoolDaysChange(cls.id, session.id, parseInt(e.target.value) || 200)}
                            className={`w-20 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-amber-500 ${
                              hasChanges ? 'border-amber-500 bg-amber-50' : 'border-amber-300'
                            }`}
                            min="1"
                            max="365"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marks Distribution Configuration */}
      {activeTab === 'marks_distribution' && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-amber-50 border-b border-amber-200">
            <div>
              <h3 className="font-semibold text-amber-900">Marks Distribution per Class</h3>
              <p className="text-sm text-amber-600 mt-1">
                Configure the marks distribution for summative and formative assessments for each class.
              </p>
            </div>
            <button
              onClick={saveMarksDistribution}
              disabled={saving || !hasPendingMarksDistribution}
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
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">Class</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">1st Summative</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">1st Formative</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">2nd Summative</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">2nd Formative</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">3rd Summative</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">3rd Formative</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {filteredClasses.map((cls, index) => {
                  const distribution = getMarksDistribution(cls.id)
                  const total = distribution.first_summative_marks + distribution.first_formative_marks +
                               distribution.second_summative_marks + distribution.second_formative_marks +
                               distribution.third_summative_marks + distribution.third_formative_marks
                  const hasChanges = pendingMarksDistribution[cls.id] !== undefined
                  
                  return (
                    <tr key={cls.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'} ${hasChanges ? 'ring-2 ring-amber-200' : ''}`}>
                      <td className="px-4 py-3 text-sm font-medium text-amber-900">{cls.name}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={distribution.first_summative_marks}
                          onChange={(e) => handleMarksDistributionChange(cls.id, 'first_summative_marks', parseInt(e.target.value) || 0)}
                          className={`w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-amber-500 ${
                            hasChanges ? 'border-amber-500 bg-amber-50' : 'border-amber-300'
                          }`}
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={distribution.first_formative_marks}
                          onChange={(e) => handleMarksDistributionChange(cls.id, 'first_formative_marks', parseInt(e.target.value) || 0)}
                          className={`w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-amber-500 ${
                            hasChanges ? 'border-amber-500 bg-amber-50' : 'border-amber-300'
                          }`}
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={distribution.second_summative_marks}
                          onChange={(e) => handleMarksDistributionChange(cls.id, 'second_summative_marks', parseInt(e.target.value) || 0)}
                          className={`w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-amber-500 ${
                            hasChanges ? 'border-amber-500 bg-amber-50' : 'border-amber-300'
                          }`}
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={distribution.second_formative_marks}
                          onChange={(e) => handleMarksDistributionChange(cls.id, 'second_formative_marks', parseInt(e.target.value) || 0)}
                          className={`w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-amber-500 ${
                            hasChanges ? 'border-amber-500 bg-amber-50' : 'border-amber-300'
                          }`}
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={distribution.third_summative_marks}
                          onChange={(e) => handleMarksDistributionChange(cls.id, 'third_summative_marks', parseInt(e.target.value) || 0)}
                          className={`w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-amber-500 ${
                            hasChanges ? 'border-amber-500 bg-amber-50' : 'border-amber-300'
                          }`}
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={distribution.third_formative_marks}
                          onChange={(e) => handleMarksDistributionChange(cls.id, 'third_formative_marks', parseInt(e.target.value) || 0)}
                          className={`w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-amber-500 ${
                            hasChanges ? 'border-amber-500 bg-amber-50' : 'border-amber-300'
                          }`}
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium ${
                          hasChanges ? 'bg-amber-200 text-amber-900' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {total}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Configuration Information</h3>
            <p className="text-sm text-blue-700">
              {activeTab === 'school_days' 
                ? 'School days configuration affects attendance calculations and marksheet generation. Teachers will see these values when entering attendance data. Changes are highlighted and require saving.'
                : 'Marks distribution configuration determines the default full marks for each assessment type. Teachers will only be able to enter obtained marks - the full marks will be locked based on your configuration. Changes are highlighted and require saving.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}