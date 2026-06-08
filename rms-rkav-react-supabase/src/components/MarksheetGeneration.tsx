"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Download, User, Users, FileText, Loader2, Printer } from "lucide-react"
import {
  sessionsApi,
  classesApi,
  sectionsApi,
  studentsApi,
  studentResultsApi,
  cocurricularResultsApi,
  optionalResultsApi,
  classCocurricularConfigApi,
  marksheetApi,
} from "../lib/index"
import type {
  Student,
  StudentResult,
  Subject,
  Class,
  Section,
  Session,
  StudentCocurricularResult,
  CocurricularSubject,
  StudentOptionalResult,
} from "../lib/types"

interface Props {
  sessionId: string
  classId: string
  sectionId: string
}

interface StudentWithResults extends Student {
  results: (StudentResult & { subject?: Subject })[]
  cocurricularResults: (StudentCocurricularResult & { cocurricular_subject?: CocurricularSubject })[]
  optionalResults: StudentOptionalResult[]
  totalMarks: number
  totalFullMarks: number
  percentage: number
  overallGrade: string
  position?: number
}

type GenerationType = "single" | "multiple" | "bulk"

export const MarksheetGeneration: React.FC<Props> = ({ sessionId, classId, sectionId }) => {
  const [students, setStudents] = useState<StudentWithResults[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [generationType, setGenerationType] = useState<GenerationType>("single")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [sessionData, setSessionData] = useState<Session | null>(null)
  const [classData, setClassData] = useState<Class | null>(null)
  const [sectionData, setSectionData] = useState<Section | null>(null)
  const [hasCocurricular, setHasCocurricular] = useState<boolean>(false)
  const [hasOptional, setHasOptional] = useState<boolean>(false)
  const [generatedHTML, setGeneratedHTML] = useState<string>("")
  const [showPreview, setShowPreview] = useState(false)
  const [convertingToPDF, setConvertingToPDF] = useState(false)

  useEffect(() => {
    if (sessionId && classId && sectionId) {
      fetchStudentsWithResults()
      fetchMetadata()
      checkCocurricularConfig()
      checkOptionalConfig()
    }
  }, [sessionId, classId, sectionId]) // Fixed: Added dependencies

  const fetchMetadata = async () => {
    try {
      const [sessionRes, classRes, sectionRes] = await Promise.all([
        sessionsApi.getById(sessionId),
        classesApi.getById(classId),
        sectionsApi.getById(sectionId),
      ])

      if (sessionRes) setSessionData(sessionRes)
      if (classRes) setClassData(classRes)
      if (sectionRes) setSectionData(sectionRes)
    } catch (error) {
      console.error("Error fetching metadata:", error)
    }
  }

  const checkCocurricularConfig = async () => {
    try {
      const data = await classCocurricularConfigApi.getByClass(classId)
      setHasCocurricular(data?.has_cocurricular || false)
    } catch (error) {
      setHasCocurricular(false)
    }
  }

  const checkOptionalConfig = async () => {
    try {
      // Check if there are any optional results for this class/session
      const data = await optionalResultsApi.getAllUnpaginated({ session_id: sessionId })
      setHasOptional(data && data.length > 0)
    } catch (error) {
      setHasOptional(false)
    }
  }

  const fetchStudentsWithResults = async () => {
    setLoading(true)
    try {
      // Fetch students
      const studentsData = await studentsApi.getByFilters(sessionId, classId, sectionId)

      // Fetch all results for these students
      const studentIds = studentsData?.map((s) => s.id) || []
      
      // Get all results
      const [resultsResponse, cocurricularData, optionalData] = await Promise.all([
        Promise.all(
          studentIds.map(id => 
            studentResultsApi.getAll({ student_id: id, session_id: sessionId })
          )
        ),
        cocurricularResultsApi.getAllUnpaginated({ session_id: sessionId }),
        optionalResultsApi.getAllUnpaginated({ session_id: sessionId }),
      ])

      // Flatten results
      const resultsData = resultsResponse.flatMap(r => r.results || [])

      // Process and combine data
      const studentsWithResults =
        studentsData?.map((student) => {
          const studentResults = resultsData?.filter((r) => r.student_id === student.id) || []
          const studentCocurricularResults = cocurricularData?.filter((r) => r.student_id === student.id) || []
          const studentOptionalResults = optionalData?.filter((r) => r.student_id === student.id) || []

          // Calculate total marks including optional subjects
          const regularTotalMarks = studentResults.reduce((sum, result) => sum + (result.total_marks || 0), 0)
          const optionalTotalMarks = studentOptionalResults.reduce((sum, result) => sum + (result.obtained_marks || 0), 0)
          const totalMarks = regularTotalMarks + optionalTotalMarks

          // Calculate total full marks including optional subjects
          const regularTotalFullMarks = studentResults.reduce((sum, result) => {
            return (
              sum +
              (result.first_summative_full || 0) +
              (result.first_formative_full || 0) +
              (result.second_summative_full || 0) +
              (result.second_formative_full || 0) +
              (result.third_summative_full || 0) +
              (result.third_formative_full || 0)
            )
          }, 0)
          const optionalTotalFullMarks = studentOptionalResults.reduce((sum, result) => sum + (result.full_marks || 0), 0)
          const totalFullMarks = regularTotalFullMarks + optionalTotalFullMarks

          const percentage = totalFullMarks > 0 ? (totalMarks / totalFullMarks) * 100 : 0
          const overallGrade = calculateOverallGrade(percentage)

          return {
            ...student,
            results: studentResults as any,
            cocurricularResults: studentCocurricularResults as any,
            optionalResults: studentOptionalResults,
            totalMarks,
            totalFullMarks,
            percentage,
            overallGrade,
          }
        }) || []

      // Calculate positions based on total percentage including optional subjects
      const sortedStudents = [...studentsWithResults].sort((a, b) => b.percentage - a.percentage)
      sortedStudents.forEach((student, index) => {
        student.position = index + 1
      })

      setStudents(studentsWithResults)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateOverallGrade = (percentage: number): string => {
    if (percentage >= 90) return "AA"
    if (percentage >= 75) return "A+"
    if (percentage >= 60) return "A"
    if (percentage >= 45) return "B+"
    if (percentage >= 34) return "B"
    if (percentage >= 25) return "C"
    return "D"
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      let studentsToGenerate: string[] = []
      switch (generationType) {
        case "single":
          if (selectedStudents.length === 1) {
            studentsToGenerate = selectedStudents
          }
          break
        case "multiple":
          studentsToGenerate = selectedStudents
          break
        case "bulk":
          studentsToGenerate = students.map((s) => s.id)
          break
      }

      if (studentsToGenerate.length === 0) {
        alert("Please select students to generate marksheets.")
        return
      }

      // Call Django API for marksheet generation
      const marksheetData = await marksheetApi.getClassMarksheet({
        session_id: sessionId,
        class_id: classId,
        section_id: sectionId,
      })
      
      // Filter to selected students
      const selectedMarksheetData = marksheetData.filter(s => studentsToGenerate.includes(s.id))
      
      // Generate HTML from the marksheet data (local generation)
      const html = generateMarksheetHTML(selectedMarksheetData)

      // Store generated HTML and show preview with options
      setGeneratedHTML(html)
      setShowPreview(true)
    } catch (error) {
      console.error("Error generating marksheets:", error)
      alert("Error generating marksheets. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  // Generate HTML for marksheets locally
  const generateMarksheetHTML = (studentsData: any[]): string => {
    // This is a simplified HTML generator - you can expand it to match your design
    const pages = studentsData.map((student, index) => `
      <div class="marksheet-page" style="page-break-after: ${index < studentsData.length - 1 ? 'always' : 'auto'}; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="text-align: center;">Marksheet</h1>
        <h2 style="text-align: center;">${sessionData?.name || ''}</h2>
        <p><strong>Name:</strong> ${student.name}</p>
        <p><strong>Roll No:</strong> ${student.roll_no}</p>
        <p><strong>Class:</strong> ${classData?.name || ''} - ${sectionData?.name || ''}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid #000; padding: 8px;">Subject</th>
              <th style="border: 1px solid #000; padding: 8px;">Marks</th>
              <th style="border: 1px solid #000; padding: 8px;">Grade</th>
            </tr>
          </thead>
          <tbody>
            ${student.results?.map((r: any) => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">${r.subject?.name || 'Unknown'}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${r.total_marks}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${r.grade}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        <div style="margin-top: 20px;">
          <p><strong>Total Marks:</strong> ${student.total_marks || student.totalMarks || 0} / ${student.total_full_marks || student.totalFullMarks || 0}</p>
          <p><strong>Percentage:</strong> ${(student.percentage || 0).toFixed(2)}%</p>
          <p><strong>Position:</strong> ${student.position || '-'}</p>
        </div>
      </div>
    `)
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Marksheet</title>
          <style>
            @media print {
              .marksheet-page { page-break-after: always; }
              .marksheet-page:last-child { page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          ${pages.join('')}
        </body>
      </html>
    `
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(generatedHTML)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const convertToPDF = async () => {
    setConvertingToPDF(true)
    try {
      // Check if libraries are available
      if (typeof window === "undefined") {
        throw new Error("PDF conversion is only available in browser environment")
      }

      // Import libraries with better error handling
      let jsPDF, html2canvas

      try {
        const jsPDFModule = await import("jspdf")
        const html2canvasModule = await import("html2canvas")

        jsPDF = jsPDFModule.jsPDF
        html2canvas = html2canvasModule.default

        if (!jsPDF || !html2canvas) {
          throw new Error("Failed to load PDF conversion libraries")
        }
      } catch (importError) {
        console.error("Error importing PDF libraries:", importError)
        throw new Error("Failed to load PDF conversion libraries. Please try the print option instead.")
      }

      // Create a temporary container with better styling
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = generatedHTML
      tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 794px;
        background-color: white;
        font-family: Arial, sans-serif;
        line-height: 1.4;
        color: #000;
      `

      document.body.appendChild(tempDiv)

      // Wait for fonts and images to load
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Convert to canvas with optimized settings
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5, // Reduced scale for better performance
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: 1123,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123,
        onclone: (clonedDoc) => {
          // Ensure all styles are applied in the cloned document
          const clonedDiv = clonedDoc.querySelector("div")
          if (clonedDiv) {
            clonedDiv.style.width = "794px"
            clonedDiv.style.backgroundColor = "white"
          }
        },
      })

      // Remove temporary div
      document.body.removeChild(tempDiv)

      if (!canvas) {
        throw new Error("Failed to create canvas from HTML")
      }

      // Create PDF with proper dimensions
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgData = canvas.toDataURL("image/png", 0.95)

      if (!imgData || imgData === "data:,") {
        throw new Error("Failed to convert canvas to image")
      }

      // Calculate dimensions to fit A4
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const canvasAspectRatio = canvas.height / canvas.width
      const pdfAspectRatio = pdfHeight / pdfWidth

      let imgWidth, imgHeight, imgX, imgY

      if (canvasAspectRatio > pdfAspectRatio) {
        // Canvas is taller relative to its width than PDF
        imgHeight = pdfHeight
        imgWidth = imgHeight / canvasAspectRatio
        imgX = (pdfWidth - imgWidth) / 2
        imgY = 0
      } else {
        // Canvas is wider relative to its height than PDF
        imgWidth = pdfWidth
        imgHeight = imgWidth * canvasAspectRatio
        imgX = 0
        imgY = (pdfHeight - imgHeight) / 2
      }

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth, imgHeight, "", "FAST")

      // Generate filename
      let filename = ""
      if (generationType === "single" && selectedStudents.length === 1) {
        const student = students.find((s) => s.id === selectedStudents[0])
        filename = `${student?.name.replace(/\s+/g, "_")}_${student?.roll_no}_marksheet_${sessionData?.name}.pdf`
      } else if (generationType === "multiple") {
        filename = `selected_students_marksheets_${classData?.name}_${sectionData?.name}_${sessionData?.name}.pdf`
      } else {
        filename = `all_students_marksheets_${classData?.name}_${sectionData?.name}_${sessionData?.name}.pdf`
      }

      // Save PDF
      pdf.save(filename)
    } catch (error) {
      console.error("Error converting to PDF:", error)

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(
        `Error converting to PDF: ${errorMessage}\n\nPlease try the print option instead, or refresh the page and try again.`,
      )
    } finally {
      setConvertingToPDF(false)
    }
  }

  const handleDownloadPDF = async () => {
    await convertToPDF()
  }

  const toggleStudentSelection = (studentId: string) => {
    if (generationType === "single") {
      setSelectedStudents([studentId])
    } else {
      setSelectedStudents((prev) =>
        prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
      )
    }
  }

  const selectAllStudents = () => {
    setSelectedStudents(students.map((s) => s.id))
  }

  const clearSelection = () => {
    setSelectedStudents([])
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_no.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl lg:text-2xl font-bold text-amber-900">Professional Marksheet Generation</h2>
        <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
          PDF Generation by Clustrix.tech
        </div>
      </div>

      {/* Generation Type Selection */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-amber-900 mb-4">Generation Type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { type: "single", icon: User, label: "Individual", desc: "Single student marksheet" },
            { type: "multiple", icon: Users, label: "Multiple", desc: "Selected students" },
            { type: "bulk", icon: FileText, label: "Bulk", desc: "All students in section" },
          ].map(({ type, icon: Icon, label, desc }) => (
            <button
              key={type}
              onClick={() => setGenerationType(type as GenerationType)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                generationType === type
                  ? "border-amber-500 bg-amber-50 text-amber-900"
                  : "border-amber-200 hover:border-amber-300 text-amber-700"
              }`}
            >
              <Icon className="w-6 h-6 mb-2" />
              <div className="font-medium">{label}</div>
              <div className="text-sm text-amber-600">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Selection */}
      {(generationType === "single" || generationType === "multiple") && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h3 className="text-lg font-semibold text-amber-900">Select Students</h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllStudents}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium px-3 py-1 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium px-3 py-1 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gradient-to-r from-amber-50 to-amber-100 border-b-2 border-amber-200">
              <tr>
                {(generationType === "single" || generationType === "multiple") && (
                  <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Select
                  </th>
                )}
                <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                  Roll No
                </th>
                <th className="px-2 lg:px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider hidden md:table-cell">
                  Total Marks
                </th>
                <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider hidden md:table-cell">
                  Percentage
                </th>
                <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                  Overall Grade
                </th>
                <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider hidden md:table-cell">
                  Position
                </th>
                <th className="px-2 lg:px-4 py-3 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider hidden md:table-cell">
                  Subjects
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {filteredStudents.map((student, index) => (
                <tr
                  key={student.id}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-amber-50/30"} hover:bg-amber-50 transition-colors`}
                >
                  {(generationType === "single" || generationType === "multiple") && (
                    <td className="px-2 lg:px-4 py-3">
                      <input
                        type={generationType === "single" ? "radio" : "checkbox"}
                        name={generationType === "single" ? "selectedStudent" : undefined}
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                      />
                    </td>
                  )}
                  <td className="px-2 lg:px-4 py-3 text-sm font-bold text-amber-900">{student.roll_no}</td>
                  <td className="px-2 lg:px-4 py-3 text-sm text-amber-900">
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-amber-600 md:hidden mt-1">
                        {student.totalMarks}/{student.totalFullMarks} • {student.percentage.toFixed(1)}% • Grade:{" "}
                        {student.overallGrade} • Pos: {student.position || "--"}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 lg:px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-sm font-medium text-amber-900">
                      {student.totalMarks}/{student.totalFullMarks}
                    </span>
                  </td>
                  <td className="px-2 lg:px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-sm font-bold text-amber-900">{student.percentage.toFixed(1)}%</span>
                  </td>
                  <td className="px-2 lg:px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border-2 ${
                        student.overallGrade === "AA" || student.overallGrade === "A+"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : student.overallGrade === "A" || student.overallGrade === "B+"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : student.overallGrade === "B" || student.overallGrade === "C"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : "bg-red-100 text-red-800 border-red-300"
                      }`}
                    >
                      {student.overallGrade}
                    </span>
                  </td>
                  <td className="px-2 lg:px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-sm font-bold text-amber-900 bg-amber-100 px-2 py-1 rounded">
                      #{student.position || "--"}
                    </span>
                  </td>
                  <td className="px-2 lg:px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-sm text-amber-600">
                      {student.results.length} subjects
                      {hasCocurricular && student.cocurricularResults.length > 0 && (
                        <span className="block text-xs text-blue-600">
                          + {student.cocurricularResults.length} co-curricular
                        </span>
                      )}
                      {hasOptional && student.optionalResults.length > 0 && (
                        <span className="block text-xs text-green-600">
                          + {student.optionalResults.length} optional
                        </span>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-amber-900 mb-2">No Students Found</h3>
            <p className="text-amber-600">
              {searchTerm
                ? "No students match your search criteria."
                : "No students available for marksheet generation."}
            </p>
          </div>
        )}
      </div>

      {/* Generation Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={
            generating ||
            (generationType === "single" && selectedStudents.length !== 1) ||
            (generationType === "multiple" && selectedStudents.length === 0)
          }
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 focus:ring-4 focus:ring-amber-300 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-amber-800 shadow-lg font-semibold"
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {generating ? "Generating Marksheet..." : "Generate Marksheet(s)"}
        </button>
      </div>

      {/* Print/Download Options Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-4">Marksheet Generated Successfully!</h3>
              <p className="text-amber-700 mb-6">Choose how you want to proceed with your marksheet(s):</p>

              <div className="space-y-3">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Print Marksheet(s)
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={convertingToPDF}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {convertingToPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {convertingToPDF ? "Converting to PDF..." : "Download as PDF"}
                </button>

                <button
                  onClick={() => setShowPreview(false)}
                  className="w-full px-4 py-3 text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  Close
                </button>
              </div>

              {/* PDF Conversion Info */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> PDF conversion happens in your browser for security. If PDF download fails,
                  please use the print option and save as PDF from your browser's print dialog.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
