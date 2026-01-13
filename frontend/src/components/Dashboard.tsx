import React, { useState, useEffect } from 'react'
import { 
  GraduationCap, 
  LogOut, 
  Users, 
  BookOpen, 
  FileText,
  Search,
  ChevronDown,
  Award,
  Menu,
  X,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useAuthContext } from '../contexts/AuthContext'
import { 
  sessionsApi, 
  classesApi, 
  subjectsApi, 
  cocurricularSubjectsApi,
  classSubjectAssignmentsApi,
  studentsApi,
  studentResultsApi
} from '../lib/index'
import type { Session, Class, Section, Subject, CocurricularSubject, AssignedSubject } from '../lib/types'
import { MarksEntry } from './MarksEntry'
import { MarksheetGeneration } from './MarksheetGeneration'
import { CocurricularEntry } from './CocurricularEntry'
import { OptionalFieldMarksEntry } from './OptionalEntry'

type ActiveTab = 'marks' | 'cocurricular' | 'optional' | 'marksheet'

export const Dashboard: React.FC = () => {
  const { teacher, signOut } = useAuthContext()
  const [activeTab, setActiveTab] = useState<ActiveTab>('marks')
  const [sessions, setSessions] = useState<Session[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignedSubjects, setAssignedSubjects] = useState<AssignedSubject[]>([])
  const [cocurricularSubjects, setCocurricularSubjects] = useState<CocurricularSubject[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedSection, setSelectedSection] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [hasCocurricular, setHasCocurricular] = useState<boolean>(false)
  const [hasOptional, setHasOptional] = useState<boolean>(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchClassConfig(selectedClass)
    } else {
      setSections([])
      setHasCocurricular(false)
      setHasOptional(false)
    }
  }, [selectedClass])

  useEffect(() => {
    if (selectedSession && selectedClass && selectedSection) {
      fetchAssignedSubjects()
    } else {
      setAssignedSubjects([])
      setSelectedSubject('')
    }
  }, [selectedSession, selectedClass, selectedSection])

  const fetchInitialData = async () => {
    try {
      const [sessionsData, classesData, subjectsData, cocurricularData] = await Promise.all([
        sessionsApi.getAll(),
        classesApi.getAll(),
        subjectsApi.getAll(),
        cocurricularSubjectsApi.getAll()
      ])

      if (sessionsData) setSessions(sessionsData)
      if (classesData) setClasses(classesData)
      if (subjectsData) setSubjects(subjectsData)
      if (cocurricularData) setCocurricularSubjects(cocurricularData)
    } catch (error) {
      console.error('Error fetching initial data:', error)
    }
  }

  const fetchClassConfig = async (classId: string) => {
    try {
      const config = await classesApi.getConfig(classId)
      setSections(config.sections || [])
      setHasCocurricular(config.cocurricular_config?.has_cocurricular || false)
      setHasOptional(config.optional_config?.has_optional || false)
    } catch (error) {
      console.error('Error fetching class config:', error)
      setSections([])
      setHasCocurricular(false)
      setHasOptional(false)
    }
  }

  const fetchAssignedSubjects = async () => {
    setLoadingSubjects(true)
    try {
      // Get assigned subjects and students in parallel
      const [assignments, students] = await Promise.all([
        classSubjectAssignmentsApi.getByClass(selectedClass),
        studentsApi.getByFilters(selectedSession, selectedClass, selectedSection)
      ])

      const totalStudents = students?.length || 0

      if (!assignments || assignments.length === 0) {
        setAssignedSubjects([])
        setLoadingSubjects(false)
        return
      }

      // Fetch all subject results in parallel instead of sequentially
      const subjectIds = assignments.map(a => a.subject?.id).filter(Boolean) as string[]
      const resultsPromises = subjectIds.map(subjectId => 
        studentResultsApi.getByClassSection({
          session_id: selectedSession, 
          class_id: selectedClass, 
          section_id: selectedSection, 
          subject_id: subjectId
        }).catch(() => [])
      )
      
      const allResults = await Promise.all(resultsPromises)
      
      // Build results map
      const resultsMap = new Map<string, typeof allResults[0]>()
      subjectIds.forEach((id, index) => {
        resultsMap.set(id, allResults[index])
      })

      const assignedSubjectsWithStatus: AssignedSubject[] = assignments
        .filter(assignment => assignment.subject)
        .map(assignment => {
          const results = resultsMap.get(assignment.subject!.id) || []
          const studentsWithMarks = results.filter((result) => result.result && result.result.total_marks > 0).length
          const isComplete = studentsWithMarks === totalStudents && totalStudents > 0

          return {
            ...assignment.subject!,
            isAssigned: true,
            completionStatus: {
              totalStudents,
              studentsWithMarks,
              isComplete
            }
          }
        })

      setAssignedSubjects(assignedSubjectsWithStatus)
      
      // Reset selected subject if it's not in the assigned list
      if (selectedSubject && !assignedSubjectsWithStatus.find(s => s.id === selectedSubject)) {
        setSelectedSubject('')
      }
    } catch (error) {
      console.error('Error fetching assigned subjects:', error)
      setAssignedSubjects([])
    } finally {
      setLoadingSubjects(false)
    }
  }

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId)
    setSelectedSection('')
    setSelectedSubject('')
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const isFilterComplete = selectedSession && selectedClass && selectedSection && (activeTab === 'marksheet' || activeTab === 'cocurricular' || selectedSubject)

  const tabs = [
    { id: 'marks', label: 'Marks Entry', icon: BookOpen },
    ...(hasCocurricular ? [{ id: 'cocurricular', label: 'Co-curricular', icon: Award }] : []),
    ...(hasOptional ? [{ id: 'optional', label: 'Optional Subjects', icon: BookOpen }] : []),
    { id: 'marksheet', label: 'Marksheet', icon: FileText }
  ]

  const getSubjectStatusIcon = (subject: AssignedSubject) => {
    if (subject.completionStatus.isComplete) {
      return <CheckCircle className="w-4 h-4 text-green-600" />
    } else if (subject.completionStatus.studentsWithMarks > 0) {
      return <Clock className="w-4 h-4 text-amber-600" />
    } else {
      return <AlertCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getSubjectStatusText = (subject: AssignedSubject) => {
    const { totalStudents, studentsWithMarks, isComplete } = subject.completionStatus
    
    if (isComplete) {
      return 'Complete'
    } else if (studentsWithMarks > 0) {
      return `${studentsWithMarks}/${totalStudents} done`
    } else {
      return `${totalStudents} pending`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-professional border-b-2 border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg border-2 border-amber-300">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-amber-900">School Results</h1>
                <p className="text-sm text-amber-600">Teacher Portal</p>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 text-amber-600 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Desktop user info */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-900">{teacher?.name}</p>
                  <p className="text-xs text-amber-600">{teacher?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-amber-200 py-4">
              <div className="space-y-3">
                <div className="px-4 py-2 bg-amber-50 rounded-lg">
                  <p className="text-sm font-medium text-amber-900">{teacher?.name}</p>
                  <p className="text-xs text-amber-600">{teacher?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b-2 border-amber-200 transparent-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as ActiveTab)}
                className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-amber-500 hover:text-amber-700 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-professional border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Session */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">
                Session
              </label>
              <div className="relative">
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white transition-all"
                >
                  <option value="">Select Session</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
              </div>
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">
                Class
              </label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white transition-all"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
              </div>
            </div>

            {/* Section */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">
                Section
              </label>
              <div className="relative">
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={!selectedClass}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white disabled:bg-amber-50 disabled:text-amber-400 transition-all"
                >
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
              </div>
            </div>

            {/* Subject - Only show for marks entry */}
            {activeTab === 'marks' && (
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  Subject
                  {loadingSubjects && (
                    <span className="ml-2 text-xs text-amber-600">(Loading...)</span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={!selectedSession || !selectedClass || !selectedSection || loadingSubjects}
                    className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white disabled:bg-amber-50 disabled:text-amber-400 transition-all"
                  >
                    <option value="">Select Subject</option>
                    {assignedSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code}) - {getSubjectStatusText(subject)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Subject Status Display */}
          {activeTab === 'marks' && selectedSession && selectedClass && selectedSection && assignedSubjects.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <h3 className="text-sm font-medium text-amber-900 mb-3">Subject Completion Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {assignedSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedSubject === subject.id
                        ? 'border-amber-500 bg-amber-100'
                        : 'border-amber-200 bg-white hover:border-amber-300'
                    }`}
                    onClick={() => setSelectedSubject(subject.id)}
                  >
                    {getSubjectStatusIcon(subject)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-900 truncate">
                        {subject.name}
                      </p>
                      <p className="text-xs text-amber-600">
                        {getSubjectStatusText(subject)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {assignedSubjects.length === 0 && !loadingSubjects && (
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-amber-600">No subjects assigned to this class</p>
                  <p className="text-xs text-amber-500 mt-1">Contact admin to assign subjects</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {!isFilterComplete ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-amber-900 mb-2">
              Select Filters to Continue
            </h3>
            <p className="text-amber-600 text-sm sm:text-base">
              Please select session, class, section{activeTab === 'marks' ? ', and subject' : ''} to view student data.
            </p>
            {activeTab === 'marks' && selectedSession && selectedClass && selectedSection && assignedSubjects.length === 0 && !loadingSubjects && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg max-w-md mx-auto">
                <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-red-800 font-medium">No subjects assigned to this class</p>
                <p className="text-xs text-red-600 mt-1">Please contact the administrator to assign subjects to this class.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="thin-scrollbar">
            {activeTab === 'marks' && (
              <MarksEntry
                sessionId={selectedSession}
                classId={selectedClass}
                sectionId={selectedSection}
                subjectId={selectedSubject}
              />
            )}
            {activeTab === 'cocurricular' && hasCocurricular && (
              <CocurricularEntry
                sessionId={selectedSession}
                classId={selectedClass}
                sectionId={selectedSection}
                cocurricularSubjects={cocurricularSubjects}
              />
            )}
            {activeTab === 'optional' && hasOptional && (
              <OptionalFieldMarksEntry
                sessionId={selectedSession}
                classId={selectedClass}
                sectionId={selectedSection}
              />
            )}
            {activeTab === 'marksheet' && (
              <MarksheetGeneration
                sessionId={selectedSession}
                classId={selectedClass}
                sectionId={selectedSection}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}