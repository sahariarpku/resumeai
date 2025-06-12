
"use client";

import type { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PublicationFormData } from "@/lib/schemas";

interface PublicationFormFieldsProps {
  control: Control<PublicationFormData>;
  onPolishRequest: (fieldName: keyof PublicationFormData) => void;
  polishingField: keyof PublicationFormData | null;
  isSubmitting: boolean;
}

export function PublicationFormFields({ control, onPolishRequest, polishingField, isSubmitting }: PublicationFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Full title of the publication" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="authors"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Authors (Optional, comma-separated)</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Doe J., Smith A." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="journalOrConference"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Journal or Conference Name (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Nature, ICML 2023" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="publicationDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Publication Date (Optional)</FormLabel>
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
        name="link"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link to Publication (Optional)</FormLabel>
            <FormControl>
              <Input type="url" placeholder="https://example.com/publication/123" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="doi"
        render={({ field }) => (
          <FormItem>
            <FormLabel>DOI (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="Digital Object Identifier" {...field} />
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
              <FormLabel>Description / Abstract (Optional)</FormLabel>
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
              <Textarea placeholder="Brief summary or abstract of the publication." {...field} rows={4} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
