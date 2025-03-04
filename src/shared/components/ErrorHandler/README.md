# ErrorHandler Component

A flexible, user-friendly error handling component that displays error messages with suggested actions and technical details.

## Features

- Displays user-friendly error messages based on error types
- Groups multiple errors by type for better organization
- Provides suggested actions for each error type
- Expandable technical details section
- Retry and dismiss functionality
- Responsive design

## Usage

```jsx
import ErrorHandler from 'src/shared/components/ErrorHandler';

// Example errors
const errors = [
  {
    message: 'Failed to load boat data',
    type: 'API_UNAVAILABLE',
    boatName: 'Boston Whaler 370 Outrage'
  },
  {
    message: 'Rate limit exceeded',
    type: 'RATE_LIMIT_ERROR'
  }
];

// Component usage
const MyComponent = () => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  
  const handleRetry = () => {
    // Retry logic here
  };
  
  const handleDismiss = () => {
    // Dismiss logic here
  };
  
  return (
    <ErrorHandler
      errors={errors}
      onRetry={handleRetry}
      onDismiss={handleDismiss}
      showDetails={showErrorDetails}
      onToggleDetails={() => setShowErrorDetails(!showErrorDetails)}
    />
  );
};
```

## Props

| Prop | Type | Description | Required |
|------|------|-------------|----------|
| errors | Array | Array of error objects | Yes |
| onRetry | Function | Handler for retry button click | No |
| onDismiss | Function | Handler for dismiss button click | No |
| showDetails | Boolean | Whether to show technical details | No |
| onToggleDetails | Function | Handler for toggling details | Yes |

## Error Object Structure

```js
{
  message: String,   // Error message
  type: String,      // Error type (e.g. 'API_UNAVAILABLE')
  boatName: String,  // Optional - name of boat related to error
  boatId: String     // Optional - ID of boat related to error
}
```

## Supported Error Types

- OpenAI API errors: `RATE_LIMIT_ERROR`, `AUTH_ERROR`, `TIMEOUT_ERROR`, `CONNECTION_ERROR`, `SERVER_ERROR`, `INVALID_REQUEST`
- Boat matching errors: `API_UNAVAILABLE`, `API_RATE_LIMIT`, `API_TOKEN_INVALID`, `DATA_INCOMPLETE`, `TYPE_MISMATCH`
