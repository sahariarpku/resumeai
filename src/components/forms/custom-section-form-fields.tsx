
"use client";

import type { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CustomSectionFormData } from "@/lib/schemas";

interface CustomSectionFormFieldsProps {
  control: Control<CustomSectionFormData>;
  onPolishRequest: (fieldName: keyof CustomSectionFormData) => void;
  polishingField: keyof CustomSectionFormData | null;
  isSubmitting: boolean;
}

export function CustomSectionFormFields({ control, onPolishRequest, polishingField, isSubmitting }: CustomSectionFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="heading"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Section Heading</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Languages, Hobbies, Volunteer Experience" {...field} />
            </FormControl>
            <FormDescription>The title for your custom section.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
              <FormLabel>Content</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onPolishRequest('content')}
                      disabled={polishingField === 'content' || isSubmitting}
                    >
                      {polishingField === 'content' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Polish content with AI</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FormControl>
              <Textarea placeholder="Enter the details for this custom section." {...field} rows={5} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
