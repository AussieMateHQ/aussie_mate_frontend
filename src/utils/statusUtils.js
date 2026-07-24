/**
 * Common utility functions for job status colors and labels
 */

/**
 * Normalize status string to lowercase
 */
const normalizeStatus = (status) => {
  return (status || '').toString().toLowerCase().trim();
};

/**
 * Get status colors (bg, text, border classes)
 * @param {string} status - Job status
 * @returns {object} Object with bg, text, and border class names
 */
export const getStatusColors = (status) => {
  const s = normalizeStatus(status);
  
  if (s === 'completed') {
    return {
      bg: 'bg-[#DBF9E7]',
      text: 'text-green-500',
      border: 'border-green-500',
    };
  }
  if (s === 'assigned') {
    return {
      bg: 'bg-[#DBF9E7]',
      text: 'text-green-500',
      border: 'border-green-500',
    };
  }
  if (s === 'accepted') {
    return {
      bg: 'bg-[#D1FAE5]',
      text: 'text-[#059669]',
      border: 'border-[#D1FAE5]',
    };
  }
  if (s === 'quoted') {
    return {
      bg: 'bg-[#E0F2FE]',
      text: 'text-[#0369A1]',
      border: 'border-[#E0F2FE]',
    };
  }
  if (['posted', 'pending', 'pending_quotes', 'pending quotes'].includes(s)) {
    return {
      bg: 'bg-[#DDEFFF]',
      text: 'text-[#0088FF]',
      border: 'border-[#DDEFFF]',
    };
  }
  // Default for unknown statuses
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
  };
};

/**
 * Get status chip/badge info (label + className)
 * @param {string} statusRaw - Job status
 * @returns {object} Object with label and className
 */
export const getStatusChip = (statusRaw) => {
  const s = normalizeStatus(statusRaw);
  
  if (s === 'completed') {
    return { 
      label: 'Completed', 
      className: 'bg-[#DBF9E7] text-green-500 border border-green-500' 
    };
  }
  if (s === 'assigned') {
    return { 
      label: 'Completed', 
      className: 'bg-[#DBF9E7] text-green-500 border border-green-500' 
    };
  }
  if (s === 'accepted') {
    return { 
      label: 'Accepted', 
      className: 'bg-[#D1FAE5] text-[#059669] border border-[#D1FAE5]' 
    };
  }
  if (s === 'quoted') {
    return { 
      label: 'Quoted', 
      className: 'bg-[#E0F2FE] text-[#0369A1] border border-[#E0F2FE]' 
    };
  }
  if (['posted', 'pending', 'pending_quotes', 'pending quotes'].includes(s)) {
    return { 
      label: 'Awaiting Quotes', 
      className: 'bg-[#DDEFFF] text-[#0088FF] border border-[#DDEFFF]' 
    };
  }
  // Default
  return { 
    label: 'Awaiting Quotes', 
    className: 'bg-[#DDEFFF] text-[#0088FF] border border-[#DDEFFF]' 
  };
};

/**
 * Get formatted status label
 * @param {string} status - Job status
 * @returns {string} Formatted label
 */
export const getStatusLabel = (status) => {
  const chip = getStatusChip(status);
  return chip.label;
};
