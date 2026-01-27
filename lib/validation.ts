export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateTitle = (title: string): ValidationResult => {
  if (!title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }
  if (title.length < 10) {
    return { isValid: false, error: 'Title must be at least 10 characters' };
  }
  if (title.length > 200) {
    return { isValid: false, error: 'Title cannot exceed 200 characters' };
  }
  return { isValid: true };
};

export const validateDescription = (desc: string): ValidationResult => {
  if (!desc.trim()) {
    return { isValid: false, error: 'Description is required' };
  }
  if (desc.length < 50) {
    return {
      isValid: false,
      error: 'Description must be at least 50 characters',
    };
  }
  if (desc.length > 2000) {
    return {
      isValid: false,
      error: 'Description cannot exceed 2000 characters',
    };
  }
  return { isValid: true };
};

export const validateCategory = (category: string): ValidationResult => {
  if (!category || !category.trim()) {
    return { isValid: false, error: 'Category is required' };
  }
  return { isValid: true };
};

export const validateWinnerCount = (count: number | string): ValidationResult => {
  const numCount = typeof count === 'string' ? parseInt(count) : count;
  
  if (isNaN(numCount)) {
    return { isValid: false, error: 'Winner count must be a number' };
  }
  if (numCount < 1) {
    return { isValid: false, error: 'Must have at least 1 winner' };
  }
  if (numCount > 100) {
    return { isValid: false, error: 'Cannot exceed 100 winners' };
  }
  return { isValid: true };
};

export const validateDuration = (days: number | string): ValidationResult => {
  const numDays = typeof days === 'string' ? parseInt(days) : days;

  if (isNaN(numDays)) {
    return { isValid: false, error: 'Duration must be a number' };
  }
  if (numDays < 1) {
    return { isValid: false, error: 'Duration must be at least 1 day' };
  }
  if (numDays > 30) {
    return { isValid: false, error: 'Duration cannot exceed 30 days' };
  }
  return { isValid: true };
};
