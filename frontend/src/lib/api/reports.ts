import api from './client';
import type { ReportCard, Marksheet, Ranking } from '@/types';

export const reportsApi = {
  getReportCard: async (studentId: string, sessionId?: string): Promise<ReportCard> => {
    return api.get<ReportCard>(`/results/report-card/${studentId}/`, { session_id: sessionId });
  },
  getClassReportCards: async (sessionId: string, classId: string, sectionId: string): Promise<ReportCard[]> => {
    return api.get<ReportCard[]>('/results/report-cards/', { session_id: sessionId, class_id: classId, section_id: sectionId });
  },
  getMarksheet: async (studentId: string, sessionId?: string): Promise<Marksheet> => {
    return api.get<Marksheet>(`/results/marksheet/${studentId}/`, { session_id: sessionId });
  },
  getRankings: async (sessionId: string, classId: string, sectionId: string): Promise<Ranking[]> => {
    return api.get<Ranking[]>('/results/rankings/', { session_id: sessionId, class_id: classId, section_id: sectionId });
  },
  downloadPdf: async (studentId: string, sessionId: string): Promise<Blob> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/results/report-card/${studentId}/pdf/?session_id=${sessionId}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
    );
    if (!response.ok) throw new Error('Failed to download PDF');
    return response.blob();
  },
};
