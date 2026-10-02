import React from 'react';
// Direct imports, not the './index' barrel - see the comment in App.jsx on
// why: this file is itself an eager (non-lazy) import of App.jsx, so going
// through the barrel here would pull in MapWithPolyline's Google Maps
// dependency (also re-exported from this same barrel) before first paint.
import Header from './Header';
import PageLayout from './PageLayout';

/**
 * AppLayout Component
 * Wraps authenticated pages with Header (full width) and PageLayout
 * Use this to avoid adding Header and PageLayout manually to every page
 */
const AppLayout = ({ children, showHeader = true, usePageLayout = true }) => {
  // Header should be full width (outside PageLayout container)
  // Only page content goes inside PageLayout
  if (usePageLayout) {
    return (
      <div className="min-h-screen bg-gray-50 ">
        {showHeader && <Header />}
        <PageLayout>{children}</PageLayout>
      </div>
    );
  }

  return (
    <>
      {showHeader && <Header />}
      {children}
    </>
  );
};

export default AppLayout;
