import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  ...props
}) => {
  // Base classes
  const baseClasses = 'font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none cursor-pointer';


  // Variant classes
  const variantClasses = {
    primary: 'bg-[#1F6FEB] hover:bg-[#1F6FEB] text-white ',
    secondary: 'bg-white border border-[#9CC0F6] text-primary-600',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 ',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger: 'bg-red-500 hover:text-[#B80A34] text-red-500',
    success: 'bg-green-500 hover:text-[#00832D] text-green-500',
    // White text on yellow-500 has very weak contrast (looks washed out /
    // "disappearing", reported on the Post Job page's "Set Address"
    // button) - dark text reads clearly against this yellow instead.
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-gray-900 ',
    link: 'bg-transparent text-primary-600 hover:underline  p-0',
  };

  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
    xl: 'px-10 py-4 text-xl'

  };

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';

  // Combine all classes
  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${widthClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );

  // Render icon
  const renderIcon = () => {
    if (loading) return <LoadingSpinner />;
    if (icon) {
      if (typeof icon === 'string') {
        return <img src={icon} alt="" className="w-4 h-4" />;
      }
      return icon;
    }
    return null;
  };

  // Render content
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <LoadingSpinner />
          Loading...
        </>
      );
    }

    if (icon && iconPosition === 'left') {
      return (
        <>
          {renderIcon()}
          {children}
        </>
      );
    }

    if (icon && iconPosition === 'right') {
      return (
        <>
          {children}
          {renderIcon()}
        </>
      );
    }

    return children;
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default Button;
