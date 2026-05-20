import * as yup from 'yup';

// NDIS Plan Info Validation Schema
export const ndisPlanInfoSchema = yup.object().shape({
  ndisNumber: yup.string()
    .required('NDIS Number is required')
    .matches(/^\d{9}$/, 'NDIS Number must be exactly 9 digits'),
  planManagerName: yup.string()
    .transform((value) => (value?.trim() === '' ? null : value.trim()))
    .nullable(),
  planManagerEmail: yup.string()
    .transform((value) => (value?.trim() === '' ? null : value.trim()))
    .nullable()
    .email('Please enter a valid email address'),
  phoneNumber: yup.string()
    .transform((value) => (value?.trim() === '' ? null : value.trim()))
    .nullable()
    .matches(/^\+61\s?\d{9}$/, 'Please enter a valid phone number'),
  planType: yup.string()
    .oneOf(['Plan manager', 'Self - managed NDIS'], 'Invalid plan type')
    .required('Plan type is required'),
  agreeToTerms1: yup.boolean()
    .oneOf([true], 'You must agree to the terms'),
  agreeToTerms2: yup.boolean()
    .oneOf([true], 'You must agree to the authorization')
});

// Signup Form Validation Schema
export const signupSchema = yup.object().shape({
  firstName: yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  phone: yup.string()
    .required('Phone number is required')
    .test('valid-phone', 'Please enter a valid phone number', (value) => {
      if (!value) return true;
      const cleaned = value.replace(/[^\d+]/g, '');
      return phoneRegex.test(cleaned) || australianPhoneRegex.test(cleaned) || /^\d{9,10}$/.test(cleaned);
    }),
  role: yup.string()
    .required('Role is required'),
  password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  agreeToTerms: yup.boolean()
    .oneOf([true], 'You must agree to the Terms & Conditions')
});

// Login Form Validation Schema
export const loginSchema = yup.object().shape({
  email: yup.string()
    .test('email-or-phone', 'Please enter a valid email or phone number', (value) => {
      if (!value) return true;
      const isEmail = emailRegex.test(value);
      const cleaned = value.replace(/[^\d+]/g, '');
      const isPhone = phoneRegex.test(cleaned) || australianPhoneRegex.test(cleaned) || /^\d{10}$/.test(cleaned);
      return isEmail || isPhone;
    })
    .required('Email or phone is required'),
  password: yup.string()
    .required('Password is required')
});

// Forgot Password Schema
export const forgotPasswordSchema = yup.object().shape({
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required')
});

// Reset Password Schema
export const resetPasswordSchema = yup.object().shape({
  password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password')
});

// Verify Documents Schema (Dynamic based on user role)
export const createVerifyDocumentsSchema = (userRole) => {
  return yup.object().shape({
    abnNumber: yup.string()
      .matches(/^\d{11}$/, 'ABN Number must be exactly 11 digits')
      .required('ABN Number is required'),
    bio: yup.string()
      .required('Bio is required')
      .min(10, 'Bio must be at least 10 characters')
      .max(1000, 'Bio cannot exceed 1000 characters'),
    policeCheck: yup.mixed().nullable(),
    photoId: yup.mixed().nullable(),
    trainingCertificates: yup.mixed().nullable()
  });
};

// Cleaning Job Service Detail Schema
export const serviceDetailSchema = yup.string()
  .transform((value) => (value ? value.trim() : ''))
  .required('Please specify the type of service you need');

export const cleaningJobDetailsSchema = yup.object().shape({
  serviceDetail: serviceDetailSchema
});

export const petSittingSchema = yup.object().shape({
  petType: yup.string().trim().required('Please enter your pet type'),
  petBreed: yup.string().trim().nullable(),
  numberOfPets: yup
    .number()
    .typeError('Number of pets must be a number')
    .integer('Number of pets must be an integer')
    .min(1, 'Please enter the number of pets')
    .required('Please enter the number of pets'),
  service: yup.string().required('Please select a pet sitting service')
});

export const housekeepingSchema = yup.object().shape({
  housekeepingServiceType: yup
    .array()
    .of(yup.string().trim())
    .min(1, 'Please select at least one housekeeping service')
    .required('Please select at least one housekeeping service')
});

export const handymanSchema = yup.object().shape({
  handymanServiceType: yup.string().required('Please select a handyman service type')
});

export const ndisJobSchema = yup.object().shape({
  ndisNumber: yup
    .string()
    .required('NDIS number is required')
    .matches(/^\d{9}$/, 'NDIS number must be exactly 9 digits'),
  supportType: yup.string().required('Please select an NDIS support type')
});

// Common Field Validations (reusable)
export const phoneRegex = /^(\+?61|0)?[2-478](\d{8})$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const australianPhoneRegex = /^(\+?61|0)?4\d{8}$/; // Specifically for mobile

// Helper Functions
export const validateField = async (schema, data) => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    const errors = {};
    if (err.inner) {
      err.inner.forEach((error) => {
        errors[error.path] = error.message;
      });
    }
    return { isValid: false, errors };
  }
};

