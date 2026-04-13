// import React, { useState } from 'react';
// import { Formik, Form, Field } from 'formik';
// import * as Yup from 'yup';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from '@tanstack/react-router';
// import { toast } from 'react-toastify';
// import { prevStep, resetRegistration } from '../../redux/slices/registrationSlice';
// import { getAllRegFiles, clearRegFiles } from '../../utils/registrationFiles';
// import { setCredentials } from '../../redux/slices/authSlice';
// import api from '../../api/client';
// import '../../styles/securityAndLegal.css';

// /* ── password strength calculator ───────────────────────────────────── */
// function getStrength(pwd) {
//   if (!pwd) return { score: 0, label: '', color: '' };
//   let score = 0;
//   if (pwd.length >= 8)          score++;
//   if (/[A-Z]/.test(pwd))        score++;
//   if (/[0-9]/.test(pwd))        score++;
//   if (/[^A-Za-z0-9]/.test(pwd)) score++;

//   const map = [
//     { label: 'WEAK',   color: 'bg-danger'  },
//     { label: 'FAIR',   color: 'bg-warning' },
//     { label: 'GOOD',   color: 'bg-info'    },
//     { label: 'STRONG', color: 'bg-success' },
//   ];
//   return { score, ...map[score - 1] || map[0] };
// }

// const SECURITY_QUESTIONS = [
//   'What was the name of your first pharmacy mentor?',
//   'What city was your first pharmacy located in?',
//   'What is the name of your pharmacy school?',
//   'What was the name of your first employer?',
// ];

// /* ── validation schema ───────────────────────────────────────────────── */
// const SecuritySchema = Yup.object({
//   password: Yup.string()
//     .min(8, 'Password must be at least 8 characters')
//     .matches(/[A-Z]/,           'Must contain at least one uppercase letter')
//     .matches(/[0-9]/,           'Must contain at least one number')
//     .matches(/[^A-Za-z0-9]/,   'Must contain at least one special character')
//     .required('Password is required'),

//   confirmPassword: Yup.string()
//     .oneOf([Yup.ref('password')], 'Passwords do not match')
//     .required('Please confirm your password'),

//   securityAnswer: Yup.string()
//     .min(2, 'Answer must be at least 2 characters')
//     .required('Security answer is required'),

//   licensing: Yup.boolean()
//     .oneOf([true], 'You must affirm the licensing declaration'),

//   dpa: Yup.boolean()
//     .oneOf([true], 'You must consent to the Data Protection Act'),

//   verification: Yup.boolean()
//     .oneOf([true], 'You must provide verification consent'),

//   termsPrivacy: Yup.boolean()
//     .oneOf([true], 'You must accept the Terms of Service and Privacy Policy'),
// });

// /* ── eye icon ────────────────────────────────────────────────────────── */
// const EyeIcon = ({ off }) => (
//   <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
//     stroke="currentColor" strokeWidth="2" className="text-muted">
//     {off
//       ? <>
//           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
//           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
//           <line x1="1" y1="1" x2="23" y2="23"/>
//         </>
//       : <>
//           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
//           <circle cx="12" cy="12" r="3"/>
//         </>
//     }
//   </svg>
// );

// /* ── checkbox row with error ─────────────────────────────────────────── */
// const CheckRow = ({ name, id, label, description, errors, touched }) => (
//   <div className="d-flex gap-3 mb-3">
//     <Field
//       type="checkbox"
//       name={name}
//       id={id}
//       className={`form-check-input mt-1 flex-shrink-0${touched[name] && errors[name] ? ' is-invalid' : ''}`}
//     />
//     <div>
//       <label htmlFor={id} className="form-check-label">
//         <span className="fw-semibold small d-block">{label}</span>
//         {description && <small className="text-muted">{description}</small>}
//       </label>
//       {touched[name] && errors[name] && (
//         <div className="text-danger" style={{ fontSize: '0.75rem' }}>{errors[name]}</div>
//       )}
//     </div>
//   </div>
// );

// /* ── main component ──────────────────────────────────────────────────── */
// const SecurityAndLegal = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { registrationId, formData: savedFormData } = useSelector((state) => state.registration);
//   const [showPwd,     setShowPwd]     = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   const handleSubmit = async (values, { setSubmitting }) => {
//     try {
//       // Build one FormData from all data collected across the steps
//       const fd = new FormData();

//       // Text fields — stored in Redux by previous steps
//       const textFields = [
//         'pharmacy_name_legal', 'trading_name', 'business_reg_no', 'kra_pin',
//         'ppb_license_no', 'license_expiry', 'county', 'sub_county',
//         'physical_address', 'gps_lat', 'gps_lng', 'business_phone', 'business_email',
//         'pharmacist_name', 'id_or_passport_no', 'pharmacist_reg_no',
//         'practicing_license', 'practicing_expiry', 'pharmacist_phone', 'pharmacist_email',
//         'mpesa_method', 'short_code_number', 'settlement_frequency',
//       ];
//       textFields.forEach((key) => {
//         if (savedFormData[key] !== undefined && savedFormData[key] !== null) {
//           fd.append(key, savedFormData[key]);
//         }
//       });

//       // File fields — stored in the module-level Map (not Redux)
//       const files = getAllRegFiles();
//       Object.entries(files).forEach(([key, file]) => {
//         if (file) fd.append(key, file);
//       });

//       // Security fields from this final step
//       fd.append('password', values.password);
//       fd.append('two_factor_enabled', values.twoFactor);
//       fd.append('security_question', values.securityQuestion);
//       fd.append('security_answer', values.securityAnswer);

//       console.log(fd);

//       // Single API call — all data sent at once
//       const res = await api.post('/auth/register/complete/', fd, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       const { access_token, refresh_token, user } = res.data?.data || res.data;

//       dispatch(setCredentials({ user, token: access_token, refreshToken: refresh_token }));
//       dispatch(resetRegistration());
//       clearRegFiles();

//       toast.success('Registration complete! Welcome to AfyaBridge.');
//       navigate({ to: '/dashboard' });
//     } catch (err) {
//       console.error('Submission error:', err);
//       const errors = err.response?.data?.errors;
//       if (errors) {
//         const errorMsgs = Object.entries(errors)
//           .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
//           .join('\n');
//         toast.error(errorMsgs);
//       } else {
//         const msg = err.response?.data?.message || 'Registration failed. Please try again.';
//         toast.error(msg);
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="registration-page container py-5" style={{ maxWidth: 680 }}>

//       <h5 className="fw-bold mb-1">Step 5: Final Security &amp; Legal Compliance</h5>
//       <p className="text-muted small mb-4">
//         You are almost there. We just need to secure your account and verify legal compliance.
//       </p>

//       <Formik
//         initialValues={{
//           password:         '',
//           confirmPassword:  '',
//           twoFactor:        true,
//           securityQuestion: SECURITY_QUESTIONS[0],
//           securityAnswer:   '',
//           licensing:        false,
//           dpa:              false,
//           verification:     false,
//           termsPrivacy:     false,
//         }}
//         validationSchema={SecuritySchema}
//         onSubmit={handleSubmit}
//       >
//         {({ values, errors, touched, setFieldValue }) => {
//           const strength = getStrength(values.password);

//           return (
//             <Form noValidate>

//               {/* ── SECURITY CREDENTIALS ── */}
//               <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
//                 <h6 className="fw-bold mb-3">Security Credentials</h6>

//                 <div className="row g-3 mb-3">

//                   {/* Password */}
//                   <div className="col-md-6">
//                     <label className="form-label small">Password</label>
//                     <div className="input-group has-validation">
//                       <Field
//                         name="password"
//                         type={showPwd ? 'text' : 'password'}
//                         className={`form-control border-end-0${
//                           touched.password && errors.password ? ' is-invalid'
//                           : touched.password ? ' is-valid' : ''
//                         }`}
//                         placeholder="Min. 8 characters"
//                       />
//                       <button
//                         type="button"
//                         className="btn btn-outline-secondary border-start-0"
//                         onClick={() => setShowPwd(v => !v)}
//                         tabIndex={-1}
//                       >
//                         <EyeIcon off={showPwd} />
//                       </button>
//                       {touched.password && errors.password && (
//                         <div className="invalid-feedback">{errors.password}</div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Confirm Password */}
//                   <div className="col-md-6">
//                     <label className="form-label small">Confirm Password</label>
//                     <div className="input-group has-validation">
//                       <Field
//                         name="confirmPassword"
//                         type={showConfirm ? 'text' : 'password'}
//                         className={`form-control border-end-0${
//                           touched.confirmPassword && errors.confirmPassword ? ' is-invalid'
//                           : touched.confirmPassword ? ' is-valid' : ''
//                         }`}
//                         placeholder="Repeat password"
//                       />
//                       <button
//                         type="button"
//                         className="btn btn-outline-secondary border-start-0"
//                         onClick={() => setShowConfirm(v => !v)}
//                         tabIndex={-1}
//                       >
//                         <EyeIcon off={showConfirm} />
//                       </button>
//                       {touched.confirmPassword && errors.confirmPassword && (
//                         <div className="invalid-feedback">{errors.confirmPassword}</div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Password strength */}
//                 {values.password && (
//                   <div className="mb-3">
//                     <div className="d-flex justify-content-between mb-1">
//                       <small className="text-muted fw-semibold"
//                         style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
//                         PASSWORD STRENGTH
//                       </small>
//                       <small className={`fw-bold strength-label-${strength.score}`}
//                         style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
//                         {strength.label}
//                       </small>
//                     </div>
//                     <div className="progress" style={{ height: 5 }}>
//                       <div
//                         className={`progress-bar ${strength.color}`}
//                         style={{ width: `${(strength.score / 4) * 100}%`, transition: 'width 0.3s ease' }}
//                         role="progressbar"
//                       />
//                     </div>
//                     <small className="text-muted" style={{ fontSize: '0.65rem' }}>
//                       Include numbers, symbols, and mixed case for maximum security.
//                     </small>
//                   </div>
//                 )}

//                 {/* 2FA toggle */}
//                 <div className="d-flex justify-content-between align-items-start border rounded-3 p-3 mb-3">
//                   <div>
//                     <p className="fw-semibold small mb-0">Two-Factor Authentication (2FA)</p>
//                     <small className="text-muted">Recommended for healthcare data protection.</small>
//                   </div>
//                   <div className="form-check form-switch ms-3 mt-1">
//                     <input
//                       className="form-check-input twofa-switch"
//                       type="checkbox"
//                       role="switch"
//                       id="twoFactorSwitch"
//                       checked={values.twoFactor}
//                       onChange={(e) => setFieldValue('twoFactor', e.target.checked)}
//                     />
//                   </div>
//                 </div>

//                 {/* Security question */}
//                 <div className="mb-1">
//                   <label className="form-label small fw-semibold">Security Question</label>
//                   <Field as="select" name="securityQuestion" className="form-select mb-2">
//                     {SECURITY_QUESTIONS.map((q) => (
//                       <option key={q} value={q}>{q}</option>
//                     ))}
//                   </Field>
//                   <Field
//                     name="securityAnswer"
//                     className={`form-control${
//                       touched.securityAnswer && errors.securityAnswer ? ' is-invalid'
//                       : touched.securityAnswer ? ' is-valid' : ''
//                     }`}
//                     placeholder="Your Answer"
//                   />
//                   {touched.securityAnswer && errors.securityAnswer && (
//                     <div className="invalid-feedback">{errors.securityAnswer}</div>
//                   )}
//                 </div>
//               </div>

//               {/* ── LEGAL DECLARATIONS ── */}
//               <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
//                 <h6 className="fw-bold mb-3">Legal &amp; Regulatory Declarations</h6>

//                 <CheckRow
//                   name="licensing"
//                   id="licensing"
//                   label="Licensing Affirmation"
//                   description="I certify that all provided pharmacy licenses and professional certifications are valid and current according to the Pharmacy and Poisons Board regulations."
//                   errors={errors}
//                   touched={touched}
//                 />

//                 <CheckRow
//                   name="dpa"
//                   id="dpa"
//                   label="Data Protection Act (DPA) Consent"
//                   description="I consent to the processing of personal and business data as per the Data Protection Act for the purpose of registration and regulatory monitoring."
//                   errors={errors}
//                   touched={touched}
//                 />

//                 <CheckRow
//                   name="verification"
//                   id="verification"
//                   label="Verification Consent"
//                   description="I authorize AfyaBridge to verify the submitted documents with relevant regulatory authorities and professional bodies."
//                   errors={errors}
//                   touched={touched}
//                 />

//                 {/* Terms & Privacy — custom label with links */}
//                 <div className="d-flex gap-3">
//                   <Field
//                     type="checkbox"
//                     name="termsPrivacy"
//                     id="termsPrivacy"
//                     className={`form-check-input mt-1 flex-shrink-0${
//                       touched.termsPrivacy && errors.termsPrivacy ? ' is-invalid' : ''
//                     }`}
//                   />
//                   <div>
//                     <label htmlFor="termsPrivacy" className="form-check-label small">
//                       I have read and agree to the{' '}
//                       <a href="#" className="text-primary text-decoration-none">Terms of Service</a>
//                       {' '}and{' '}
//                       <a href="#" className="text-primary text-decoration-none">Privacy Policy</a>.
//                     </label>
//                     {touched.termsPrivacy && errors.termsPrivacy && (
//                       <div className="text-danger" style={{ fontSize: '0.75rem' }}>
//                         {errors.termsPrivacy}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* ACTIONS */}
//               <div className="d-flex justify-content-between align-items-center mb-2">
//                 <button type="button" className="btn btn-light"
//                   onClick={() => dispatch(prevStep())}>
//                   ← Back
//                 </button>
//                 <button type="submit" className="btn btn-primary px-5 flex-grow-1 ms-3">
//                   Submit for Verification ➤
//                 </button>
//               </div>

//             </Form>
//           );
//         }}
//       </Formik>

//       {/* footer */}
//       <div className="text-center mt-4">
//         <small className="text-muted d-block mb-1">
//           © 2024 AfyaBridge Healthcare Solutions. All Rights Reserved.
//         </small>
//         <small>
//           <a href="#" className="text-muted text-decoration-none me-2">Privacy Policy</a>
//           <a href="#" className="text-muted text-decoration-none me-2">Terms of Service</a>
//           <a href="#" className="text-muted text-decoration-none">Contact Support</a>
//         </small>
//       </div>

//     </div>
//   );
// };

// export default SecurityAndLegal;


import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'react-toastify';
import { prevStep, resetRegistration } from '../../redux/slices/registrationSlice';
import { getAllRegFiles, clearRegFiles } from '../../utils/registrationFiles';
import { setCredentials } from '../../redux/slices/authSlice';
import api from '../../api/client';
import '../../styles/securityAndLegal.css';

/* ── password strength calculator ───────────────────────────────────── */
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const map = [
    { label: 'WEAK',   color: 'bg-danger'  },
    { label: 'FAIR',   color: 'bg-warning' },
    { label: 'GOOD',   color: 'bg-info'    },
    { label: 'STRONG', color: 'bg-success' },
  ];
  return { score, ...map[score - 1] || map[0] };
}

const SECURITY_QUESTIONS = [
  'What was the name of your first pharmacy mentor?',
  'What city was your first pharmacy located in?',
  'What is the name of your pharmacy school?',
  'What was the name of your first employer?',
];

/* ── validation schema ───────────────────────────────────────────────── */
const SecuritySchema = Yup.object({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/,           'Must contain at least one uppercase letter')
    .matches(/[0-9]/,           'Must contain at least one number')
    .matches(/[^A-Za-z0-9]/,   'Must contain at least one special character')
    .required('Password is required'),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),

  securityAnswer: Yup.string()
    .min(2, 'Answer must be at least 2 characters')
    .required('Security answer is required'),

  licensing: Yup.boolean()
    .oneOf([true], 'You must affirm the licensing declaration'),

  dpa: Yup.boolean()
    .oneOf([true], 'You must consent to the Data Protection Act'),

  verification: Yup.boolean()
    .oneOf([true], 'You must provide verification consent'),

  termsPrivacy: Yup.boolean()
    .oneOf([true], 'You must accept the Terms of Service and Privacy Policy'),
});

/* ── eye icon ────────────────────────────────────────────────────────── */
const EyeIcon = ({ off }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" className="text-muted">
    {off
      ? <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      : <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </>
    }
  </svg>
);

/* ── checkbox row with error ─────────────────────────────────────────── */
const CheckRow = ({ name, id, label, description, errors, touched }) => (
  <div className="d-flex gap-3 mb-3">
    <Field
      type="checkbox"
      name={name}
      id={id}
      className={`form-check-input mt-1 flex-shrink-0${touched[name] && errors[name] ? ' is-invalid' : ''}`}
    />
    <div>
      <label htmlFor={id} className="form-check-label">
        <span className="fw-semibold small d-block">{label}</span>
        {description && <small className="text-muted">{description}</small>}
      </label>
      {touched[name] && errors[name] && (
        <div className="text-danger" style={{ fontSize: '0.75rem' }}>{errors[name]}</div>
      )}
    </div>
  </div>
);

/* ── main component ──────────────────────────────────────────────────── */
const SecurityAndLegal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registrationId, formData: savedFormData } = useSelector((state) => state.registration);
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // ── Step 1: Upload each document file to Cloudinary ────────────────────
      // Backend expects URL strings, not raw file binaries.
      // Cloudinary unsigned upload — uses your upload preset.
      const CLOUDINARY_URL    = 'https://api.cloudinary.com/v1_1/daj0gmvor/raw/upload';
      const CLOUDINARY_PRESET = 'afyabridge_pharmacy_docs'; // unsigned preset name

      const uploadToCloudinary = async (file) => {
        if (!file) return null;
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', CLOUDINARY_PRESET);
        const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: fd });
        if (!res.ok) throw new Error(`Document upload failed: ${file.name}`);
        const data = await res.json();
        return data.secure_url;
      };

      toast.info('Uploading documents…', { autoClose: false, toastId: 'upload' });

      const files = getAllRegFiles();
      const [
        idDocUrl,
        practicingLicDocUrl,
        operatingLicUrl,
        businessRegCertUrl,
        kraPinCertUrl,
        proofOfAddressUrl,
      ] = await Promise.all([
        uploadToCloudinary(files.id_document),
        uploadToCloudinary(files.practicing_license_doc),
        uploadToCloudinary(files.operating_license_doc),
        uploadToCloudinary(files.business_reg_cert),
        uploadToCloudinary(files.kra_pin_cert),
        uploadToCloudinary(files.proof_of_address_doc),
      ]);

      toast.dismiss('upload');

      // ── Step 2: Build FormData — text fields + Cloudinary URL strings ──────
      // Backend expects multipart/form-data even though doc URLs are strings
      const fd = new FormData();

      const append = (key, val) => {
        if (val !== undefined && val !== null && val !== '') fd.append(key, val);
      };

      // Business info
      append('pharmacy_name_legal',  savedFormData.pharmacy_name_legal);
      append('trading_name',         savedFormData.trading_name);
      append('business_reg_no',      savedFormData.business_reg_no);
      append('kra_pin',              savedFormData.kra_pin);
      append('ppb_license_no',       savedFormData.ppb_license_no);
      append('license_expiry',       savedFormData.license_expiry);
      append('county',               savedFormData.county);
      append('sub_county',           savedFormData.sub_county);
      append('physical_address',     savedFormData.physical_address);
      append('gps_lat',              savedFormData.gps_lat);
      append('gps_lng',              savedFormData.gps_lng);
      append('business_phone',       savedFormData.business_phone);
      append('business_email',       savedFormData.business_email);
      // Pharmacist info
      append('pharmacist_name',      savedFormData.pharmacist_name);
      append('id_or_passport_no',    savedFormData.id_or_passport_no);
      append('pharmacist_reg_no',    savedFormData.pharmacist_reg_no);
      append('practicing_license',   savedFormData.practicing_license);
      append('practicing_expiry',    savedFormData.practicing_expiry);
      append('pharmacist_phone',     savedFormData.pharmacist_phone);
      append('pharmacist_email',     savedFormData.pharmacist_email);
      // Financial
      append('mpesa_method',         savedFormData.mpesa_method);
      append('short_code_number',    savedFormData.short_code_number);
      append('settlement_frequency', savedFormData.settlement_frequency);
      // Document URLs from Cloudinary (sent as string fields in FormData)
      append('id_document',            idDocUrl);
      append('practicing_license_doc', practicingLicDocUrl);
      append('operating_license_doc',  operatingLicUrl);
      append('business_reg_cert',      businessRegCertUrl);
      append('kra_pin_cert',           kraPinCertUrl);
      append('proof_of_address_doc',   proofOfAddressUrl);
      // Security
      append('password',           values.password);
      append('two_factor_enabled', values.twoFactor);
      append('security_question',  values.securityQuestion);
      append('security_answer',    values.securityAnswer);

      // ── Step 3: POST as multipart/form-data ───────────────────────────────
      const res = await api.post('/auth/register/complete/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Backend returns { data: { user: {...} } } — no tokens on registration
      // If backend returns tokens use them, otherwise redirect to login
      const responseData = res.data?.data || res.data;
      const { access_token, refresh_token, user } = responseData;

      if (access_token) {
        dispatch(setCredentials({ user, token: access_token, refreshToken: refresh_token }));
        dispatch(resetRegistration());
        clearRegFiles();
        toast.success('Registration complete! Welcome to AfyaBridge.');
        navigate({ to: '/dashboard' });
      } else {
        // Registration succeeded but no auto-login — redirect to login
        dispatch(resetRegistration());
        clearRegFiles();
        toast.success('Pharmacy registered successfully! Please sign in to continue.');
        navigate({ to: '/auth/login' });
      }
    } catch (err) {
      console.error('Submission error:', err);
      toast.dismiss('upload');
      const errors = err.response?.data?.errors;
      if (errors) {
        const errorMsgs = Object.entries(errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        toast.error(errorMsgs);
      } else {
        const msg = err.response?.data?.message || 'Registration failed. Please try again.';
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="registration-page container py-5" style={{ maxWidth: 680 }}>

      <h5 className="fw-bold mb-1">Step 5: Final Security &amp; Legal Compliance</h5>
      <p className="text-muted small mb-4">
        You are almost there. We just need to secure your account and verify legal compliance.
      </p>

      <Formik
        initialValues={{
          password:         '',
          confirmPassword:  '',
          twoFactor:        true,
          securityQuestion: SECURITY_QUESTIONS[0],
          securityAnswer:   '',
          licensing:        false,
          dpa:              false,
          verification:     false,
          termsPrivacy:     false,
        }}
        validationSchema={SecuritySchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setFieldValue }) => {
          const strength = getStrength(values.password);

          return (
            <Form noValidate>

              {/* ── SECURITY CREDENTIALS ── */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                <h6 className="fw-bold mb-3">Security Credentials</h6>

                <div className="row g-3 mb-3">

                  {/* Password */}
                  <div className="col-md-6">
                    <label className="form-label small">Password</label>
                    <div className="input-group has-validation">
                      <Field
                        name="password"
                        type={showPwd ? 'text' : 'password'}
                        className={`form-control border-end-0${
                          touched.password && errors.password ? ' is-invalid'
                          : touched.password ? ' is-valid' : ''
                        }`}
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary border-start-0"
                        onClick={() => setShowPwd(v => !v)}
                        tabIndex={-1}
                      >
                        <EyeIcon off={showPwd} />
                      </button>
                      {touched.password && errors.password && (
                        <div className="invalid-feedback">{errors.password}</div>
                      )}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="col-md-6">
                    <label className="form-label small">Confirm Password</label>
                    <div className="input-group has-validation">
                      <Field
                        name="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        className={`form-control border-end-0${
                          touched.confirmPassword && errors.confirmPassword ? ' is-invalid'
                          : touched.confirmPassword ? ' is-valid' : ''
                        }`}
                        placeholder="Repeat password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary border-start-0"
                        onClick={() => setShowConfirm(v => !v)}
                        tabIndex={-1}
                      >
                        <EyeIcon off={showConfirm} />
                      </button>
                      {touched.confirmPassword && errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password strength */}
                {values.password && (
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted fw-semibold"
                        style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                        PASSWORD STRENGTH
                      </small>
                      <small className={`fw-bold strength-label-${strength.score}`}
                        style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                        {strength.label}
                      </small>
                    </div>
                    <div className="progress" style={{ height: 5 }}>
                      <div
                        className={`progress-bar ${strength.color}`}
                        style={{ width: `${(strength.score / 4) * 100}%`, transition: 'width 0.3s ease' }}
                        role="progressbar"
                      />
                    </div>
                    <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                      Include numbers, symbols, and mixed case for maximum security.
                    </small>
                  </div>
                )}

                {/* 2FA toggle */}
                <div className="d-flex justify-content-between align-items-start border rounded-3 p-3 mb-3">
                  <div>
                    <p className="fw-semibold small mb-0">Two-Factor Authentication (2FA)</p>
                    <small className="text-muted">Recommended for healthcare data protection.</small>
                  </div>
                  <div className="form-check form-switch ms-3 mt-1">
                    <input
                      className="form-check-input twofa-switch"
                      type="checkbox"
                      role="switch"
                      id="twoFactorSwitch"
                      checked={values.twoFactor}
                      onChange={(e) => setFieldValue('twoFactor', e.target.checked)}
                    />
                  </div>
                </div>

                {/* Security question */}
                <div className="mb-1">
                  <label className="form-label small fw-semibold">Security Question</label>
                  <Field as="select" name="securityQuestion" className="form-select mb-2">
                    {SECURITY_QUESTIONS.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </Field>
                  <Field
                    name="securityAnswer"
                    className={`form-control${
                      touched.securityAnswer && errors.securityAnswer ? ' is-invalid'
                      : touched.securityAnswer ? ' is-valid' : ''
                    }`}
                    placeholder="Your Answer"
                  />
                  {touched.securityAnswer && errors.securityAnswer && (
                    <div className="invalid-feedback">{errors.securityAnswer}</div>
                  )}
                </div>
              </div>

              {/* ── LEGAL DECLARATIONS ── */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                <h6 className="fw-bold mb-3">Legal &amp; Regulatory Declarations</h6>

                <CheckRow
                  name="licensing"
                  id="licensing"
                  label="Licensing Affirmation"
                  description="I certify that all provided pharmacy licenses and professional certifications are valid and current according to the Pharmacy and Poisons Board regulations."
                  errors={errors}
                  touched={touched}
                />

                <CheckRow
                  name="dpa"
                  id="dpa"
                  label="Data Protection Act (DPA) Consent"
                  description="I consent to the processing of personal and business data as per the Data Protection Act for the purpose of registration and regulatory monitoring."
                  errors={errors}
                  touched={touched}
                />

                <CheckRow
                  name="verification"
                  id="verification"
                  label="Verification Consent"
                  description="I authorize AfyaBridge to verify the submitted documents with relevant regulatory authorities and professional bodies."
                  errors={errors}
                  touched={touched}
                />

                {/* Terms & Privacy — custom label with links */}
                <div className="d-flex gap-3">
                  <Field
                    type="checkbox"
                    name="termsPrivacy"
                    id="termsPrivacy"
                    className={`form-check-input mt-1 flex-shrink-0${
                      touched.termsPrivacy && errors.termsPrivacy ? ' is-invalid' : ''
                    }`}
                  />
                  <div>
                    <label htmlFor="termsPrivacy" className="form-check-label small">
                      I have read and agree to the{' '}
                      <a href="#" className="text-primary text-decoration-none">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="text-primary text-decoration-none">Privacy Policy</a>.
                    </label>
                    {touched.termsPrivacy && errors.termsPrivacy && (
                      <div className="text-danger" style={{ fontSize: '0.75rem' }}>
                        {errors.termsPrivacy}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <button type="button" className="btn btn-light"
                  onClick={() => dispatch(prevStep())}>
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary px-5 flex-grow-1 ms-3">
                  Submit for Verification ➤
                </button>
              </div>

            </Form>
          );
        }}
      </Formik>

      {/* footer */}
      <div className="text-center mt-4">
        <small className="text-muted d-block mb-1">
          © 2024 AfyaBridge Healthcare Solutions. All Rights Reserved.
        </small>
        <small>
          <a href="#" className="text-muted text-decoration-none me-2">Privacy Policy</a>
          <a href="#" className="text-muted text-decoration-none me-2">Terms of Service</a>
          <a href="#" className="text-muted text-decoration-none">Contact Support</a>
        </small>
      </div>

    </div>
  );
};

export default SecurityAndLegal;