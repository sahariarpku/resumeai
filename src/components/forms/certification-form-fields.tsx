
"use client";

import type { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { CertificationFormData } from "@/lib/schemas";

interface CertificationFormFieldsProps {
  control: Control<CertificationFormData>;
}

export function CertificationFormFields({ control }: CertificationFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Certification Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. AWS Certified Solutions Architect - Associate" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="issuingOrganization"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Issuing Organization</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Amazon Web Services" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="issueDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Issue Date</FormLabel>
            <FormControl>
              <Input type="month" placeholder="YYYY-MM" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="credentialId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Credential ID (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g. ABC123XYZ" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="credentialUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Credential URL (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/credential/123" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
