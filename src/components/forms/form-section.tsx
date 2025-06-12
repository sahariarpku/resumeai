
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'; // Added icons

interface FormSectionProps {
  id?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode; // For "Add New" buttons etc.
  className?: string;
  isReorderable?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function FormSection({ 
  id, 
  title, 
  description, 
  children, 
  actions, 
  className,
  isReorderable,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: FormSectionProps) {
  return (
    <Card id={id} className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2"> {/* Container for actions and reorder controls */}
            {isReorderable && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={!canMoveUp} title="Move section up">
                  <ArrowUpCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onMoveDown} disabled={!canMoveDown} title="Move section down">
                  <ArrowDownCircle className="h-5 w-5" />
                </Button>
              </div>
            )}
            {actions && <div className="ml-2">{actions}</div>} {/* Existing add buttons etc. */}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

export function FormSectionList<T extends { id: string }>({ // Ensured T has id for key
  items,
  renderItem,
  emptyState,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
}) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }
  return (
    <div className="space-y-4 mt-4">
      {items.map((item, index) => (
        <React.Fragment key={item.id}> {/* Use item.id for key */}
          {renderItem(item, index)}
          {index < items.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </div>
  );
}
