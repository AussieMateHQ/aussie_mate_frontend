import React from 'react';

// Deliberately dependency-free (no @mui/material/@emotion). This is used as
// the Suspense fallback in App.jsx and on nearly every page in the app, so
// it's on the critical path for the very first paint - pulling in MUI here
// previously forced that whole library (and its @emotion runtime) into the
// eagerly-loaded bundle instead of staying split out with the few pages that
// still use MUI components directly, which was a major contributor to slow
// initial page loads.
const Loader = ({
  message = 'Loading...',
  fullscreen = false,
  size = 56,
  thickness = 4,
  className = '',
}) => {
  const containerClass = fullscreen
    ? 'fixed inset-0 min-h-screen w-full z-[9999]'
    : 'min-h-[160px] w-full';

  return (
    <div
      className={`flex flex-col items-center justify-center ${containerClass} ${className}`}
      style={
        fullscreen
          ? { backgroundColor: 'rgba(249, 250, 255, 0.9)', backdropFilter: 'blur(3px)' }
          : { backgroundColor: 'transparent' }
      }
    >
      <div className="flex flex-col items-center gap-2.5">
        <div
          className="rounded-full animate-spin"
          style={{
            width: size,
            height: size,
            borderWidth: thickness,
            borderStyle: 'solid',
            borderColor: '#E5E7EB',
            borderTopColor: '#1F6FEB',
          }}
          role="status"
          aria-label="Loading"
        />
        {message ? (
          <p
            className="text-center font-semibold"
            style={{ color: '#1F2937', letterSpacing: '0.2px' }}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default Loader;
