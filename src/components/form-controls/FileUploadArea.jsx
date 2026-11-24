import React from 'react';
import { X } from 'lucide-react';
import UploadCloudIcon from '../../assets/upload-cloud.svg';
import uploadIcon from '../../assets/upload.svg';

/**
 * Reusable File Upload Component
 * 
 * @param {string} fieldName - Unique identifier for the file input
 * @param {string} title - Main heading for the upload area
 * @param {string} description - Description text below the title
 * @param {string} uploadText - Text shown above the Upload Here button
 * @param {string} placeholder - Placeholder text in the upload area
 * @param {function} onFileSelect - Callback function when file is selected
 * @param {object} selectedFile - Currently selected file object (with fileName or name property)
 * @param {string} accept - Accepted file types (default: ".pdf,.jpg,.jpeg,.png")
 * @param {string} className - Additional CSS classes for the container
 * @param {boolean} multiple - Allow selecting multiple files (default false)
 * @param {function} onRemove - Optional callback function when file is removed
 */
const FileUploadArea = ({ 
  fieldName, 
  title, 
  description, 
  placeholder = "to Upload PDF/JPEG",
  uploadText = "Select photos/videos to upload",
  onFileSelect,
  selectedFile = null,
  accept = ".pdf,.jpg,.jpeg,.png",
  className = "",
  multiple = false,
  onRemove = null
}) => {
  const handleClick = () => {
    const input = document.getElementById(`${fieldName}-file`);
    if (input) {
      input.click();
    }
  };

  const handleFileChange = (e) => {
    if (onFileSelect) {
      onFileSelect(e, fieldName);
    }
  };

  return (
    <div className={`${className}`}>
      {title && (
        <h3 className="text-base font-medium text-primary-500 mb-1">{title}</h3>
      )}
      {description && (
        <p className="text-xs text-primary-200 font-medium mb-3">{description}</p>
      )}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex flex-col items-center">
          <div className="rounded-full p-4 sm:p-5 bg-[#EBF5FF] mb-4">
            <img src={UploadCloudIcon} alt="Upload" className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <p className="text-sm sm:text-base font-medium text-[#111827] mb-4">{uploadText}</p>
          <button
            type="button"
            className="inline-flex items-center gap-2 bg-[#1A73E8] text-white text-sm sm:text-base font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl shadow-sm hover:bg-[#1557B0] transition-colors cursor-pointer"
          >
            Upload Here
            <img src={uploadIcon} alt="upload" className="w-4 h-4 sm:w-5 sm:h-5 invert brightness-0" />
          </button>
        </div>
        <input
          id={`${fieldName}-file`}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
        {selectedFile && (
          <div className="mt-4">
            {selectedFile.preview && selectedFile.fileType?.startsWith('image/') ? (
              <div className="relative inline-block">
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemove) onRemove(fieldName);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-600 z-10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <img
                  src={selectedFile.preview}
                  alt="Preview"
                  className="max-w-full h-32 object-contain rounded-lg border border-gray-300"
                />
              </div>
            ) : null}
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-xs text-green-600">
                ✓ {selectedFile.fileName || selectedFile.name}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadArea;