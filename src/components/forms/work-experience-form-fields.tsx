
"use client";

import type { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { WorkExperienceFormData } from "@/lib/schemas";

interface WorkExperienceFormFieldsProps {
  control: Control<WorkExperienceFormData>;
  onPolishRequest: (fieldName: keyof WorkExperienceFormData) => void;
  polishingField: keyof WorkExperienceFormData | null;
  isSubmitting: boolean;
}

export function WorkExperienceFormFields({ control, onPolishRequest, polishingField, isSubmitting }: WorkExperienceFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Google" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role / Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Software Engineer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
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
              <FormLabel>End Date (or leave blank for "Present")</FormLabel>
              <FormControl>
                <Input type="month" placeholder="YYYY-MM or Present" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
             <div className="flex justify-between items-center">
                <FormLabel>Description / Responsibilities</FormLabel>
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
                        <p>Polish description with AI</p>
                    </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <FormControl>
              <Textarea placeholder="Describe your role and responsibilities..." {...field} rows={4}/>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="achievements"
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
                <FormLabel>Key Achievements (comma-separated)</FormLabel>
                 <TooltipProvider>
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onPolishRequest('achievements')}
                        disabled={polishingField === 'achievements' || isSubmitting}
                        >
                        {polishingField === 'achievements' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4 text-primary" />
                        )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Polish achievements with AI</p>
                    </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <FormControl>
              <Textarea placeholder="e.g. Led a team of 5, Increased efficiency by 20%" {...field} rows={3}/>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
