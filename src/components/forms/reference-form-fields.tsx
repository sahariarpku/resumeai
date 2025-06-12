
"use client";

import type { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReferenceFormData } from "@/lib/schemas";

interface ReferenceFormFieldsProps {
  control: Control<ReferenceFormData>;
  onPolishRequest: (fieldName: keyof ReferenceFormData) => void;
  polishingField: keyof ReferenceFormData | null;
  isSubmitting: boolean;
}

export function ReferenceFormFields({ control, onPolishRequest, polishingField, isSubmitting }: ReferenceFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reference Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Dr. Emily Carter" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="titleAndCompany"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title & Company (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Professor at Example University, CEO at Innovate Inc." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="contactDetailsOrNote"
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
              <FormLabel>Contact Details / Note (Optional)</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onPolishRequest('contactDetailsOrNote')}
                      disabled={polishingField === 'contactDetailsOrNote' || isSubmitting}
                    >
                      {polishingField === 'contactDetailsOrNote' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Polish details with AI</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FormControl>
              <Textarea placeholder="e.g., ecarter@example.edu, (555) 123-4567 or 'Available upon request'" {...field} rows={3} />
            </FormControl>
            <FormDescription>Enter contact info or a note like "Available upon request".</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
