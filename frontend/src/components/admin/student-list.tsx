'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface StudentListProps {
  students: Array<{ id: string; name: string; student_id: string; roll_no: string; class_info?: { name: string } }>;
  onDelete: (id: string) => void;
}

export function StudentList({ students, onDelete }: StudentListProps) {
  if (students.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Student ID</TableHead>
            <TableHead>Roll No</TableHead>
            <TableHead>Class</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.student_id}</TableCell>
              <TableCell>{s.roll_no}</TableCell>
              <TableCell>{s.class_info?.name || '-'}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon-sm" onClick={() => onDelete(s.id)} className="text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
