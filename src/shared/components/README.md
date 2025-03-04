# Shared Components

This directory contains reusable UI components that are used across multiple features.

## Component Guidelines

1. **Pure Components**: These components should be as pure as possible, with minimal dependencies
2. **Prop-Driven**: Components should be controlled primarily through props
3. **Accessibility**: All components must be accessible and follow WCAG guidelines
4. **Responsive**: Components should work across various screen sizes
5. **Documented**: Each component should have proper JSDoc comments and examples
6. **Tested**: Each component should have unit tests

## Structure

Each component should be in its own directory with the following structure:

```
ComponentName/
  ├── index.tsx      # Main component
  ├── styles.module.css  # Component styles
  ├── ComponentName.test.tsx  # Component tests
  └── README.md      # Component documentation
```

## Examples

- `Button` - Standard buttons with various styles
- `Card` - Container component for content
- `ErrorDisplay` - Standard error display component
- `LoadingIndicator` - Loading spinner or progress bar
- `Typography` - Text components (headings, paragraphs, etc.)
