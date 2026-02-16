import { z } from 'zod';

// File validation constants
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

// Client schema
export const clientSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  phone: z.string()
    .trim()
    .max(30, 'Phone must be less than 30 characters')
    .optional()
    .or(z.literal('')),
  address: z.string()
    .trim()
    .max(200, 'Address must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  city: z.string()
    .trim()
    .max(100, 'City must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .trim()
    .max(100, 'Country must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  taxId: z.string()
    .trim()
    .max(50, 'Tax ID must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .trim()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Business schema
export const businessSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Business name is required')
    .max(100, 'Business name must be less than 100 characters'),
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  phone: z.string()
    .trim()
    .max(30, 'Phone must be less than 30 characters')
    .optional()
    .or(z.literal('')),
  address: z.string()
    .trim()
    .max(200, 'Address must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  city: z.string()
    .trim()
    .max(100, 'City must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .trim()
    .max(100, 'Country must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  taxId: z.string()
    .trim()
    .max(50, 'Tax ID must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  logo: z.string().optional().or(z.literal('')),
  signature: z.string().optional().or(z.literal('')),
  accentColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex color')
    .default('#3b82f6'),
  font: z.enum(['inter', 'roboto', 'poppins']).default('inter'),
  footerText: z.string()
    .trim()
    .max(500, 'Footer text must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export type BusinessFormData = z.infer<typeof businessSchema>;

// Invoice item schema
export const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string()
    .trim()
    .min(1, 'Description is required')
    .max(200, 'Description must be less than 200 characters'),
  quantity: z.number()
    .min(0.01, 'Quantity must be greater than 0')
    .max(999999, 'Quantity is too large'),
  price: z.number()
    .min(0.01, 'Price must be greater than 0')
    .max(99999999, 'Price is too large'),
  taxRate: z.number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%'),
  discount: z.number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%'),
});

// Invoice schema
export const invoiceSchema = z.object({
  invoiceNumber: z.string()
    .trim()
    .min(1, 'Invoice number is required')
    .max(50, 'Invoice number must be less than 50 characters'),
  clientId: z.string().min(1, 'Please select a client'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string()
    .trim()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  paymentQR: z.string()
    .trim()
    .max(500, 'Payment URL must be less than 500 characters')
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      'Must be a valid HTTP or HTTPS URL'
    )
    .optional()
    .or(z.literal('')),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must have at least one item'),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// File validation helper
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }
  
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Please upload a valid image (JPEG, PNG, WebP, or SVG)' 
    };
  }
  
  return { valid: true };
}

// Helper to get first error message from Zod validation
export function getFirstError(error: z.ZodError): string {
  return error.errors[0]?.message || 'Validation error';
}

// Helper to get all errors as an object
export function getErrorsObject(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  return errors;
}
