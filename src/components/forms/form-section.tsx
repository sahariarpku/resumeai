"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';

interface FormSectionProps {
  id?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode; // For "Add New" buttons etc.
  className?: string;
}

export function FormSection({ id, title, description, children, actions, className }: FormSectionProps) {
  return (
    <Card id={id} className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

export function FormSectionList<T>({
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
        <React.Fragment key={index /* Ideally use item.id */}>
          {renderItem(item, index)}
          {index < items.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </div>
  );
}
