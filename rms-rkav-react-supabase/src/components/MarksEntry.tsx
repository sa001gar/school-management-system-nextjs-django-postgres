import React, { useState, useEffect } from 'react'
import { Save, Calculator, Calendar, User } from 'lucide-react'
import { studentResultsApi, classMarksDistributionApi, schoolConfigApi } from '../lib/index'
import type { ClassMarksDistribution, StudentWithResult } from '../lib/types'

interface Props {
  sessionId: string
  classId: string
  sectionId: string
  subjectId: string
}

type EntryMode = 'marks' | 'attendance' | 'conduct'

export const MarksEntry: React.FC<Props> = ({ sessionId, classId, sectionId, subjectId }) => {
  const [students, setStudents] = useState<StudentWithResult[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [entryMode, setEntryMode] = useState<EntryMode>('marks')
  const [totalSchoolDays, setTotalSchoolDays] = useState(200)
  const [marksDistribution, setMarksDistribution] = useState<ClassMarksDistribution | null>(null)

  useEffect(() => {
    if (sessionId && classId && sectionId && subjectId) {
      fetchAllData()
    }
  }, [sessionId, classId, sectionId, subjectId])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Fetch all data in parallel for better performance
      const [studentsWithResults, marksDistData, schoolConfigData] = await Promise.all([
        studentResultsApi.getByClassSection({
          session_id: sessionId,
          class_id: classId,
          section_id: sectionId,
          subject_id: subjectId
        }),
        classMarksDistributionApi.getByClass(classId).catch(() => null),
        schoolConfigApi.get(classId, sessionId).catch(() => null)
      ])

      setStudents(studentsWithResults || [])
      setMarksDistribution(marksDistData)
      if (schoolConfigData) {
        setTotalSchoolDays(schoolConfigData.total_school_days)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateGrade = (obtainedMarks: number, fullMarks: number): string => {
    if (fullMarks === 0) return 'D'
    const percentage = (obtainedMarks / fullMarks) * 100
    if (percentage >= 90) return "AA"
    if (percentage >= 75) return "A+"
    if (percentage >= 60) return "A"
    if (percentage >= 45) return "B+"
    if (percentage >= 34) return "B"
    if (percentage >= 25) return "C"
    return "D"
  }

  const getDefaultMarks = () => {
    if (marksDistribution) {
      return {
        first_summative_full: marksDistribution.first_summative_marks,
        first_formative_full: marksDistribution.first_formative_marks,
        second_summative_full: marksDistribution.second_summative_marks,
        second_formative_full: marksDistribution.second_formative_marks,
        third_summative_full: marksDistribution.third_summative_marks,
        third_formative_full: marksDistribution.third_formative_marks,
      }
    }
    return {
      first_summative_full: 40,
      first_formative_full: 10,
      second_summative_full: 40,
      second_formative_full: 10,
      third_summative_full: 40,
      third_formative_full: 10,
    }
  }

  const handleMarksChange = (studentId: string, field: string, value: string, maxValue?: number) => {
    let numValue = value === '' ? 0 : parseInt(value)
    
    // Validate against max value if provided
    if (maxValue !== undefined && numValue > maxValue) {
      numValue = maxValue
    }
    if (numValue < 0) {
      numValue = 0
    }
    
    setStudents(prev => 
      prev.map(student => {
        if (student.id === studentId) {
          const defaultMarks = getDefaultMarks()
          const result = student.result || {
            id: '',
            student_id: studentId,
            subject_id: subjectId,
            session_id: sessionId,
            ...defaultMarks,
            first_summative_obtained: 0,
            first_formative_obtained: 0,
            second_summative_obtained: 0,
            second_formative_obtained: 0,
            third_summative_obtained: 0,
            third_formative_obtained: 0,
            total_marks: 0,
            grade: '',
            conduct: 'Good',
            attendance_days: 0
          }

          const updatedResult = { ...result, [field]: numValue }
          
          // Calculate total marks and grade for marks fields
          if (field.includes('obtained')) {
            const totalObtained = 
              updatedResult.first_summative_obtained +
              updatedResult.first_formative_obtained +
              updatedResult.second_summative_obtained +
              updatedResult.second_formative_obtained +
              updatedResult.third_summative_obtained +
              updatedResult.third_formative_obtained

            const totalFull = 
              updatedResult.first_summative_full +
              updatedResult.first_formative_full +
              updatedResult.second_summative_full +
              updatedResult.second_formative_full +
              updatedResult.third_summative_full +
              updatedResult.third_formative_full

            updatedResult.total_marks = totalObtained
            updatedResult.grade = calculateGrade(totalObtained, totalFull)
          }

          return { ...student, result: updatedResult }
        }
        return student
      })
    )
  }

  const handleConductChange = (studentId: string, value: string) => {
    setStudents(prev => 
      prev.map(student => {
        if (student.id === studentId) {
          const defaultMarks = getDefaultMarks()
          const result = student.result || {
            id: '',
            student_id: studentId,
            subject_id: subjectId,
            session_id: sessionId,
            ...defaultMarks,
            first_summative_obtained: 0,
            first_formative_obtained: 0,
            second_summative_obtained: 0,
            second_formative_obtained: 0,
            third_summative_obtained: 0,
            third_formative_obtained: 0,
            total_marks: 0,
            grade: '',
            conduct: 'Good',
            attendance_days: 0
          }

          const updatedResult = { ...result, conduct: value }
          return { ...student, result: updatedResult }
        }
        return student
      })
    )
  }

  const saveResults = async () => {
    setSaving(true)
    try {
      const resultsToSave = students
        .filter(student => student.result)
        .map(student => {
          const { id, created_at, updated_at, student: _student, subject, session, ...result } = student.result as any
          return result
        })

      await studentResultsApi.bulkUpsert(resultsToSave)

      alert('Results saved successfully!')
      
      // Refresh data to get the latest saved state
      await fetchStudentsAndResults()
    } catch (error) {
      console.error('Error saving results:', error)
      alert('Error saving results. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-amber-800">Loading students...</p>
        </div>
      </div>
    )
  }

  const defaultMarks = getDefaultMarks()

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl lg:text-2xl font-bold text-amber-900">Marks Entry</h2>
        <button
          onClick={saveResults}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-50 border-2 border-amber-700"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Results'}
        </button>
      </div>

      {/* Entry Mode Selection */}
      <div className="bg-white rounded-xl shadow-professional border-2 border-amber-200 p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-amber-900 mb-4">Entry Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setEntryMode('marks')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              entryMode === 'marks'
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-amber-200 hover:border-amber-300 text-amber-700'
            }`}
          >
            <Calculator className="w-6 h-6 mb-2" />
            <div className="font-medium">Marks Entry</div>
            <div className="text-sm text-amber-600">Enter subject marks</div>
          </button>
          
          <button
            onClick={() => setEntryMode('attendance')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              entryMode === 'attendance'
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-amber-200 hover:border-amber-300 text-amber-700'
            }`}
          >
            <Calendar className="w-6 h-6 mb-2" />
            <div className="font-medium">Attendance Entry</div>
            <div className="text-sm text-amber-600">Enter attendance days</div>
          </button>
          
          <button
            onClick={() => setEntryMode('conduct')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              entryMode === 'conduct'
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-amber-200 hover:border-amber-300 text-amber-700'
            }`}
          >
            <User className="w-6 h-6 mb-2" />
            <div className="font-medium">Conduct Entry</div>
            <div className="text-sm text-amber-600">Enter student conduct</div>
          </button>
        </div>

        {entryMode === 'attendance' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Total School Days: <span className="font-bold">{totalSchoolDays}</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This value is configured by the admin for this class and session.
                </p>
              </div>
            </div>
          </div>
        )}

        {entryMode === 'marks' && marksDistribution && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Marks Distribution (Admin Configured):
                </p>
                <div className="text-xs text-green-700 mt-1 grid grid-cols-3 gap-2">
                  <span>1st: {defaultMarks.first_summative_full}+{defaultMarks.first_formative_full}</span>
                  <span>2nd: {defaultMarks.second_summative_full}+{defaultMarks.second_formative_full}</span>
                  <span>3rd: {defaultMarks.third_summative_full}+{defaultMarks.third_formative_full}</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Full marks are locked. You can only enter obtained marks.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Entry Tables */}
      <div className="bg-white rounded-xl shadow-professional border-2 border-amber-200 overflow-hidden">
        <div className="table-responsive thin-scrollbar">
          {entryMode === 'marks' && (
            <table className="w-full min-w-[800px]">
              <thead className="bg-amber-50 border-b-2 border-amber-200">
                <tr>
                  <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Roll No
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider min-w-32 lg:min-w-48">
                    Student Name
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    1st Summative<br /><span className="font-normal">({defaultMarks.first_summative_full})</span>
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    1st Formative<br /><span className="font-normal">({defaultMarks.first_formative_full})</span>
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    2nd Summative<br /><span className="font-normal">({defaultMarks.second_summative_full})</span>
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    2nd Formative<br /><span className="font-normal">({defaultMarks.second_formative_full})</span>
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    3rd Summative<br /><span className="font-normal">({defaultMarks.third_summative_full})</span>
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    3rd Formative<br /><span className="font-normal">({defaultMarks.third_formative_full})</span>
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Total Marks
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {students.map((student, index) => (
                  <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                    <td className="px-2 lg:px-4 py-3 text-sm font-medium text-amber-900">
                      {student.roll_no}
                    </td>
                    <td className="px-2 lg:px-4 py-3 text-sm text-amber-900">
                      {student.name}
                    </td>
                    
                    {/* 1st Summative */}
                    <td className="px-2 lg:px-4 py-3 text-center">
                      <input
                        type="number"
                        value={student.result?.first_summative_obtained || ''}
                        onChange={(e) => handleMarksChange(student.id, 'first_summative_obtained', e.target.value, defaultMarks.first_summative_full)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-16 lg:w-20 px-2 py-1 text-center border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        max={defaultMarks.first_summative_full}
                        placeholder="0"
                      />
                    </td>

                    {/* 1st Formative */}
                    <td className="px-2 lg:px-4 py-3 text-center">
                      <input
                        type="number"
                        value={student.result?.first_formative_obtained || ''}
                        onChange={(e) => handleMarksChange(student.id, 'first_formative_obtained', e.target.value, defaultMarks.first_formative_full)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-16 lg:w-20 px-2 py-1 text-center border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        max={defaultMarks.first_formative_full}
                        placeholder="0"
                      />
                    </td>

                    {/* 2nd Summative */}
                    <td className="px-2 lg:px-4 py-3 text-center">
                      <input
                        type="number"
                        value={student.result?.second_summative_obtained || ''}
                        onChange={(e) => handleMarksChange(student.id, 'second_summative_obtained', e.target.value, defaultMarks.second_summative_full)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-16 lg:w-20 px-2 py-1 text-center border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        max={defaultMarks.second_summative_full}
                        placeholder="0"
                      />
                    </td>

                    {/* 2nd Formative */}
                    <td className="px-2 lg:px-4 py-3 text-center">
                      <input
                        type="number"
                        value={student.result?.second_formative_obtained || ''}
                        onChange={(e) => handleMarksChange(student.id, 'second_formative_obtained', e.target.value, defaultMarks.second_formative_full)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-16 lg:w-20 px-2 py-1 text-center border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        max={defaultMarks.second_formative_full}
                        placeholder="0"
                      />
                    </td>

                    {/* 3rd Summative */}
                    <td className="px-2 lg:px-4 py-3 text-center">
                      <input
                        type="number"
                        value={student.result?.third_summative_obtained || ''}
                        onChange={(e) => handleMarksChange(student.id, 'third_summative_obtained', e.target.value, defaultMarks.third_summative_full)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-16 lg:w-20 px-2 py-1 text-center border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        max={defaultMarks.third_summative_full}
                        placeholder="0"
                      />
                    </td>

                    {/* 3rd Formative */}
                    <td className="px-2 lg:px-4 py-3 text-center">
                      <input
                        type="number"
                        value={student.result?.third_formative_obtained || ''}
                        onChange={(e) => handleMarksChange(student.id, 'third_formative_obtained', e.target.value, defaultMarks.third_formative_full)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-16 lg:w-20 px-2 py-1 text-center border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        max={defaultMarks.third_formative_full}
                        placeholder="0"
                      />
                    </td>

                    {/* Total Marks */}
                    <td className="px-2 lg:px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-amber-100 text-amber-800 border border-amber-300">
                        {student.result?.total_marks || 0}
                      </span>
                    </td>

                    {/* Grade */}
                    <td className="px-2 lg:px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-bold border ${
                        student.result?.grade === 'A+' || student.result?.grade === 'A' || student.result?.grade === 'AA'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : student.result?.grade === 'B+' || student.result?.grade === 'B'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : student.result?.grade === 'C+' || student.result?.grade === 'C'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          : student.result?.grade === 'D'
                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}>
                        {student.result?.grade || 'F'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {entryMode === 'attendance' && (
            <table className="w-full min-w-[600px]">
              <thead className="bg-amber-50 border-b-2 border-amber-200">
                <tr>
                  <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Roll No
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Attendance Days
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Total School Days
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Attendance %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {students.map((student, index) => {
                  const attendanceDays = student.result?.attendance_days || 0
                  const percentage = totalSchoolDays > 0 ? (attendanceDays / totalSchoolDays) * 100 : 0
                  
                  return (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                      <td className="px-2 lg:px-4 py-3 text-sm font-medium text-amber-900">
                        {student.roll_no}
                      </td>
                      <td className="px-2 lg:px-4 py-3 text-sm text-amber-900">
                        {student.name}
                      </td>
                      <td className="px-2 lg:px-4 py-3 text-center">
                        <input
                          type="number"
                          value={student.result?.attendance_days || ''}
                          onChange={(e) => handleMarksChange(student.id, 'attendance_days', e.target.value, totalSchoolDays)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-16 lg:w-20 px-2 py-1 text-center border-2 border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                          min="0"
                          max={totalSchoolDays}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 lg:px-4 py-3 text-center text-sm text-amber-900 font-medium">
                        {totalSchoolDays}
                      </td>
                      <td className="px-2 lg:px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium border ${
                          percentage >= 90 ? 'bg-green-100 text-green-800 border-green-300' :
                          percentage >= 75 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          percentage >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                          'bg-red-100 text-red-800 border-red-300'
                        }`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {entryMode === 'conduct' && (
            <table className="w-full min-w-[400px]">
              <thead className="bg-amber-50 border-b-2 border-amber-200">
                <tr>
                  <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Roll No
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Conduct
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {students.map((student, index) => (
                  <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                    <td className="px-2 lg:px-4 py-3 text-sm font-medium text-amber-900">
                      {student.roll_no}
                    </td>
                    <td className="px-2 lg:px-4 py-3 text-sm text-amber-900">
                      {student.name}
                    </td>
                    <td className="px-2 lg:px-4 py-3 text-center">
                      <select
                        value={student.result?.conduct || 'Good'}
                        onChange={(e) => handleConductChange(student.id, e.target.value)}
                        className="px-3 py-1 border-2 border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                      >
                        <option value="Excellent">Excellent</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                        <option value="Satisfactory">Satisfactory</option>
                        <option value="Needs Improvement">Needs Improvement</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          {entryMode === 'marks' && <Calculator className="w-5 h-5 text-amber-600 mt-0.5" />}
          {entryMode === 'attendance' && <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />}
          {entryMode === 'conduct' && <User className="w-5 h-5 text-amber-600 mt-0.5" />}
          <div>
            <h3 className="font-medium text-amber-900 mb-1">
              {entryMode === 'marks' && 'Marks Entry Information'}
              {entryMode === 'attendance' && 'Attendance Entry Information'}
              {entryMode === 'conduct' && 'Conduct Entry Information'}
            </h3>
            <p className="text-sm text-amber-700">
              {entryMode === 'marks' && 'Enter obtained marks for each assessment. Full marks are configured by admin and cannot be changed. Grades are automatically calculated based on percentage: (obtained marks / full marks) × 100.'}
              {entryMode === 'attendance' && `Enter the number of days each student attended. Total school days (${totalSchoolDays}) is configured by admin for this class/session.`}
              {entryMode === 'conduct' && 'Select the appropriate conduct rating for each student. This will appear on their marksheet and report card.'}
            </p>
            {entryMode === 'marks' && (
                <div className="mt-2 text-xs text-amber-600">
                <strong>Grade Scale:</strong> AA (90-100%) | A+ (75-89%) | A (60-74%) | B+ (45-59%) | B (34-44%) | C (25-33%) | F (Below 25%)
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}