import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    const context = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(context, args), delay);
  } as T;
}

export function parseAndFormatIngredients(ingredients: string | string[] | null | undefined): string[] {
  if (!ingredients) {
    return [];
  }

  if (Array.isArray(ingredients)) {
    return ingredients.map(i => i.trim()).filter(Boolean);
  }

  // Attempt to parse if it's a string
  try {
    const parsed = JSON.parse(ingredients);
    if (Array.isArray(parsed)) {
      return parsed.map(i => i.trim()).filter(Boolean);
    }
  } catch (e) {
    // If JSON parsing fails, treat the entire string as a single ingredient
    return ingredients.split(',').map(i => i.trim()).filter(Boolean);
  }

  return [];
}