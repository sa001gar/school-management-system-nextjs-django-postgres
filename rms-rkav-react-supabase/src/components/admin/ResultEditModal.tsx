import React, { useState, useEffect } from 'react'
import { 
  X, 
  Save, 
  BookOpen, 
  Award, 
  Calendar, 
  User, 
  Calculator,
  GraduationCap,
  Users
} from 'lucide-react'
import { studentResultsApi, cocurricularResultsApi, subjectsApi, cocurricularSubjectsApi } from '../../lib/index'
import type { StudentResult, Subject, StudentCocurricularResult, CocurricularSubject } from '../../lib/types'

interface StudentWithAllResults {
  id: string
  roll_no: string
  name: string
  class: { name: string }
  section: { name: string }
  session: { name: string }
  results: (StudentResult & { subject: Subject })[]
  cocurricularResults: (StudentCocurricularResult & { cocurricular_subject: CocurricularSubject })[]
}

interface Props {
  student: StudentWithAllResults
  onClose: () => void
  onSave: () => void
}

export const ResultEditModal: React.FC<Props> = ({ student, onClose, onSave }) => {
  const [results, setResults] = useState<(StudentResult & { subject: Subject })[]>([])
  const [cocurricularResults, setCocurricularResults] = useState<(StudentCocurricularResult & { cocurricular_subject: CocurricularSubject })[]>([])
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [allCocurricularSubjects, setAllCocurricularSubjects] = useState<CocurricularSubject[]>([])
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'academic' | 'cocurricular' | 'attendance'>('academic')
  const [totalSchoolDays, setTotalSchoolDays] = useState(200)

  useEffect(() => {
    setResults([...student.results])
    setCocurricularResults([...student.cocurricularResults])
    fetchAllSubjects()
    
    // Load total school days from localStorage
    const savedTotalDays = localStorage.getItem(`totalSchoolDays_${student.session}_${student.class}_${student.section}`)
    if (savedTotalDays) {
      setTotalSchoolDays(parseInt(savedTotalDays))
    }
  }, [student])

  const fetchAllSubjects = async () => {
    try {
      const [subjects, cocurricularSubjects] = await Promise.all([
        subjectsApi.getAll(),
        cocurricularSubjectsApi.getAll()
      ])

      setAllSubjects(subjects)
      setAllCocurricularSubjects(cocurricularSubjects)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const calculateGrade = (totalMarks: number, fullMarks: number): string => {
    const percentage = (totalMarks / fullMarks) * 100
    if (percentage >= 90) return 'AA'
    if (percentage >= 75) return 'A+'
    if (percentage >= 60) return 'A'
    if (percentage >= 45) return 'B+'
    if (percentage >= 34) return 'B'
    if (percentage >= 25) return 'C'
    return 'D'
  }

  const handleResultChange = (resultIndex: number, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value)
    
    setResults(prev => prev.map((result, index) => {
      if (index === resultIndex) {
        const updatedResult = { ...result, [field]: numValue }
        
        // Calculate total marks and grade if marks fields are updated
        if (field.includes('obtained')) {
          const totalMarks = 
            updatedResult.first_summative_obtained +
            updatedResult.first_formative_obtained +
            updatedResult.second_summative_obtained +
            updatedResult.second_formative_obtained +
            updatedResult.third_summative_obtained +
            updatedResult.third_formative_obtained

          const fullMarks = 
            updatedResult.first_summative_full +
            updatedResult.first_formative_full +
            updatedResult.second_summative_full +
            updatedResult.second_formative_full +
            updatedResult.third_summative_full +
            updatedResult.third_formative_full

          updatedResult.total_marks = totalMarks
          updatedResult.grade = calculateGrade(totalMarks, fullMarks)
        }
        
        return updatedResult
      }
      return result
    }))
  }

  const handleCocurricularChange = (resultIndex: number, field: string, value: string) => {
    setCocurricularResults(prev => prev.map((result, index) => {
      if (index === resultIndex) {
        const updatedResult = { ...result, [field]: value }
        
        // Calculate overall grade if term grades are updated
        if (field !== 'overall_grade') {
          const gradeValues = { 'AA': 95, 'A+': 85, 'A': 75, 'B+': 65, 'B': 55, 'C': 45, 'D': 35 }
          const avgValue = (
            gradeValues[updatedResult.first_term_grade] + 
            gradeValues[updatedResult.second_term_grade] + 
            gradeValues[updatedResult.final_term_grade]
          ) / 3
          
          if (avgValue >= 90) updatedResult.overall_grade = 'AA'
          else if (avgValue >= 80) updatedResult.overall_grade = 'A+'
          else if (avgValue >= 70) updatedResult.overall_grade = 'A'
          else if (avgValue >= 60) updatedResult.overall_grade = 'B+'
          else if (avgValue >= 50) updatedResult.overall_grade = 'B'
          else if (avgValue >= 40) updatedResult.overall_grade = 'C'
          else updatedResult.overall_grade = 'D'
        }
        
        return updatedResult
      }
      return result
    }))
  }

  const addSubjectResult = (subjectId: string) => {
    const subject = allSubjects.find(s => s.id === subjectId)
    if (!subject) return

    const newResult = {
      id: '',
      student_id: student.id,
      subject_id: subjectId,
      session_id: student.session.id,
      first_summative_full: 40,
      first_summative_obtained: 0,
      first_formative_full: 10,
      first_formative_obtained: 0,
      second_summative_full: 40,
      second_summative_obtained: 0,
      second_formative_full: 10,
      second_formative_obtained: 0,
      third_summative_full: 40,
      third_summative_obtained: 0,
      third_formative_full: 10,
      third_formative_obtained: 0,
      total_marks: 0,
      grade: 'F',
      conduct: 'Good',
      attendance_days: 0,
      subject
    }

    setResults(prev => [...prev, newResult])
  }

  const addCocurricularResult = (subjectId: string) => {
    const subject = allCocurricularSubjects.find(s => s.id === subjectId)
    if (!subject) return

    const newResult = {
      id: '',
      student_id: student.id,
      cocurricular_subject_id: subjectId,
      session_id: student.session.id,
      first_term_grade: 'A',
      second_term_grade: 'A',
      final_term_grade: 'A',
      overall_grade: 'A',
      cocurricular_subject: subject
    }

    setCocurricularResults(prev => [...prev, newResult])
  }

  const removeResult = (index: number) => {
    setResults(prev => prev.filter((_, i) => i !== index))
  }

  const removeCocurricularResult = (index: number) => {
    setCocurricularResults(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save academic results
      const academicResultsToSave = results.map(result => {
        const { subject, ...resultData } = result
        return resultData
      })

      // Save co-curricular results
      const cocurricularResultsToSave = cocurricularResults.map(result => {
        const { cocurricular_subject, ...resultData } = result
        return resultData
      })

      await Promise.all([
        studentResultsApi.bulkUpsert(academicResultsToSave),
        cocurricularResultsApi.bulkUpsert(cocurricularResultsToSave)
      ])

      onSave()
    } catch (error) {
      console.error('Error saving results:', error)
      alert('Error saving results. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const gradeOptions = ['AA', 'A+', 'A', 'B+', 'B', 'C', 'D']
  const conductOptions = ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement']

  const availableSubjects = allSubjects.filter(subject => 
    !results.some(result => result.subject_id === subject.id)
  )

  const availableCocurricularSubjects = allCocurricularSubjects.filter(subject => 
    !cocurricularResults.some(result => result.cocurricular_subject_id === subject.id)
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-amber-900">Edit Results</h2>
              <div className="flex items-center gap-4 text-sm text-amber-600 mt-1">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {student.name}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Roll: {student.roll_no}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {student.class.name} - {student.section.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {student.session.name}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-amber-200">
          <button
            onClick={() => setActiveTab('academic')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'academic'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-amber-500 hover:text-amber-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Academic Results ({results.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('cocurricular')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'cocurricular'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-amber-500 hover:text-amber-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Co-curricular ({cocurricularResults.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'attendance'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-amber-500 hover:text-amber-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Attendance & Conduct
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'academic' && (
            <div className="space-y-6">
              {/* Add Subject */}
              {availableSubjects.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-medium text-amber-900 mb-3">Add Subject</h3>
                  <div className="flex gap-2">
                    <select
                      onChange={(e) => e.target.value && addSubjectResult(e.target.value)}
                      className="px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      value=""
                    >
                      <option value="">Select Subject to Add</option>
                      {availableSubjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Academic Results */}
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={`${result.subject_id}-${index}`} className="bg-white border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-amber-900">
                        {result.subject.name} ({result.subject.code})
                      </h3>
                      <button
                        onClick={() => removeResult(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {/* First Term */}
                      <div>
                        <label className="block text-xs font-medium text-amber-900 mb-1">1st Summative</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={result.first_summative_full}
                            onChange={(e) => handleResultChange(index, 'first_summative_full', e.target.value)}
                            className="w-12 px-1 py-1 text-xs border border-amber-300 rounded"
                            min="0"
                          />
                          <span className="text-xs self-center">/</span>
                          <input
                            type="number"
                            value={result.first_summative_obtained || ''}
                            onChange={(e) => handleResultChange(index, 'first_summative_obtained', e.target.value)}
                            className="w-12 px-1 py-1 text-xs border border-amber-300 rounded"
                            min="0"
                            max={result.first_summative_full}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-amber-900 mb-1">1st Formative</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={result.first_formative_full}
                            onChange={(e) => handleResultChange(index, 'first_formative_full', e.target.value)}
                            className="w-12 px-1 py-1 text-xs border border-amber-300 rounded"
                            min="0"
                          />
                          <span className="text-xs self-center">/</span>
                          <input
                            type="number"
                            value={result.first_formative_obtained || ''}
                            onChange={(e) => handleResultChange(index, 'first_formative_obtained', e.target.value)}
                            className="w-12 px-1 py-1 text-xs border border-amber-300 rounded"
                            min="0"
                            max={result.first_formative_full}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Second Term */}
                      <div>
                        <label className="block text-xs font-medium text-amber-900 mb-1">2nd Summative</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={result.second_summative_full}
                            onChange={(e) => handleResultChange(index, 'second_summative_full', e.target.value)}
                            className="w-12 px-1 py-1 text-xs border border-amber-300 rounded"
                            min="0"
                          />
                          <span className="text-xs self-center">/</span>
                          <input
                            type="number"
                            value={result.second_summative_obtained || ''}
                            onChange={(e) => handleResultChange(index, 'second_summative_obtained', e.target.value)}
                            className="w-12 px-1 py-1 text-xs border border-amber-300 rounded"
                            min="0"
                            max={result.second_summative_full}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-amber-900 mb-1">2nd Formative</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={result.second_formative_full}
                            onChange={(e) => handleResultChange(index, 'second_formative_full', e.target.value)}
                            className="w-12 px-1 py-1 text-xs border border-amber-300 rounded"
                            min="0"
                          />
                          <span className="text-xs self-center">/</span>
                          <input
                            type="number"
                            value={result.second_formative_obtained || ''}
                            onChange={(e) => handleResultChange(index, 'second_formative_obtained', e.target.value)}
                            className="w-12 px-1 py-1 text-xs border border-amber-300 rounded"
                            min="0"
                            max={result.second_formative_full}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Third Term */}
                      <div>
                        <label className="block text-xs font-medium text-amber-900 mb-1">3rd Summative</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={result.third_summative_full}
                            onChange={(e) => handleResultChange(index, 'third_summative_full', e.target.value)}
                            className="w-12 px-1 py-1 text-xs border border-amber-300 rounded"
                            min="0"
                          />
                          <span className="text-xs self-center">/</span>
                          <input
                            type="number"
                            value={result.third_summative_obtained || ''}
                            onChange={(e) => handleResultChange(index, 'third_summative_obtained', e.target.value)}
                            className="w-12 px-1 py-1 text-xs border border-amber-300 rounded"
                            min="0"
                            max={result.third_summative_full}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-amber-900 mb-1">3rd Formative</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={result.third_formative_full}
                            onChange={(e) => handleResultChange(index, 'third_formative_full', e.target.value)}
                            className="w-12 px-1 py-1 text-xs border border-amber-300 rounded"
                            min="0"
                          />
                          <span className="text-xs self-center">/</span>
                          <input
                            type="number"
                            value={result.third_formative_obtained || ''}
                            onChange={(e) => handleResultChange(index, 'third_formative_obtained', e.target.value)}
                            className="w-12 px-1 py-1 text-xs border border-amber-300 rounded"
                            min="0"
                            max={result.third_formative_full}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-amber-900">Total:</span>
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm font-bold">
                          {result.total_marks}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-amber-900">Grade:</span>
                        <span className={`px-2 py-1 rounded text-sm font-bold ${
                          result.grade === 'A+' || result.grade === 'A' 
                            ? 'bg-green-100 text-green-800'
                            : result.grade === 'B+' || result.grade === 'B'
                            ? 'bg-amber-100 text-amber-800'
                            : result.grade === 'C+' || result.grade === 'C'
                            ? 'bg-yellow-100 text-yellow-800'
                            : result.grade === 'D'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.grade}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {results.length === 0 && (
                  <div className="text-center py-8 text-amber-600">
                    No academic results found. Add subjects to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cocurricular' && (
            <div className="space-y-6">
              {/* Add Co-curricular Subject */}
              {availableCocurricularSubjects.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-3">Add Co-curricular Activity</h3>
                  <div className="flex gap-2">
                    <select
                      onChange={(e) => e.target.value && addCocurricularResult(e.target.value)}
                      className="px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      value=""
                    >
                      <option value="">Select Activity to Add</option>
                      {availableCocurricularSubjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Co-curricular Results */}
              <div className="space-y-4">
                {cocurricularResults.map((result, index) => (
                  <div key={`${result.cocurricular_subject_id}-${index}`} className="bg-white border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-green-900">
                        {result.cocurricular_subject.name} ({result.cocurricular_subject.code})
                      </h3>
                      <button
                        onClick={() => removeCocurricularResult(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-1">1st Term</label>
                        <select
                          value={result.first_term_grade}
                          onChange={(e) => handleCocurricularChange(index, 'first_term_grade', e.target.value)}
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          {gradeOptions.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-1">2nd Term</label>
                        <select
                          value={result.second_term_grade}
                          onChange={(e) => handleCocurricularChange(index, 'second_term_grade', e.target.value)}
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          {gradeOptions.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-1">Final Term</label>
                        <select
                          value={result.final_term_grade}
                          onChange={(e) => handleCocurricularChange(index, 'final_term_grade', e.target.value)}
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          {gradeOptions.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-1">Overall</label>
                        <select
                          value={result.overall_grade}
                          onChange={(e) => handleCocurricularChange(index, 'overall_grade', e.target.value)}
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-green-50 font-medium"
                        >
                          {gradeOptions.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {cocurricularResults.length === 0 && (
                  <div className="text-center py-8 text-green-600">
                    No co-curricular results found. Add activities to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-medium text-blue-900 mb-4">Attendance & Conduct Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Total School Days
                    </label>
                    <input
                      type="number"
                      value={totalSchoolDays}
                      onChange={(e) => setTotalSchoolDays(parseInt(e.target.value) || 200)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="365"
                    />
                    <p className="text-sm text-blue-600 mt-1">
                      Total effective teaching days for this session
                    </p>
                  </div>
                </div>
              </div>

              {/* Attendance & Conduct for each subject */}
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={`attendance-${result.subject_id}-${index}`} className="bg-white border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-4">
                      {result.subject.name} - Attendance & Conduct
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Attendance Days
                        </label>
                        <input
                          type="number"
                          value={result.attendance_days || ''}
                          onChange={(e) => handleResultChange(index, 'attendance_days', e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max={totalSchoolDays}
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Attendance Percentage
                        </label>
                        <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 font-medium">
                          {totalSchoolDays > 0 ? ((result.attendance_days || 0) / totalSchoolDays * 100).toFixed(1) : 0}%
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Conduct
                        </label>
                        <select
                          value={result.conduct || 'Good'}
                          onChange={(e) => handleResultChange(index, 'conduct', e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {conductOptions.map(conduct => (
                            <option key={conduct} value={conduct}>{conduct}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {results.length === 0 && (
                  <div className="text-center py-8 text-blue-600">
                    No subjects found. Add academic results first to manage attendance and conduct.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-amber-200">
          <div className="text-sm text-amber-600">
            {results.length} academic subjects • {cocurricularResults.length} co-curricular activities
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
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
      </div>
    </div>
  )
}