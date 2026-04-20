
"use client";

import type { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { HonorAwardFormData } from "@/lib/schemas";

interface HonorAwardFormFieldsProps {
  control: Control<HonorAwardFormData>;
  onPolishRequest: (fieldName: keyof HonorAwardFormData) => void;
  polishingField: keyof HonorAwardFormData | null;
  isSubmitting: boolean;
}

export function HonorAwardFormFields({ control, onPolishRequest, polishingField, isSubmitting }: HonorAwardFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Award/Honor Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Dean's List, Employee of the Month" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="organization"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Issuing Organization (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g., University of Example, Acme Corp" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date Received (Optional)</FormLabel>
            <FormControl>
              <Input type="month" placeholder="YYYY-MM or YYYY" {...field} />
            </FormControl>
            <FormDescription>You can enter a year (YYYY) or year and month (YYYY-MM).</FormDescription>
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
              <FormLabel>Description (Optional)</FormLabel>
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
              <Textarea placeholder="Briefly describe the award or its significance." {...field} rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
