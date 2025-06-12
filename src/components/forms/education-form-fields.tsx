
"use client";

import type { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// No text areas here typically needing AI polish, but can be added if a description field is included.
import type { EducationFormData } from "@/lib/schemas";

interface EducationFormFieldsProps {
  control: Control<EducationFormData>;
}

export function EducationFormFields({ control }: EducationFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="institution"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Institution Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. University of Example" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="degree"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Degree</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Bachelor of Science" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="fieldOfStudy"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field of Study</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Computer Science" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="month" placeholder="YYYY-MM" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date (or leave blank for "Expected")</FormLabel>
              <FormControl>
                <Input type="month" placeholder="YYYY-MM" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
