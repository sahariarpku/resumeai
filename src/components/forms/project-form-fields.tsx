
"use client";

import type { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProjectFormData } from "@/lib/schemas";

interface ProjectFormFieldsProps {
  control: Control<ProjectFormData>;
  onPolishRequest: (fieldName: keyof ProjectFormData) => void;
  polishingField: keyof ProjectFormData | null;
  isSubmitting: boolean;
}

export function ProjectFormFields({ control, onPolishRequest, polishingField, isSubmitting }: ProjectFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Personal Portfolio Website" {...field} />
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
              <FormLabel>Description</FormLabel>
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
              <Textarea placeholder="Describe the project, its goals, and your role..." {...field} rows={4} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="technologies"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Technologies Used (comma-separated)</FormLabel>
            <FormControl>
              <Textarea placeholder="e.g. React, Next.js, Tailwind CSS" {...field} rows={2} />
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
              <FormLabel>Key Achievements/Features (comma-separated)</FormLabel>
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
              <Textarea placeholder="e.g. Implemented user authentication, Deployed on Vercel" {...field} rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="link"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Link (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="https://github.com/yourusername/project" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
