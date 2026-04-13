import React, { useRef, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { prevStep, nextStep, updateFormData } from '../../redux/slices/registrationSlice';
import { setRegFile } from '../../utils/registrationFiles';
import '../../styles/upload.css';

/* ── doc config ─────────────────────────────────────────────────────── */
const DOC_CONFIGS = [
  { key: 'operatingLicense', title: 'Operating License', hint: 'Max 5MB, PDF/JPG' },
  { key: 'businessCert',     title: 'Business Reg Cert', hint: 'Max 5MB, PDF/JPG' },
  { key: 'kraPinCert',           title: 'KRA PIN Cert',       hint: 'Max 5MB, PDF/JPG' },
  { key: 'proofOfAddress',   title: 'Proof of Address',   hint: 'Utility bill or Lease' },
];

/* ── file validation helper ──────────────────────────────────────────── */
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png'];

const fileField = (label) =>
  Yup.mixed()
    .required(`${label} is required`)
    .test('fileSize', 'File must be 5 MB or less',      (v) => !v || v.size <= MAX_SIZE)
    .test('fileType', 'Only PDF, JPG, or PNG accepted', (v) => !v || ACCEPTED.includes(v.type));

/* ── validation schema ───────────────────────────────────────────────── */
const ComplianceSchema = Yup.object({
  operatingLicense: fileField('Operating License'),
  businessCert:     fileField('Business Registration Certificate'),
  kraPinCert:           fileField('KRA PIN Certificate'),
  proofOfAddress:   fileField('Proof of Address'),

  mpesaNumber: Yup.string()
    .matches(/^(07|01|2547|2541)\d{7,8}$/, 'Enter a valid M-Pesa number (e.g. 0712345678)')
    .required('M-Pesa withdrawal number is required'),

  settlementFrequency: Yup.string()
    .oneOf(['daily', 'weekly', 'monthly'], 'Select a valid frequency')
    .required('Settlement frequency is required'),
});

/* ── simulate upload progress ────────────────────────────────────────── */
function simulateUpload(onProgress, onDone) {
  let pct = 0;
  const iv = setInterval(() => {
    pct = Math.min(pct + Math.floor(Math.random() * 20) + 8, 99);
    onProgress(pct);
  }, 180);
  const timeout = setTimeout(() => {
    clearInterval(iv);
    onProgress(100);
    onDone();
  }, 1800);
  return () => { clearInterval(iv); clearTimeout(timeout); };
}

/* ── svg icons ──────────────────────────────────────────────────────── */
const IconDoc = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" className="text-secondary">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const IconCheck = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" className="text-success">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IconSpinner = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" className="text-primary icon-spinner">
    <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10"/>
  </svg>
);
const IconLocation = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" className="text-secondary">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

function DocIcon({ docKey, status }) {
  if (status === 'done')           return <IconCheck />;
  if (status === 'uploading')      return <IconSpinner />;
  if (docKey === 'proofOfAddress') return <IconLocation />;
  return <IconDoc />;
}

/* ── upload card ─────────────────────────────────────────────────────── */
function UploadCard({ doc, setFieldValue, setFieldTouched, error, touched }) {
  const inputRef  = useRef();
  const cancelRef = useRef(null);

  const [status,   setStatus]   = useState('idle');
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState('');

  const handleFile = (file) => {
    if (!file) return;
    setFilename(file.name);
    setStatus('uploading');
    setProgress(0);
    setFieldValue(doc.key, file);
    setFieldTouched(doc.key, true, false);
    cancelRef.current = simulateUpload(
      (p) => setProgress(p),
      ()  => setStatus('done'),
    );
  };

  const handleCancel = () => {
    if (cancelRef.current) cancelRef.current();
    setStatus('idle');
    setProgress(0);
    setFilename('');
    setFieldValue(doc.key, null);
  };

  const extraBorder =
    touched && error             ? ' border border-danger'  :
    touched && status === 'done' ? ' border border-success' : '';

  const cardClass = [
    'upload-card card border-0 rounded-3 p-3 h-100 d-flex flex-column align-items-center text-center',
    status === 'uploading' ? 'is-uploading' : '',
    status === 'done'      ? 'is-done'      : '',
    extraBorder,
  ].join(' ');

  return (
    <div className="col-md-3 col-sm-6">
      <div className={cardClass}>
        <input
          ref={inputRef}
          type="file"
          className="d-none"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <div className="mb-2 mt-1">
          <DocIcon docKey={doc.key} status={status} />
        </div>

        <p className="fw-semibold small mb-1">{doc.title}</p>

        <p className="text-muted mb-1"
          style={{ fontSize: '0.7rem', minHeight: '1rem', width: '100%', textOverflow: 'ellipsis' }}>
          {status !== 'idle' ? filename : doc.hint}
        </p>

        {(status === 'uploading' || status === 'done') && (
          <div className="w-100 mt-1 mb-2">
            <div className="progress" style={{ height: 4 }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
            <div className="d-flex justify-content-between mt-1">
              <small className={status === 'done' ? 'text-success' : 'text-muted'}
                style={{ fontSize: '0.65rem' }}>
                {status === 'done' ? 'Uploaded' : `Uploading ${doc.title.toLowerCase()}…`}
              </small>
              <small className="text-muted" style={{ fontSize: '0.65rem' }}>{progress}%</small>
            </div>
          </div>
        )}

        {touched && error && (
          <small className="text-danger d-block mt-1" style={{ fontSize: '0.65rem' }}>
            {error}
          </small>
        )}

        <div className="mt-auto pt-1">
          {status === 'idle' && (
            <button type="button" className="btn btn-outline-primary btn-sm"
              onClick={() => inputRef.current.click()}>
              Select File
            </button>
          )}
          {status === 'uploading' && (
            <button type="button" className="btn btn-outline-secondary btn-sm"
              onClick={handleCancel}>
              Cancel
            </button>
          )}
          {status === 'done' && (
            <button type="button" className="btn btn-link btn-sm p-0"
              onClick={() => inputRef.current.click()}>
              Replace
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────────── */
const ComplianceAndFinance = () => {
  const dispatch = useDispatch();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Files are not serializable — keep them outside Redux
      if (values.operatingLicense) setRegFile('operating_license_doc', values.operatingLicense);
      if (values.businessCert)     setRegFile('business_reg_cert',     values.businessCert);
      if (values.kraPinCert)       setRegFile('kra_pin_cert',          values.kraPinCert);
      if (values.proofOfAddress)   setRegFile('proof_of_address_doc',  values.proofOfAddress);

      // Save text data to Redux — no API call yet.
      // The final step will send everything at once.
      dispatch(updateFormData({
        mpesa_method:         'TILL',
        short_code_number:    values.mpesaNumber.slice(-6),
        settlement_frequency: values.settlementFrequency.toUpperCase(),
      }));

      toast.success('Compliance documents saved');
      dispatch(nextStep());
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="registration-page container py-5" style={{ maxWidth: 880 }}>

      <h5 className="fw-bold mb-1">Step 3: Compliance Documents</h5>
      <p className="text-muted small mb-4">
        Please upload valid legal documents for pharmacy verification.
      </p>

      <Formik
        initialValues={{
          operatingLicense:    null,
          businessCert:        null,
          kraPinCert:              null,
          proofOfAddress:      null,
          mpesaNumber:         '',
          settlementFrequency: 'daily',
        }}
        validationSchema={ComplianceSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, setFieldTouched, values, errors, touched, isSubmitting }) => (
          <Form noValidate>

            {/* DOCUMENT CARDS */}
            <div className="row g-3 mb-5">
              {DOC_CONFIGS.map((doc) => (
                <UploadCard
                  key={doc.key}
                  doc={doc}
                  setFieldValue={setFieldValue}
                  setFieldTouched={setFieldTouched}
                  error={errors[doc.key]}
                  touched={touched[doc.key]}
                />
              ))}
            </div>

            {/* ── STEP 4 ── */}
            <h5 className="fw-bold mb-1">Step 4: Financial Setup</h5>
            <p className="text-muted small mb-4">
              Configure your settlement accounts and payment reception.
            </p>

            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
              <div className="row g-4 align-items-start">

                {/* Mpesa number */}
                <div className="col-md-6">
                  <label className="form-label fw-bold small mb-1">
                    Mpesa Withdrawal Number
                  </label>
                  <Field
                    name="mpesaNumber"
                    className={`form-control${
                      touched.mpesaNumber && errors.mpesaNumber ? ' is-invalid'
                      : touched.mpesaNumber ? ' is-valid' : ''
                    }`}
                    placeholder="2547••••••••"
                  />
                  {touched.mpesaNumber && errors.mpesaNumber && (
                    <div className="invalid-feedback">{errors.mpesaNumber}</div>
                  )}
                </div>

                {/* Settlement frequency */}
                <div className="col-md-6">
                  <label className="form-label fw-bold small mb-2 d-block">
                    Settlement Frequency
                  </label>
                  <div className="d-flex gap-2 mb-3" role="group" aria-label="Settlement Frequency">
                    {['daily', 'weekly', 'monthly'].map((f) => (
                      <label
                        key={f}
                        className={`freq-btn flex-fill text-center border rounded-2 py-1 px-2 small fw-medium${values.settlementFrequency === f ? ' active' : ''}`}
                      >
                        <Field type="radio" name="settlementFrequency" value={f} />
                        <span className="text-capitalize">{f}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                    Transactions processed before 5 PM EAT will be settled
                    according to your selected frequency.
                  </p>
                </div>

              </div>
            </div>

            {/* ACTIONS */}
            <div className="d-flex justify-content-between align-items-center">
              <button type="button" className="btn btn-light"
                onClick={() => dispatch(prevStep())}>
                ← Back
              </button>
              <button
                type="submit"
                className="btn btn-primary px-5"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Processing…</>
                  : 'Next Step →'
                }
              </button>
            </div>

          </Form>
        )}
      </Formik>

      {/* footer */}
      <div className="text-center mt-5">
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

export default ComplianceAndFinance;