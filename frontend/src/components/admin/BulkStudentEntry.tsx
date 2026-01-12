import React, { useState, useEffect } from 'react'
import { 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Save, 
  FileSpreadsheet, 
  Users, 
  AlertCircle,
  CheckCircle,
  X,
  Edit3
} from 'lucide-react'
import { studentsApi, classesApi, sectionsApi, sessionsApi } from '../../lib/index'
import type { Student, Class, Section, Session } from '../../lib/types'
import * as XLSX from 'xlsx'

interface BulkStudentData {
  roll_no: string
  name: string
  class_name?: string
  section_name?: string
  session_name?: string
  errors?: string[]
}

interface Props {
  onClose: () => void
}

export const BulkStudentEntry: React.FC<Props> = ({ onClose }) => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedSection, setSelectedSection] = useState<string>('')
  const [bulkData, setBulkData] = useState<BulkStudentData[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState<string>('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchSections()
    }
  }, [selectedClass])

  const fetchInitialData = async () => {
    try {
      const [sessionsData, classesData] = await Promise.all([
        sessionsApi.getAll(),
        classesApi.getAll()
      ])

      setSessions(sessionsData)
      setClasses(classesData)
    } catch (error) {
      console.error('Error fetching initial data:', error)
    }
  }

  const fetchSections = async () => {
    try {
      const data = await sectionsApi.getByClass(selectedClass)
      setSections(data)
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  // Initialize with empty rows for manual entry
  const initializeManualEntry = () => {
    const emptyRows = Array.from({ length: 10 }, (_, index) => ({
      roll_no: '',
      name: ''
    }))
    setBulkData(emptyRows)
  }

  useEffect(() => {
    if (activeTab === 'manual' && bulkData.length === 0) {
      initializeManualEntry()
    }
  }, [activeTab])

  // Add new row for manual entry
  const addNewRow = () => {
    setBulkData(prev => [...prev, { roll_no: '', name: '' }])
  }

  // Remove row
  const removeRow = (index: number) => {
    setBulkData(prev => prev.filter((_, i) => i !== index))
  }

  // Update row data
  const updateRow = (index: number, field: keyof BulkStudentData, value: string) => {
    setBulkData(prev => prev.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ))
  }

  // Download Excel template
  const downloadTemplate = () => {
    const templateData = [
      {
        roll_no: '001',
        name: 'John Doe',
        class_name: '10th',
        section_name: 'A',
        session_name: '2023-24'
      },
      {
        roll_no: '002',
        name: 'Jane Smith',
        class_name: '10th',
        section_name: 'A',
        session_name: '2023-24'
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 15 }, // roll_no
      { width: 25 }, // name
      { width: 15 }, // class_name
      { width: 15 }, // section_name
      { width: 15 }  // session_name
    ]

    XLSX.writeFile(workbook, 'student_template.xlsx')
  }

  // Export current students
  const exportStudents = async () => {
    if (!selectedSession || !selectedClass || !selectedSection) {
      alert('Please select session, class, and section first')
      return
    }

    try {
      setLoading(true)
      const students = await studentsApi.getByFilters(selectedSession, selectedClass, selectedSection)

      const exportData = students?.map(student => ({
        roll_no: student.roll_no,
        name: student.name,
        class_name: student.class_info?.name || classes.find(c => c.id === student.class_id)?.name,
        section_name: student.section_info?.name || sections.find(s => s.id === student.section_id)?.name,
        session_name: student.session_info?.name || sessions.find(s => s.id === student.session_id)?.name
      })) || []

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')
      
      worksheet['!cols'] = [
        { width: 15 }, { width: 25 }, { width: 15 }, { width: 15 }, { width: 15 }
      ]

      const className = classes.find(c => c.id === selectedClass)?.name
      const sectionName = sections.find(s => s.id === selectedSection)?.name
      const sessionName = sessions.find(s => s.id === selectedSession)?.name

      XLSX.writeFile(workbook, `students_${className}_${sectionName}_${sessionName}.xlsx`)
    } catch (error) {
      console.error('Error exporting students:', error)
      alert('Error exporting students. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as BulkStudentData[]

        // Validate and process data
        const processedData = jsonData.map(row => ({
          roll_no: String(row.roll_no || '').trim(),
          name: String(row.name || '').trim(),
          class_name: String(row.class_name || '').trim(),
          section_name: String(row.section_name || '').trim(),
          session_name: String(row.session_name || '').trim()
        }))

        setBulkData(processedData)
        setActiveTab('import')
        setSuccessMessage(`Successfully imported ${processedData.length} rows from Excel file`)
      } catch (error) {
        console.error('Error reading file:', error)
        alert('Error reading Excel file. Please check the file format.')
      } finally {
        setImporting(false)
        // Reset file input
        event.target.value = ''
      }
    }

    reader.readAsArrayBuffer(file)
  }

  // Validate data before saving with section-specific roll number validation
  const validateData = async (): Promise<boolean> => {
    const errors: string[] = []
    
    // Filter out empty rows
    const validRows = bulkData.filter(row => row.roll_no.trim() || row.name.trim())

    if (validRows.length === 0) {
      errors.push('No valid student data found')
      setValidationErrors(errors)
      return false
    }

    // Group students by class, section, and session for validation
    const studentGroups = new Map<string, BulkStudentData[]>()
    
    validRows.forEach((row, index) => {
      const rowErrors: string[] = []

      // Required field validation
      if (!row.roll_no.trim()) {
        rowErrors.push('Roll number is required')
      }
      if (!row.name.trim()) {
        rowErrors.push('Student name is required')
      }

      // For import mode, validate class/section/session names and check if they exist
      if (activeTab === 'import') {
        if (!row.class_name?.trim()) {
          rowErrors.push('Class name is required')
        } else {
          // Check if class exists
          const classExists = classes.find(c => c.name === row.class_name?.trim())
          if (!classExists) {
            rowErrors.push(`Class "${row.class_name}" does not exist`)
          }
        }

        if (!row.section_name?.trim()) {
          rowErrors.push('Section name is required')
        }

        if (!row.session_name?.trim()) {
          rowErrors.push('Session name is required')
        } else {
          // Check if session exists
          const sessionExists = sessions.find(s => s.name === row.session_name?.trim())
          if (!sessionExists) {
            rowErrors.push(`Session "${row.session_name}" does not exist`)
          }
        }
      }

      // Create group key for validation
      let groupKey = ''
      if (activeTab === 'manual') {
        const className = classes.find(c => c.id === selectedClass)?.name || ''
        const sectionName = sections.find(s => s.id === selectedSection)?.name || ''
        const sessionName = sessions.find(s => s.id === selectedSession)?.name || ''
        groupKey = `${className}-${sectionName}-${sessionName}`
      } else {
        groupKey = `${row.class_name}-${row.section_name}-${row.session_name}`
      }

      // Add to group for duplicate checking
      if (!studentGroups.has(groupKey)) {
        studentGroups.set(groupKey, [])
      }
      studentGroups.get(groupKey)!.push({ ...row, errors: rowErrors })

      if (rowErrors.length > 0) {
        errors.push(`Row ${index + 1}: ${rowErrors.join(', ')}`)
      }
    })

    // Check for duplicate roll numbers within each group (class-section-session)
    studentGroups.forEach((students, groupKey) => {
      const rollNumbers = new Map<string, number[]>()
      
      students.forEach((student, index) => {
        if (student.roll_no.trim()) {
          const rollNo = student.roll_no.trim()
          if (!rollNumbers.has(rollNo)) {
            rollNumbers.set(rollNo, [])
          }
          rollNumbers.get(rollNo)!.push(index)
        }
      })

      // Report duplicates within this group
      rollNumbers.forEach((indices, rollNo) => {
        if (indices.length > 1) {
          const [className, sectionName, sessionName] = groupKey.split('-')
          errors.push(`Duplicate roll number "${rollNo}" found in ${className} - ${sectionName} (${sessionName}) at multiple rows`)
        }
      })
    })

    // Check against existing students in database for each group
    for (const [groupKey, students] of studentGroups) {
      const [className, sectionName, sessionName] = groupKey.split('-')
      
      try {
        // Find the IDs for this group
        const session = sessions.find(s => s.name === sessionName)
        const cls = classes.find(c => c.name === className)
        
        if (!session || !cls) continue

        // Get sections for this class
        const classSections = await sectionsApi.getByClass(cls.id)

        const section = classSections?.find(s => s.name === sectionName)
        if (!section) {
          // Add error for non-existent section
          errors.push(`Section "${sectionName}" does not exist for class "${className}"`)
          continue
        }

        // Check existing students in this specific class-section-session
        const existingStudents = await studentsApi.getByFilters(session.id, cls.id, section.id)

        if (existingStudents) {
          const existingRollNumbers = new Set(existingStudents.map(s => s.roll_no))
          
          students.forEach(student => {
            if (student.roll_no.trim() && existingRollNumbers.has(student.roll_no.trim())) {
              errors.push(`Roll number "${student.roll_no}" already exists in ${className} - ${sectionName} (${sessionName})`)
            }
          })
        }
      } catch (error) {
        console.error('Error checking existing students:', error)
        errors.push(`Error validating against existing students for ${groupKey}`)
      }
    }

    // For manual mode, check if session/class/section are selected
    if (activeTab === 'manual') {
      if (!selectedSession) errors.push('Please select a session')
      if (!selectedClass) errors.push('Please select a class')
      if (!selectedSection) errors.push('Please select a section')
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  // Optimized bulk save with single transaction
  const saveStudents = async () => {
    const isValid = await validateData()
    if (!isValid) return

    setSaving(true)
    try {
      const validRows = bulkData.filter(row => row.roll_no.trim() && row.name.trim())
      
      if (validRows.length === 0) {
        throw new Error('No valid students to insert')
      }

      // Prepare all student records for bulk insert
      const studentsToInsert = []
      const lookupCache = new Map<string, { sessionId: string, classId: string, sectionId: string }>()

      // Pre-fetch all required data for import mode to avoid multiple queries
      if (activeTab === 'import') {
        // Create lookup maps for better performance
        const sessionMap = new Map(sessions.map(s => [s.name, s.id]))
        const classMap = new Map(classes.map(c => [c.name, c.id]))
        
        // Get all sections for all classes at once
        const allSectionsPromises = classes.map(cls => sectionsApi.getByClass(cls.id))
        const allSectionsArrays = await Promise.all(allSectionsPromises)
        const allSections = allSectionsArrays.flat()
        
        const sectionMap = new Map<string, Map<string, string>>()
        allSections?.forEach(section => {
          if (!sectionMap.has(section.class_id)) {
            sectionMap.set(section.class_id, new Map())
          }
          sectionMap.get(section.class_id)!.set(section.name, section.id)
        })

        // Process each row and build lookup cache
        for (const row of validRows) {
          const cacheKey = `${row.class_name}-${row.section_name}-${row.session_name}`
          
          if (!lookupCache.has(cacheKey)) {
            const sessionId = sessionMap.get(row.session_name!)
            const classId = classMap.get(row.class_name!)
            const sectionId = classId ? sectionMap.get(classId)?.get(row.section_name!) : undefined

            if (sessionId && classId && sectionId) {
              lookupCache.set(cacheKey, { sessionId, classId, sectionId })
            } else {
              console.warn(`Skipping row: Invalid class/section/session combination for ${row.name}`)
              continue
            }
          }

          const lookup = lookupCache.get(cacheKey)!
          studentsToInsert.push({
            roll_no: row.roll_no.trim(),
            name: row.name.trim(),
            class_id: lookup.classId,
            section_id: lookup.sectionId,
            session_id: lookup.sessionId
          })
        }
      } else {
        // Manual mode - use selected values
        for (const row of validRows) {
          studentsToInsert.push({
            roll_no: row.roll_no.trim(),
            name: row.name.trim(),
            class_id: selectedClass,
            section_id: selectedSection,
            session_id: selectedSession
          })
        }
      }

      if (studentsToInsert.length === 0) {
        throw new Error('No valid students to insert after processing')
      }

      // Perform bulk insert in a single operation
      console.log(`Inserting ${studentsToInsert.length} students in bulk...`)
      
      const data = await studentsApi.bulkCreate(studentsToInsert)

      console.log(`Successfully inserted ${data?.length || studentsToInsert.length} students`)
      setSuccessMessage(`Successfully added ${studentsToInsert.length} students in bulk operation!`)
      
      // Reset form after successful save
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Error saving students:', error)
      
      // Enhanced error handling
      let errorMessage = 'Error saving students. Please try again.'
      
      if (error.message?.includes('duplicate key')) {
        errorMessage = 'Some students already exist with the same roll number in their respective class/section/session.'
      } else if (error.message?.includes('foreign key')) {
        errorMessage = 'Invalid class, section, or session reference. Please check your data.'
      } else if (error.message?.includes('violates check constraint')) {
        errorMessage = 'Data validation failed. Please check all required fields.'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-amber-600" />
            <h2 className="text-2xl font-bold text-amber-900">Bulk Student Entry</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">Validation Errors:</span>
            </div>
            <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-amber-200">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'manual'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-amber-500 hover:text-amber-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Manual Entry
            </div>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-amber-500 hover:text-amber-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Excel Import
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Controls */}
          <div className="p-6 border-b border-amber-200">
            <div className="flex flex-wrap items-center gap-4">
              {/* Manual Entry Controls */}
              {activeTab === 'manual' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-amber-900">Session:</label>
                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="px-3 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select Session</option>
                      {sessions.map(session => (
                        <option key={session.id} value={session.id}>{session.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-amber-900">Class:</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="px-3 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-amber-900">Section:</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      disabled={!selectedClass}
                      className="px-3 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                    >
                      <option value="">Select Section</option>
                      {sections.map(section => (
                        <option key={section.id} value={section.id}>{section.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={addNewRow}
                    className="flex items-center gap-2 px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Row
                  </button>
                </>
              )}

              {/* Import Controls */}
              {activeTab === 'import' && (
                <>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>

                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {importing ? 'Importing...' : 'Import Excel'}
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileImport}
                      className="hidden"
                      disabled={importing}
                    />
                  </label>
                </>
              )}

              {/* Export Button */}
              <button
                onClick={exportStudents}
                disabled={loading || !selectedSession || !selectedClass || !selectedSection}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {loading ? 'Exporting...' : 'Export Current'}
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto p-6">
            <div className="border border-amber-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-amber-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">
                      Roll No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">
                      Student Name
                    </th>
                    {activeTab === 'import' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">
                          Class
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">
                          Section
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase">
                          Session
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {bulkData.map((row, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'} ${row.errors?.length ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.roll_no}
                          onChange={(e) => updateRow(index, 'roll_no', e.target.value)}
                          className={`w-full px-2 py-1 border rounded focus:ring-2 focus:ring-amber-500 ${
                            row.errors?.some(e => e.includes('Roll number')) ? 'border-red-300' : 'border-amber-300'
                          }`}
                          placeholder="001"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateRow(index, 'name', e.target.value)}
                          className={`w-full px-2 py-1 border rounded focus:ring-2 focus:ring-amber-500 ${
                            row.errors?.some(e => e.includes('name')) ? 'border-red-300' : 'border-amber-300'
                          }`}
                          placeholder="Student Name"
                        />
                      </td>
                      {activeTab === 'import' && (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.class_name || ''}
                              onChange={(e) => updateRow(index, 'class_name', e.target.value)}
                              className={`w-full px-2 py-1 border rounded focus:ring-2 focus:ring-amber-500 ${
                                row.errors?.some(e => e.includes('Class')) ? 'border-red-300' : 'border-amber-300'
                              }`}
                              placeholder="10th"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.section_name || ''}
                              onChange={(e) => updateRow(index, 'section_name', e.target.value)}
                              className={`w-full px-2 py-1 border rounded focus:ring-2 focus:ring-amber-500 ${
                                row.errors?.some(e => e.includes('Section')) ? 'border-red-300' : 'border-amber-300'
                              }`}
                              placeholder="A"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.session_name || ''}
                              onChange={(e) => updateRow(index, 'session_name', e.target.value)}
                              className={`w-full px-2 py-1 border rounded focus:ring-2 focus:ring-amber-500 ${
                                row.errors?.some(e => e.includes('Session')) ? 'border-red-300' : 'border-amber-300'
                              }`}
                              placeholder="2023-24"
                            />
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeRow(index)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-amber-200">
          <div className="text-sm text-amber-600">
            {bulkData.filter(row => row.roll_no.trim() || row.name.trim()).length} students ready to save
            {saving && (
              <span className="ml-2 text-blue-600 font-medium">
                • Performing bulk insert operation...
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveStudents}
              disabled={saving || bulkData.filter(row => row.roll_no.trim() && row.name.trim()).length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Bulk Saving...' : 'Save Students'}
            </button>
          </div>
        </div>

        {/* Performance Info */}
        <div className="px-6 pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Optimized Bulk Operations</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Using single-transaction bulk insert for maximum performance. All students are validated and inserted in one operation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}