import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization"),
          },
        },
      }
    );
    const { type, sessionId, classId, sectionId, studentIds } =
      await req.json();
    // Fetch students based on type
    let studentsQuery = supabaseClient
      .from("students")
      .select(
        `
        *,
        class:classes(*),
        section:sections(*),
        session:sessions(*)
      `
      )
      .eq("session_id", sessionId)
      .eq("class_id", classId)
      .eq("section_id", sectionId)
      .order("roll_no");
    if (type === "single" || type === "multiple") {
      if (!studentIds || studentIds.length === 0) {
        throw new Error("Student IDs required for single/multiple generation");
      }
      studentsQuery = studentsQuery.in("id", studentIds);
    }
    const { data: studentsData, error: studentsError } = await studentsQuery;
    if (studentsError) throw studentsError;
    if (!studentsData || studentsData.length === 0) {
      throw new Error("No students found");
    }
    const studentIds_final = studentsData.map((s) => s.id);

    // Fetch ALL students in the class/section for proper position calculation
    const { data: allClassStudents, error: allStudentsError } =
      await supabaseClient
        .from("students")
        .select("id")
        .eq("session_id", sessionId)
        .eq("class_id", classId)
        .eq("section_id", sectionId);

    if (allStudentsError) throw allStudentsError;
    const allStudentIds = allClassStudents?.map((s) => s.id) || [];
    // Fetch school config and marks distribution
    const [schoolConfigData, marksDistributionData] = await Promise.all([
      supabaseClient
        .from("school_config")
        .select("*")
        .eq("class_id", classId)
        .eq("session_id", sessionId)
        .maybeSingle(),
      supabaseClient
        .from("class_marks_distribution")
        .select("*")
        .eq("class_id", classId)
        .maybeSingle(),
    ]);
    const totalSchoolDays = schoolConfigData.data?.total_school_days || 200;
    const marksDistribution = marksDistributionData.data;
    // Fetch results, co-curricular data, and optional data
    // Fetch results for ALL students in the class for proper ranking
    const [resultsData, allResultsData, cocurricularData, optionalData] =
      await Promise.all([
        supabaseClient
          .from("student_results")
          .select(
            `
          *,
          subject:subjects(*)
        `
          )
          .eq("session_id", sessionId)
          .in("student_id", studentIds_final),
        supabaseClient
          .from("student_results")
          .select("*")
          .eq("session_id", sessionId)
          .in("student_id", allStudentIds),
        supabaseClient
          .from("student_cocurricular_results")
          .select(
            `
          *,
          cocurricular_subject:cocurricular_subjects(*)
        `
          )
          .eq("session_id", sessionId)
          .in("student_id", studentIds_final),
        supabaseClient
          .from("student_optional_results")
          .select("*")
          .eq("session_id", sessionId)
          .in("student_id", studentIds_final),
      ]);
    if (resultsData.error) throw resultsData.error;
    if (allResultsData.error) throw allResultsData.error;
    if (cocurricularData.error) throw cocurricularData.error;
    if (optionalData.error) throw optionalData.error;
    // Process students with results
    const studentsWithResults = studentsData.map((student) => {
      const studentResults =
        resultsData.data?.filter((r) => r.student_id === student.id) || [];
      const studentCocurricularResults =
        cocurricularData.data?.filter((r) => r.student_id === student.id) || [];
      const studentOptionalResults =
        optionalData.data?.filter((r) => r.student_id === student.id) || [];
      // Calculate total marks including optional subjects
      const regularTotalMarks = studentResults.reduce(
        (sum, result) => sum + result.total_marks,
        0
      );
      const optionalTotalMarks = studentOptionalResults.reduce(
        (sum, result) => sum + result.obtained_marks,
        0
      );
      const totalMarks = regularTotalMarks + optionalTotalMarks;
      // Calculate total full marks including optional subjects
      const regularTotalFullMarks = studentResults.reduce((sum, result) => {
        return (
          sum +
          result.first_summative_full +
          result.first_formative_full +
          result.second_summative_full +
          result.second_formative_full +
          result.third_summative_full +
          result.third_formative_full
        );
      }, 0);
      const optionalTotalFullMarks = studentOptionalResults.reduce(
        (sum, result) => sum + result.full_marks,
        0
      );
      const totalFullMarks = regularTotalFullMarks + optionalTotalFullMarks;
      const percentage =
        totalFullMarks > 0 ? (totalMarks / totalFullMarks) * 100 : 0;
      const overallGrade = calculateOverallGrade(percentage);
      return {
        ...student,
        results: studentResults,
        cocurricularResults: studentCocurricularResults,
        optionalResults: studentOptionalResults,
        totalMarks,
        totalFullMarks,
        percentage,
        overallGrade,
      };
    });
    // Calculate positions based on ALL students in the class/section
    // First, calculate percentage for all students in the class
    const allStudentPercentages = allStudentIds.map((studentId) => {
      const studentResults =
        allResultsData.data?.filter((r) => r.student_id === studentId) || [];
      const totalMarks = studentResults.reduce(
        (sum, result) => sum + result.total_marks,
        0
      );
      const totalFullMarks = studentResults.reduce((sum, result) => {
        return (
          sum +
          result.first_summative_full +
          result.first_formative_full +
          result.second_summative_full +
          result.second_formative_full +
          result.third_summative_full +
          result.third_formative_full
        );
      }, 0);
      const percentage =
        totalFullMarks > 0 ? (totalMarks / totalFullMarks) * 100 : 0;
      return { studentId, percentage };
    });

    // Sort all students by percentage to determine positions
    const sortedAllStudents = [...allStudentPercentages].sort(
      (a, b) => b.percentage - a.percentage
    );

    // Assign positions to selected students based on their rank among ALL students
    studentsWithResults.forEach((student) => {
      const position =
        sortedAllStudents.findIndex((s) => s.studentId === student.id) + 1;
      student.position = position > 0 ? position : null;
    });
    // Generate HTML for each student
    const htmlPages = studentsWithResults.map((student) =>
      generateStudentHTML(student, totalSchoolDays, marksDistribution)
    );
    // Return based on type
    if (type === "single") {
      return new Response(
        JSON.stringify({
          success: true,
          html: htmlPages[0],
          student: studentsWithResults[0],
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      // For multiple and bulk, return all HTML pages
      return new Response(
        JSON.stringify({
          success: true,
          htmlPages,
          students: studentsWithResults,
          type,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.error("Error generating marksheet:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
function calculateOverallGrade(percentage) {
  if (percentage >= 90) return "AA";
  if (percentage >= 75) return "A+";
  if (percentage >= 60) return "A";
  if (percentage >= 45) return "B+";
  if (percentage >= 34) return "B";
  if (percentage >= 25) return "C";
  return "D";
}
function generateStudentHTML(student, totalSchoolDays, marksDistribution) {
  const attendanceDays =
    student.results[0]?.attendance_days || Math.floor(totalSchoolDays * 0.92);
  const attendancePercentage =
    totalSchoolDays > 0
      ? ((attendanceDays / totalSchoolDays) * 100).toFixed(1)
      : "92.5";
  // Get marks distribution from database or use defaults
  const firstSummativeFull = marksDistribution?.first_summative_marks || 40;
  const firstFormativeFull = marksDistribution?.first_formative_marks || 10;
  const secondSummativeFull = marksDistribution?.second_summative_marks || 40;
  const secondFormativeFull = marksDistribution?.second_formative_marks || 10;
  const thirdSummativeFull = marksDistribution?.third_summative_marks || 40;
  const thirdFormativeFull = marksDistribution?.third_formative_marks || 10;
  // Calculate term totals and percentages
  const firstTermTotal = firstSummativeFull + firstFormativeFull;
  const secondTermTotal = secondSummativeFull + secondFormativeFull;
  const thirdTermTotal = thirdSummativeFull + thirdFormativeFull;
  const grandTotal = firstTermTotal + secondTermTotal + thirdTermTotal; // This is the total full marks for a single subject across all terms
  // Subject priority order for marksheet rows
  const subjectPriorityOrder = [
    "bengali",
    "english",
    "sanskrit",
    "hindi",
    "math",
    "mathematics",
    "science",
    "physical science",
    "life science",
    "history",
    "geography",
  ];

  // Sort results by subject priority
  const sortedResults = [...student.results].sort((a, b) => {
    const aName = a.subject.name.toLowerCase();
    const bName = b.subject.name.toLowerCase();

    // Find priority index for each subject (check if subject name contains the priority keyword)
    let aPriority = subjectPriorityOrder.findIndex((priority) =>
      aName.includes(priority)
    );
    let bPriority = subjectPriorityOrder.findIndex((priority) =>
      bName.includes(priority)
    );

    // If not found in priority list, assign a high number to push to end
    if (aPriority === -1) aPriority = 999;
    if (bPriority === -1) bPriority = 999;

    return aPriority - bPriority;
  });

  // Generate marks table rows with dynamic full marks from database
  const marksRows = sortedResults
    .map((result) => {
      const firstTermObtained =
        result.first_summative_obtained + result.first_formative_obtained;
      const secondTermObtained =
        result.second_summative_obtained + result.second_formative_obtained;
      const thirdTermObtained =
        result.third_summative_obtained + result.third_formative_obtained;
      const subjectFullMarks =
        result.first_summative_full +
        result.first_formative_full +
        result.second_summative_full +
        result.second_formative_full +
        result.third_summative_full +
        result.third_formative_full;
      const subjectObtained =
        firstTermObtained + secondTermObtained + thirdTermObtained;
      const subjectPercentage =
        subjectObtained > 0
          ? ((result.total_marks / subjectFullMarks) * 100).toFixed(1)
          : "0.0";
      return `
      <tr>
        <td class="subject-name">${result.subject.name}</td>
        <!-- First Term -->
        <td>${result.first_summative_obtained}</td>
        <td>${result.first_formative_obtained}</td>
        <td>${firstTermObtained}</td>
        <!-- Second Term -->
        <td>${result.second_summative_obtained}</td>
        <td>${result.second_formative_obtained}</td>
        <td>${secondTermObtained}</td>
        <!-- Third Term -->
        <td>${result.third_summative_obtained}</td>
        <td>${result.third_formative_obtained}</td>
        <td>${thirdTermObtained}</td>
        <!-- Totals -->
        <td class="total-marks">${subjectObtained}</td>
        <td class="total-marks">${subjectPercentage}%</td>
        <td class="grade-cell">${calculateOverallGrade(
          parseFloat(subjectPercentage)
        )}</td>
      </tr>
    `;
    })
    .join("");
  // Generate co-curricular rows
  const hasCocurricularData = student.cocurricularResults.length > 0;
  const cocurricularRows = hasCocurricularData
    ? student.cocurricularResults
        .map((result) => {
          // Use marks columns if available, otherwise fall back to grades
          const firstTermValue =
            result.first_term_marks !== undefined
              ? result.first_term_marks
              : isNaN(Number.parseInt(result.first_term_grade))
              ? result.first_term_grade
              : Number.parseInt(result.first_term_grade);
          const secondTermValue =
            result.second_term_marks !== undefined
              ? result.second_term_marks
              : isNaN(Number.parseInt(result.second_term_grade))
              ? result.second_term_grade
              : Number.parseInt(result.second_term_grade);
          const finalTermValue =
            result.final_term_marks !== undefined
              ? result.final_term_marks
              : isNaN(Number.parseInt(result.final_term_grade))
              ? result.final_term_grade
              : Number.parseInt(result.final_term_grade);
          // Use total_marks if available, otherwise calculate
          const totalMarks =
            result.total_marks !== undefined
              ? result.total_marks
              : typeof firstTermValue === "number" &&
                typeof secondTermValue === "number" &&
                typeof finalTermValue === "number"
              ? firstTermValue + secondTermValue + finalTermValue
              : "--";
          // Assuming full marks for co-curricular is 150 based on the screenshot example (50 per term)
          const cocurricularFullMarks = 150;
          return `
    <tr>
      <td class="subject-name">${result.cocurricular_subject.name}</td>
      <td>${firstTermValue}</td>
      <td>${secondTermValue}</td>
      <td>${finalTermValue}</td>
      <td>${cocurricularFullMarks}</td>
      <td class="total-marks">${totalMarks}</td>
    </tr>
  `;
        })
        .join("")
    : "";
  // Generate optional subject rows
  const hasOptionalData = student.optionalResults.length > 0;
  const optionalRows = hasOptionalData
    ? student.optionalResults
        .map((result) => {
          const percentage =
            result.full_marks > 0
              ? ((result.obtained_marks / result.full_marks) * 100).toFixed(1)
              : "0.0";
          return `
    <tr>
      <td class="subject-name">Computer Science</td>
      <td>${result.full_marks}</td>
      <td>${result.obtained_marks}</td>
      <td>${percentage}%</td>
      <td class="grade-cell">${calculateOverallGrade(
        parseFloat(percentage)
      )}</td>
    </tr>
  `;
        })
        .join("")
    : "";
  return `<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Progress Report Card - ${student.name}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 0;
        }
        body {
            font-family: 'Arial', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .a4-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 15mm 10mm;
            box-sizing: border-box;
            background-color: white;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .header-section {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        .school-info {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
        }
        .school-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            margin-right: 20px;
            border-radius: 8px;
        }
        .school-details h1 {
            font-size: 20px;
            font-weight: bold;
            margin: 0 0 5px 0;
            color: #d97706;
        }
        .school-details p {
            font-size: 12px;
            margin: 2px 0;
            color: #374151;
        }
        .report-title {
            font-size: 20px;
            font-weight: bold;
            background-color: #dbeafe;
            color: #1e40af;
            padding: 10px;
            border: 1px solid #3b82f6;
            margin: 15px 0;
        }
        .student-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .info-item {
            display: flex;
            align-items: center;
        }
        .info-label {
            font-weight: bold;
            margin-right: 10px;
            min-width: 80px;
        }
        .info-value {
            border-bottom: 1px dashed #6b7280;
            padding-bottom: 2px;
            flex-grow: 1;
            font-weight: 600;
        }
        .marksheet-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
        }
        .marksheet-table th,
        .marksheet-table td {
            border: 1px solid #000;
            padding: 6px 4px;
            text-align: center;
            line-height: 1.2;
        }
        .marksheet-table th {
            background-color: #e5e7eb;
            font-weight: bold;
            color: #374151;
        }
        .subject-name {
            text-align: left !important;
            font-weight: 600;
            color: #374151;
            padding-left: 8px;
        }
        .total-marks {
            font-weight: bold;
            color: #1e40af;
        }
        .grade-cell {
            font-weight: bold;
            color: #059669;
        }
        .co-curricular-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .result-summary {
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-size: 14px;
        }
        .result-item {
            display: flex;
            align-items: center;
        }
        .result-label {
            font-weight: bold;
            margin-right: 10px;
            min-width: 120px;
        }
        .result-value {
            border-bottom: 1px dashed #6b7280;
            padding-bottom: 2px;
            flex-grow: 1;
            font-weight: 600;
            color: #1e40af;
        }
        .signatures-section {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 20px;
            align-items: end;
            margin-top: 30px;
        }
        .signature-box {
            border: 2px solid #374151;
            height: 60px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding: 5px;
            background: #fafafa;
            margin-bottom: 10px;
            position: relative;
        }
        .signature-image {
            position: absolute;
            top: 5px;
            left: 50%;
            transform: translateX(-50%);
            max-width: 80px;
            max-height: 50px;
            object-fit: contain;
        }
        .signature-label {
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            color: #374151;
        }
        .grade-scale {
            text-align: center;
        }
        .grade-scale-title {
            background: linear-gradient(to right, #374151, #4b5563);
            color: white;
            font-size: 12px;
            font-weight: bold;
            padding: 8px;
            margin-bottom: 0;
        }
        .grade-scale-table {
            border-collapse: collapse;
            margin: 0 auto;
        }
        .grade-scale-table td {
            border: 1px solid #374151;
            padding: 4px 8px;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
        }
        .grade-header {
            background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
        }
        .attendance-info {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 15px;
            color: #374151;
        }
        @media print {
            .a4-page {
                width: 100%;
                min-height: auto;
                padding: 10mm;
                box-shadow: none;
                margin: 0;
            }
            body {
                background-color: white;
            }
        }
        @media screen and (max-width: 768px) {
            .a4-page {
                width: 100%;
                padding: 10px;
                box-shadow: none;
            }
            .school-info {
                flex-direction: column;
                text-align: center;
            }
            .school-logo {
                margin-right: 0;
                margin-bottom: 10px;
            }
            .student-info {
                grid-template-columns: 1fr;
            }
            .signatures-section {
                grid-template-columns: 1fr;
                gap: 15px;
            }
        }
    </style></head><body>
    <div class="a4-page">
        <!-- Header Section -->
        <div class="header-section">
            <div class="school-info">
                <img src="https://drms.rkavpanagarh.in/rkav_logo.avif" alt="School Logo" class="school-logo">
                <div class="school-details">
                    <h1>RAMKRISHNA ASHRAMA VIDYAPITHA HIGH SCHOOL (Co-Ed)</h1>
                    <p><em>(Recognised by the Govt. of West Bengal and Affiliated to W.B.B.S.E)</em></p>
                    <p>DARJEELING MORE • P.O.-PANAGARH BAZAR • DIST.- PASCHIM BARDHAMAN</p>
                    <p>INDEX NO : HS-112 | Ph. No. 0343-2524494</p>
                </div>
            </div>
            <div class="attendance-info">
                <span>Total No. of effective teaching learning days: <strong>${totalSchoolDays}</strong></span>
                <span>No. of Attendance of the Student: <strong>${attendanceDays}</strong></span>
                <span>Conduct of the Student: <strong>${
                  student.results[0]?.conduct || "Good"
                }</strong></span>
            </div>
            <div class="report-title">PROGRESS REPORT CARD</div>
            <p style="font-size: 16px; font-weight: 600; margin: 10px 0; color: #374151;">
                For The Session: <strong>${student.session.name.split('-')[0]}</strong>
            </p>
        </div>
        <!-- Student Information -->
        <div class="student-info">
            <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">${student.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Class:</span>
                <span class="info-value">${student.class.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Section:</span>
                <span class="info-value">${student.section.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Roll No.:</span>
                <span class="info-value">${student.roll_no}</span>
            </div>
        </div>
        <!-- Annual Marksheet Table -->
        <table class="marksheet-table">
            <thead>
                <tr>
                    <th rowspan="2" style="width: 25%;">SUBJECT</th>
                    <th colspan="3">FIRST TERM</th>
                    <th colspan="3">SECOND TERM</th>
                    <th colspan="3">FINAL TERM </th>
                    <th rowspan="2">ANNUAL<br>TOTAL<br>(${grandTotal})</th>
                    <th rowspan="2">PERCENTAGE</th>
                    <th rowspan="2">GRADE</th>
                </tr>
                <tr>
                    <th>Summ.<br>(${firstSummativeFull})</th>
                    <th>Form.<br>(${firstFormativeFull})</th>
                    <th>Total<br>(${firstTermTotal})</th>
                    <th>Summ.<br>(${secondSummativeFull})</th>
                    <th>Form.<br>(${secondFormativeFull})</th>
                    <th>Total<br>(${secondTermTotal})</th>
                    <th>Summ.<br>(${thirdSummativeFull})</th>
                    <th>Form.<br>(${thirdFormativeFull})</th>
                    <th>Total<br>(${thirdTermTotal})</th>
                </tr>
            </thead>
            <tbody>
                ${marksRows}
                <!-- Overall Summary Row -->
                <tr style="background-color: #f9fafb; font-weight: bold;">
                    <td class="subject-name">OVERALL PERFORMANCE</td>
                    <td colspan="9" style="text-align: center; color: #374151;">
                        Total Marks: ${
                          student.totalFullMarks
                        } | Obtained Marks: ${student.totalMarks} | Position: ${
    student.position || "--"
  }
                    </td>
                    <td class="total-marks">${student.totalMarks}</td>
                    <td class="total-marks">${student.percentage.toFixed(
                      1
                    )}%</td>
                    <td class="grade-cell">${student.overallGrade}</td>
                </tr>
            </tbody>
        </table>
        <!-- Co-curricular Activities and Optional Subject Section -->
        <div class="co-curricular-section">
            <!-- Co-curricular Activities -->
            ${
              hasCocurricularData
                ? `<div>
                <table class="marksheet-table">
                    <thead>
                        <tr>
                            <th colspan="6" style="background-color: #dbeafe; color: #1e40af;">CO-CURRICULAR ACTIVITIES (MARKS)</th>
                        </tr>
                        <tr>
                            <th style="width: 40%;">ACTIVITY</th>
                            <th>1st Term</th>
                            <th>2nd Term</th>
                            <th>Final Term</th>
                            <th>Full Marks</th>
                            <th>Obtained</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cocurricularRows}
                    </tbody>
                </table>
            </div>`
                : ""
            }
            <!-- Result Summary -->
            <div class="result-summary">
                <div class="result-item">
                    <span class="result-label">Result:</span>
                    <span class="result-value">
                        ${
                          student.overallGrade !== "D"
                            ? "PASSED & PROMOTED"
                            : "NEEDS IMPROVEMENT"
                        }
                    </span>
                </div>
                <div class="result-item">
                    <span class="result-label">Overall Grade:</span>
                    <span class="result-value">${student.overallGrade}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Class Position:</span>
                    <span class="result-value">${
                      student.position || "--"
                    }</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Date of Issue:</span>
                    <span class="result-value">${new Date().toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}</span>
                </div>
            </div>
        </div>
        <!-- Optional Subject Section -->
        ${
          hasOptionalData
            ? `<div class="optional-section">
            <table class="marksheet-table">
                <thead>
                    <tr>
                        <th colspan="5" style="background-color: #f3e8ff; color: #7c3aed;">OPTIONAL SUBJECT</th>
                    </tr>
                    <tr>
                        <th style="width: 40%;">SUBJECT</th>
                        <th>Full Marks</th>
                        <th>Obtained</th>
                        <th>Percentage</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
                    ${optionalRows}
                </tbody>
            </table>
        </div>`
            : ""
        }
        <!-- Signatures and Grading Scale -->
        <div class="signatures-section">
            <!-- Class Teacher Signature -->
            <div>
                <div class="signature-box">
                    <span style="font-size: 10px; color: #6b7280;">Teacher's Signature</span>
                </div>
                <div class="signature-label">Sign. of the Class Teacher</div>
            </div>
            <!-- Grading Scale -->
            <div class="grade-scale">
                <div class="grade-scale-title">GRADING SCALE</div>
                <table class="grade-scale-table">
                    <tr class="grade-header">
                        <td>AA</td>
                        <td>A+</td>
                        <td>A</td>
                        <td>B+</td>
                        <td>B</td>
                        <td>C</td>
                        <td>D</td>
                    </tr>
                    <tr>
                        <td style="background-color: #dcfce7; color: #166534;">90-100</td>
                        <td style="background-color: #dbeafe; color: #1e40af;">75-89</td>
                        <td style="background-color: #e0e7ff; color: #4338ca;">60-74</td>
                        <td style="background-color: #fef3c7; color: #d97706;">45-59</td>
                        <td style="background-color: #fed7aa; color: #ea580c;">34-44</td>
                        <td style="background-color: #fecaca; color: #dc2626;">25-33</td>
                        <td style="background-color: #fee2e2; color: #991b1b;">Below 25</td>
                    </tr>
                </table>
            </div>
            <!-- Headmaster Signature -->
            <div>
                <div class="signature-box">
                    <img src="https://drms.rkavpanagarh.in/sign.png" alt="Headmaster Signature" class="signature-image">
                    <span style="font-size: 10px; color: #6b7280;">Headmaster's Signature</span>
                </div>
                <div class="signature-label">Signature of the Headmaster</div>
            </div>
        </div>
        <!-- Footer -->
        <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px;">
            <p>This is a computer-generated report card. For any queries, please contact the school office.</p>
            <p>Email: info@rkavpanagarh.in | Website: www.rkavpanagarh.in</p>
        </div>
    </div></body></html>`;
}
