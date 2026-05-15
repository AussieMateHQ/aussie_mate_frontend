  import React, { useState, useEffect, useMemo } from 'react';
  import { useNavigate, useLocation, Link } from 'react-router-dom';
  import { UserRound, PlusIcon, X } from 'lucide-react';
  import CloseIcon from '../../assets/close.svg';
  import { userAPI } from '../../services/api';
  import { FloatingLabelInput, Button, FileUploadArea } from '../../components';
  import { createVerifyDocumentsSchema } from '../../utils/validationSchemas';

  const VerifyDocumentsPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
      profilePicture: null,
      bio: '',
      abnNumber: '',
      policeCheck: null,
      photoId: null,
      visaWorkRights: null,
      trainingCertificates: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');
    const [documentStatus, setDocumentStatus] = useState(null);

    // Create validation schema based on user role
    const validationSchema = useMemo(() => createVerifyDocumentsSchema(userRole), [userRole]);

    // Get user role from localStorage
    useEffect(() => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role || user.userType || '');
      }
    }, []);

    // Fetch document status on component mount
    useEffect(() => {
      fetchDocumentStatus();
    }, []);

    // Cleanup preview URLs on unmount
    useEffect(() => {
      return () => {
        // Cleanup profile picture preview
        if (formData.profilePicture?.preview && !formData.profilePicture?.isExisting) {
          URL.revokeObjectURL(formData.profilePicture.preview);
        }
        // Cleanup document previews
        ['policeCheck', 'photoId', 'visaWorkRights', 'trainingCertificates'].forEach(field => {
          if (formData[field]?.preview && !formData[field]?.isExisting) {
            URL.revokeObjectURL(formData[field].preview);
          }
        });
      };
    }, [formData]);

    const fetchDocumentStatus = async () => {
      try {
        const response = await userAPI.getDocumentStatus();
        if (response.success) {
          const responseData = response.data || {};
          const documents = responseData.documents || {};
          const userData = responseData.user || {};

          setDocumentStatus(responseData);

          setFormData(prev => {
            const updatedForm = {
              ...prev,
              abnNumber: documents.abnNumber || '',
              bio: typeof userData.bio === 'string' ? userData.bio : (prev.bio || '')
            };

            const profilePhotoUrl =
              userData?.profilePhoto?.url ||
              userData?.profilePhoto?.secureUrl ||
              userData?.profilePhotoUrl ||
              userData?.profilePictureUrl ||
              userData?.profilePicture ||
              (typeof userData?.profilePhoto === 'string' ? userData.profilePhoto : null);

            if (profilePhotoUrl) {
              updatedForm.profilePicture = {
                preview: profilePhotoUrl,
                fileName: userData?.profilePhoto?.fileName || 'current-profile-photo',
                fileType: userData?.profilePhoto?.fileType || 'image/*',
                fileSize: userData?.profilePhoto?.fileSize || null,
                originalFile: null,
                isExisting: true
              };
            }

            return updatedForm;
          });
        }
      } catch (error) {
        console.error('Error fetching document status:', error);
      }
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;

      // Special handling for ABN Number - only allow digits and limit to 11 characters
      if (name === 'abnNumber') {
        const digitsOnly = value.replace(/[^\d]/g, '');
        if (digitsOnly.length <= 11) {
          setFormData({
            ...formData,
            [name]: digitsOnly
          });
        }
        return;
      }

      setFormData({
        ...formData,
        [name]: value
      });
    };

    // Handle profile picture upload
    const handleProfilePictureUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
    
      // Size limit 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError("Profile picture size must be less than 5MB");
        return;
      }
    
      // Allowed types
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPEG, JPG, and PNG are allowed");
        return;
      }
    
      // Update state with actual file
      setFormData(prev => {
        // cleanup old url
        if (prev.profilePicture?.preview && !prev.profilePicture?.isExisting) {
          URL.revokeObjectURL(prev.profilePicture.preview);
        }
    
        return {
          ...prev,
          profilePicture: {
            originalFile: file,      // ☑ REAL FILE
            preview: URL.createObjectURL(file), // preview
            isExisting: false
          }
        };
      });
    
      setError("");
    };
    

    // Handle profile picture removal
    const handleRemoveProfilePicture = () => {
      if (formData.profilePicture?.preview && !formData.profilePicture?.isExisting) {
        URL.revokeObjectURL(formData.profilePicture.preview);
      }
      setFormData(prev => ({
        ...prev,
        profilePicture: null
      }));
    };

    // Handle document removal
    const handleRemoveDocument = (fieldName) => {
      setFormData(prev => {
        const currentFile = prev[fieldName];
        if (currentFile?.preview && !currentFile?.isExisting) {
          URL.revokeObjectURL(currentFile.preview);
        }
        return {
          ...prev,
          [fieldName]: null
        };
      });
    };

    // Calculate word count for bio
    const getBioWordCount = () => {
      if (!formData.bio) return 0;
      return formData.bio.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const bioWordCount = getBioWordCount();
    const minBioWords = 50;

    const handleFileUpload = async (e, fieldName) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, JPEG, JPG, and PNG files are allowed');
        return;
      }

      try {
        // Store the original file object and convert to base64 for preview
        const base64 = await convertToBase64(file);
        
        // Create preview URL for images
        let preview = null;
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
        }

        setFormData(prev => {
          // Clean up previous preview URL if exists
          if (prev[fieldName]?.preview && !prev[fieldName]?.isExisting) {
            URL.revokeObjectURL(prev[fieldName].preview);
          }
          
          return {
            ...prev,
            [fieldName]: {
              file: base64,
              originalFile: file,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              preview: preview,
              isExisting: false
            }
          };
        });
        setError('');
      } catch (error) {
        setError('Failed to process file. Please try again.');
      }
    };

    const convertToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
      });
    };


    const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);
    
      try {
        await validationSchema.validate(formData, { abortEarly: false });
    
        const fd = new FormData();
        fd.append("abnNumber", formData.abnNumber);
        if (formData.bio) fd.append("bio", formData.bio);
          
        const docs = ["policeCheck", "photoId", "visaWorkRights", "trainingCertificates"];
        let uploaded = false;
    
        docs.forEach((f) => {
          if (formData[f]?.originalFile) {
            fd.append(f, formData[f].originalFile);
            uploaded = true;
          }
        });
    
        if (!uploaded) throw new Error("Please upload at least one document.");
    
        const res = await userAPI.uploadDocuments(fd);
        if (!res.success) throw new Error(res.message || "Upload failed.");
    
        navigate(userRole === "NDIS Assistant" ? "/cleaner/compliance-quiz" : "/location");
      } 
      catch (err) {
        // Handle Yup validation errors
        if (err.inner && err.inner.length > 0) {
          setError(err.inner[0].message);
          return;
        }

        // Handle Backend validation errors
        const backendError = err.response?.errors?.[0]?.msg;
        const errorMessage = backendError || err.message || "Upload failed.";
        
        setError(errorMessage);
        console.error('Submit Error:', err);
      }
      finally {
        setIsLoading(false);
      }
    };
    


    return (
      <>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-custom mt-5">
            {/* Header */}
            <div className=" mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary-500 mb-2">
                Verify Your Documents
              </h1>
              <p className="text-sm sm:text-base text-primary-200 font-medium">
                Upload required documents to start receiving jobs. Admin will review within 24-48 hours.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Upload */}
              <div className="mb-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                      {formData.profilePicture?.preview ? (
                        <img
                          src={formData.profilePicture.preview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserRound className="w-16 h-16 text-gray-400" strokeWidth={2} />
                      )}
                    </div>
                    {/* Add/Change Button */}
                    <button
                      type="button"
                      onClick={() => document.getElementById('profile-picture-input').click()}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg bg-primary-600 transition-colors cursor-pointer z-10"
                    >
                      <PlusIcon className="w-5 h-5 text-white" />
                    </button>
                    {/* Remove Button - Show only when image is uploaded */}
                    {formData.profilePicture?.preview && (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        className="absolute top-0 right-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:bg-red-600 transition-colors cursor-pointer z-10"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    )}
                    <input
                      id="profile-picture-input"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-primary-500 mb-3">Bio</h3>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about your profession..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl! focus:outline-none text-primary-500 placeholder:text-primary-200 resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className={`text-xs font-medium ${bioWordCount < minBioWords ? 'text-primary-500' : 'text-primary-200'}`}>
                    Minimum {minBioWords} words
                  </p>
                  <p className={`text-xs font-medium ${bioWordCount < minBioWords ? 'text-primary-500' : 'text-primary-500'}`}>
                    {bioWordCount} {bioWordCount === 1 ? 'word' : 'words'}
                  </p>
                </div>
              </div>

              {/* ABN Number */}
              <div className="mb-6">
                <FloatingLabelInput
                  id="abnNumber"
                  name="abnNumber"
                  label="ABN Number (11-digit)"
                  type="text"
                  value={formData.abnNumber}
                  onChange={handleInputChange}
                  placeholder=""
                  maxLength={11}
                  required
                />
                <p className="text-sm text-primary-200 font-medium mt-1">
                  Your ABN is used for tax and compliance. Auto verification is instant.
                </p>
              </div>

              {/* Identity & Work Rights - Police Check */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary-500 mb-1">Identity & Work Rights</h3>
                <h4 className="text-sm font-medium text-primary-500 mb-1">Police Check</h4>
                <p className="text-xs text-primary-200 font-medium mb-3">Recent background check, mandatory for all cleaners.</p>
                <FileUploadArea
                  fieldName="policeCheck"
                  title=""
                  description=""
                  placeholder="to Upload PDF/JPEG"
                  onFileSelect={handleFileUpload}
                  selectedFile={formData.policeCheck}
                  onRemove={handleRemoveDocument}
                  className="mb-0!"
                />
              </div>
              <p className="text-sm text-primary-200 font-medium">
              Apply for a Police Clearance Certificate here if you don’t already have one.
                <Link to="https://www.afp.gov.au/our-services/national-police-checks" target="_blank" className="text-[#1F6FEB] hover:text-[#1F6FEB] font-medium underline cursor-pointer block">https://www.afp.gov.au/our-services/national-police-checks</Link>
              </p>


              {/* Visa/Work Rights */}
              <FileUploadArea
                fieldName="photoId"
                title="Photo ID"
                description="To verify your identity. Accepted: Passport /  Driver's License / Visa / Others."
                placeholder="to Upload Documents"
                onFileSelect={handleFileUpload}
                selectedFile={formData.photoId}
                onRemove={handleRemoveDocument}
              />

              {/* Training Certificates (Optional) */}
              <FileUploadArea
                fieldName="trainingCertificates"
                title="Training Certificates (Optional)"
                description="NDIS/Other certifications if applicable."
                placeholder="to Upload Documents"
                onFileSelect={handleFileUpload}
                selectedFile={formData.trainingCertificates}
                onRemove={handleRemoveDocument}
              />

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isLoading}
                  loading={isLoading}
                  size="md"
                  className="px-2 sm:px-4"
                >
                  {userRole === 'NDIS Assistant'
                    ? 'Submit Documents & Start Quiz'
                    : 'Submit Documents & Set Availability'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  };

  export default VerifyDocumentsPage;
