# Feature-Based Organization

This directory contains feature-based modules that follow modern React application architecture.

## Structure

Each feature is organized in its own directory with the following structure:

- `components/` - UI components specific to this feature
- `hooks/` - Custom hooks for this feature
- `api/` - API integration for this feature
- `utils/` - Utility functions specific to this feature
- `types/` - TypeScript types/interfaces for this feature
- `context/` - Context providers for this feature's state management
- `index.ts` - Public API - only components/hooks that should be accessible to other features

## Benefits

1. **Encapsulation** - Each feature is self-contained with its own components, hooks, and utilities
2. **Testability** - Features can be tested in isolation
3. **Code Splitting** - Features can be loaded on demand
4. **Developer Experience** - Easier to understand codebase for new team members
5. **Maintainability** - Changes to one feature are less likely to affect others

## Shared Code

Code that is used by multiple features should be placed in one of these top-level directories:

- `/src/shared/components/` - Reusable UI components
- `/src/shared/hooks/` - Reusable hooks
- `/src/shared/utils/` - Shared utility functions
- `/src/shared/types/` - Shared TypeScript types
- `/src/shared/api/` - API client setup and shared API utilities

## Guidelines

1. Features should communicate through well-defined interfaces
2. Keep dependencies between features minimal
3. Prefer composition over inheritance
4. Use context for state that needs to be shared within a feature
5. Export only what's necessary from each feature's `index.ts`
