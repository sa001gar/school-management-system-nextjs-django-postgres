'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';

interface ClassListProps {
  classes: Array<{ id: string; name: string; level: number }>;
  selectedClassId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  sections: Array<{ id: string; name: string }>;
  onAddSection: (name: string) => void;
  onDeleteSection: (id: string) => void;
  isAddingSection?: boolean;
}

export function ClassList({ classes, selectedClassId, onSelect, onDelete, sections, onAddSection, onDeleteSection, isAddingSection }: ClassListProps) {
  const [newSection, setNewSection] = useState('');

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <div
            key={c.id}
            className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${selectedClassId === c.id ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => onSelect(selectedClassId === c.id ? null : c.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="text-sm text-gray-500">Level {c.level}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="text-red-500">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {selectedClassId && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Sections</h3>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Section name"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => { onAddSection(newSection); setNewSection(''); }} isLoading={isAddingSection}>Add</Button>
          </div>
          <div className="space-y-2">
            {sections.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">{s.name}</span>
                <Button variant="ghost" size="icon-sm" onClick={() => onDeleteSection(s.id)} className="text-red-500">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
