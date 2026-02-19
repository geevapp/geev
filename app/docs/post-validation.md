# Post Creation Validation Documentation

This document outlines the validation rules and implementation patterns for post creation in the Geev application.

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| **Title** | Required, 10 - 200 characters | Title is required / Title must be at least 10 characters / Title cannot exceed 200 characters |
| **Description** | Required, 50 - 2000 characters | Description is required / Description must be at least 50 characters / Description cannot exceed 2000 characters |
| **Category** | Required | Category is required |
| **Winner Count** | Required (Giveaway only), 1 - 100 | Must have at least 1 winner / Cannot exceed 100 winners |
| **Duration** | Required, 1 - 30 days | Duration must be at least 1 day / Duration cannot exceed 30 days |

## Implementation Patterns

### 1. Utility Functions (`lib/validation.ts`)
All validation logic is centralized in `lib/validation.ts`. Each function returns a `ValidationResult` object:
```typescript
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}
```

### 2. UI Integration
Modals (`GiveawayModal`, `RequestModal`) use a combination of `onBlur` and `onChange` to trigger validation:
- **On Blur**: Marks the field as `touched` and shows the error immediately.
- **On Change**: If the field is already `touched`, it updates the error state in real-time.
- **On Submit**: Re-validates all fields to prevent edge-case bypasses.

### 3. Visual Feedback
- **Error State**: Red border, `AlertCircle` icon, and red helper text.
- **Success State**: Green border, `CheckCircle2` icon, and "Looks good!" text.
- **Character Counters**: Displayed in the top-right of the label, turning red when the limit is exceeded.
- **Submit Button**: Automatically disabled until the `isFormValid` derived state is true.

## Usage Example
```tsx
import { validateTitle } from '@/lib/validation';

// Inside component
const [title, setTitle] = useState('');
const [error, setError] = useState('');

const handleBlur = () => {
  const result = validateTitle(title);
  if (!result.isValid) setError(result.error);
};
```

## Demo
A live verification page is available at `/form-demo` to test all rules and UX behaviors.
