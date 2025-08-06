'use client';

// Export the context and hook
export { FeedbackProvider, useFeedback, type FeedbackType } from './FeedbackContext';

// Re-export the utility functions for easier import
export { dismissAllFeedback, feedback, showAlert, showToast } from '@/utils/feedback';

// Export the demo component
export { default as FeedbackButtons } from '@/components/FeedbackButtons';

