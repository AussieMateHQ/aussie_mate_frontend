import React from 'react';

const FloatingLabelInput = ({ id, name, label, type = "text", value, onChange, required = false, children, placeholder = " ", maxLength, error, ...props }) => {
  return (
    <div className="relative mb-1">
      <div className="relative">
        <input
          type={type}
          name={name}
          id={id}
          value={value}
          onChange={onChange}
          className={`peer w-full px-4 py-4 border ${error ? 'border-red-500 focus:border-red-500' : 'border-primary-200 focus:border-[#6B7280]'} rounded-md focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          {...props}
        />
        <label
          htmlFor={id}
          className={`absolute left-3 px-1 bg-white ${error ? 'text-red-500' : 'text-gray-500'} transition-all duration-200
             text-xs top-0 -translate-y-1/2
             peer-placeholder-shown:text-base peer-placeholder-shown:top-1/2 peer-placeholder-shown:translate-y-[-50%]
             peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs ${error ? 'peer-focus:text-red-500' : 'peer-focus:text-primary-500'} peer-focus:font-medium`}
        >
          {label}
        </label>
        {children}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>
      )}
    </div>
  );
};

export default FloatingLabelInput;
