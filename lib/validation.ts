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

export const validateHelpType = (helpType: string): ValidationResult => {
  const validTypes = ['material', 'service', 'advice', 'other'];
  if (!helpType || !helpType.trim()) {
    return { isValid: false, error: 'Help type is required' };
  }
  if (!validTypes.includes(helpType)) {
    return { isValid: false, error: 'Please select a valid help type' };
  }
  return { isValid: true };
};

export const validateUrgency = (urgency: string): ValidationResult => {
  const validUrgencies = ['low', 'medium', 'high', 'urgent'];
  if (!urgency || !urgency.trim()) {
    return { isValid: false, error: 'Urgency level is required' };
  }
  if (!validUrgencies.includes(urgency)) {
    return { isValid: false, error: 'Please select a valid urgency level' };
  }
  return { isValid: true };
};

export const validateTargetAmount = (amount: number | string): ValidationResult => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Target amount must be a number' };
  }
  if (numAmount <= 0) {
    return { isValid: false, error: 'Target amount must be greater than 0' };
  }
  if (numAmount > 1000000) {
    return { isValid: false, error: 'Target amount cannot exceed 1,000,000' };
  }
  return { isValid: true };
};
