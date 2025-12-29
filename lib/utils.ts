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