
"use client";

import type { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { EducationFormData } from "@/lib/schemas";

interface EducationFormFieldsProps {
  control: Control<EducationFormData>;
  onPolishRequest: (fieldName: keyof EducationFormData) => void;
  polishingField: keyof EducationFormData | null;
  isSubmitting: boolean;
}

export function EducationFormFields({ control, onPolishRequest, polishingField, isSubmitting }: EducationFormFieldsProps) {
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
              <FormLabel>End Date (or leave blank)</FormLabel>
              <FormControl>
                <Input type="month" placeholder="YYYY-MM or Present/Expected" {...field} />
              </FormControl>
              <FormDescription>Leave blank if ongoing or for expected date.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="gpa"
        render={({ field }) => (
          <FormItem>
            <FormLabel>GPA / Result (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g. 3.8/4.0, First Class Honors" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="thesisTitle"
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
              <FormLabel>Thesis/Project Title (Optional)</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onPolishRequest('thesisTitle')}
                      disabled={polishingField === 'thesisTitle' || isSubmitting}
                    >
                      {polishingField === 'thesisTitle' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Polish title with AI</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FormControl>
              <Textarea placeholder="Title of your major academic thesis or project" {...field} rows={2}/>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="relevantCourses"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Relevant Courses (Optional, comma-separated)</FormLabel>
            <FormControl>
              <Textarea placeholder="e.g. Data Structures, Algorithms, Machine Learning" {...field} rows={3}/>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
       <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
              <FormLabel>Notes / Achievements (Optional)</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onPolishRequest('description')}
                      disabled={polishingField === 'description' || isSubmitting}
                    >
                      {polishingField === 'description' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Polish notes with AI</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FormControl>
              <Textarea placeholder="e.g., Dean's List, Scholarship recipient, Key academic projects or activities." {...field} rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
