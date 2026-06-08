'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface SubjectListProps {
  subjects: Array<{ id: string; name: string; code: string; full_marks: number }>;
  onDelete: (id: string) => void;
}

export function SubjectList({ subjects, onDelete }: SubjectListProps) {
  if (subjects.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Full Marks</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.code}</TableCell>
              <TableCell>{s.full_marks}</TableCell>
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
