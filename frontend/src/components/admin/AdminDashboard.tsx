@@ .. @@
 import { TeachersManagement } from './TeachersManagement'
 import { ResultsManagement } from './ResultsManagement'
 import { SchoolConfigManagement } from './SchoolConfigManagement'
+import { OptionalSubjectsManagement } from './OptionalSubjectsManagement'
 
-type ActiveTab = 'students' | 'classes' | 'sections' | 'subjects' | 'sessions' | 'teachers' | 'results' | 'config'
+type ActiveTab = 'students' | 'classes' | 'sections' | 'subjects' | 'optional' | 'sessions' | 'teachers' | 'results' | 'config'
 
 export const AdminDashboard: React.FC = () => {
 }
@@ .. @@
     { id: 'classes', label: 'Classes', icon: GraduationCap },
     { id: 'sections', label: 'Sections', icon: BookOpen },
     { id: 'subjects', label: 'Subjects', icon: FileText },
+    { id: 'optional', label: 'Optional Subjects', icon: Plus },
     { id: 'sessions', label: 'Sessions', icon: Calendar },
     { id: 'teachers', label: 'Teachers', icon: UserPlus },
     { id: 'results', label: 'Results', icon: Settings },
@@ .. @@
         {activeTab === 'students' && <StudentsManagement />}
         {activeTab === 'classes' && <ClassesManagement />}
         {activeTab === 'sections' && <SectionsManagement />}
         {activeTab === 'subjects' && <SubjectsManagement />}
+        {activeTab === 'optional' && <OptionalSubjectsManagement />}
         {activeTab === 'sessions' && <SessionsManagement />}
         {activeTab === 'teachers' && <TeachersManagement />}
         {activeTab === 'results' && <ResultsManagement />}
         {activeTab === 'config' && <SchoolConfigManagement />}