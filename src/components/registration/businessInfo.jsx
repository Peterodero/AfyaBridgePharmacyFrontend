import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from '@tanstack/react-router';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { nextStep, updateFormData } from '../../redux/slices/registrationSlice';
import { setRegFile } from '../../utils/registrationFiles';
import { LocationPicker } from '../map/locationPicker';
import { RiHospitalLine, RiUserStarLine, RiCheckLine } from 'react-icons/ri';

/* ── validation schema ───────────────────────────────────────────────── */
const BusinessInfoSchema = Yup.object({

  /* Step 1 – Business */
  pharmacyName: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Pharmacy name is required'),

  tradingName: Yup.string()
    .min(2, 'Trading name must be at least 2 characters')
    .required('Trading name is required'),

  businessRegNo: Yup.string()
    .matches(/^PVT-[A-Z0-9]{6,}$/i, 'Format: PVT-XXXXXX')
    .required('Business registration number is required'),

  kraPin: Yup.string()
    .matches(/^[A-Z]\d{9}[A-Z]$/i, 'Format: A00XXXXXXXXZ (11 characters)')
    .required('KRA PIN is required'),

  ppbLicenseNo: Yup.string()
    .matches(/^PPB\/\d{4}\/\w{4,}$/i, 'Format: PPB/YYYY/XXXX')
    .required('PPB License number is required'),

  ppbLicenseExpiry: Yup.date()
    .min(new Date(), 'License must not be expired')
    .required('License expiry date is required'),

  businessPhone: Yup.string()
    .matches(/^(07|01)\d{8}$/, 'Enter a valid Kenyan phone number (e.g. 0700123456)')
    .required('Business phone is required'),

  businessEmail: Yup.string()
    .email('Enter a valid email address')
    .required('Business email is required'),

  /* Step 2 – Superintendent */
  superintendent: Yup.string()
    .min(3, 'Full name must be at least 3 characters')
    .required('Pharmacist name is required'),

  idOrPassportNumber: Yup.string()
    .matches(/^[A-Z0-9]{6,12}$/i, 'Enter a valid ID or Passport number (6–12 characters)')
    .required('ID or Passport number is required'),

  pharmacistRegistrationNo: Yup.string()
    .matches(/^P\/\d{4}\/\d{4,}$/i, 'Format: P/YYYY/XXXXX')
    .required('Pharmacist registration number is required'),

  practicingLicenseNo: Yup.string()
    .matches(/^P\/\d{4}\/\d{4,}$/i, 'Format: P/YYYY/XXXXX')
    .required('Practicing license number is required'),

  practicingLicenseExpiry: Yup.date()
    .min(new Date(), 'License must not be expired')
    .required('Practicing license expiry is required'),

  personalPhone: Yup.string()
    .matches(/^(07|01)\d{8}$/, 'Enter a valid Kenyan phone number (e.g. 0700123456)')
    .required('Personal phone is required'),

  personalEmail: Yup.string()
    .email('Enter a valid email address')
    .required('Personal email is required'),

  /* File uploads */
  idDocument: Yup.mixed()
    .required('Please upload your ID or Passport')
    .test('fileSize', 'File must be 5 MB or less', (v) => !v || v.size <= 5 * 1024 * 1024)
    .test('fileType', 'Only PDF, JPG, or PNG files are accepted', (v) =>
      !v || ['application/pdf', 'image/jpeg', 'image/png'].includes(v.type)
    ),

  practicingLicenseDocument: Yup.mixed()
    .required('Please upload your Practicing License')
    .test('fileSize', 'File must be 5 MB or less', (v) => !v || v.size <= 5 * 1024 * 1024)
    .test('fileType', 'Only PDF, JPG, or PNG files are accepted', (v) =>
      !v || ['application/pdf', 'image/jpeg', 'image/png'].includes(v.type)
    ),
});

/* ── small helpers ───────────────────────────────────────────────────── */
const FieldError = ({ name, errors, touched }) =>
  touched[name] && errors[name]
    ? <div className="invalid-feedback d-block">{errors[name]}</div>
    : null;

const fc = (name, errors, touched) =>
  `form-control bg-light border border-gray${touched[name] && errors[name] ? ' is-invalid' : touched[name] ? ' is-valid' : ''}`;

/* ── main component ──────────────────────────────────────────────────── */
const BusinessInfo = () => {
  const dispatch = useDispatch();

  const idInputRef      = useRef(null);
  const licenseInputRef = useRef(null);

  const [position, setPosition] = useState([-1.286389, 36.817223]);
  const toSixDecimals = (value) => Number.parseFloat(Number(value).toFixed(6));

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const gpsLat = toSixDecimals(position[0]);
      const gpsLng = toSixDecimals(position[1]);

      // Files are not serializable — keep them outside Redux
      if (values.idDocument)              setRegFile('id_document',            values.idDocument);
      if (values.practicingLicenseDocument) setRegFile('practicing_license_doc', values.practicingLicenseDocument);

      // Save all text data to Redux — no API call yet.
      // The final step will send everything at once.
      dispatch(updateFormData({
        pharmacy_name_legal:    values.pharmacyName,
        trading_name:           values.tradingName,
        business_reg_no:        values.businessRegNo,
        kra_pin:                values.kraPin,
        ppb_license_no:         values.ppbLicenseNo,
        license_expiry:         values.ppbLicenseExpiry,
        county:                 'Nairobi',
        sub_county:             'Westlands',
        physical_address:       'To be mapped',
        gps_lat:                gpsLat,
        gps_lng:                gpsLng,
        business_phone:         values.businessPhone,
        business_email:         values.businessEmail,
        pharmacist_name:        values.superintendent,
        id_or_passport_no:      values.idOrPassportNumber,
        pharmacist_reg_no:      values.pharmacistRegistrationNo,
        practicing_license:     values.practicingLicenseNo,
        practicing_expiry:      values.practicingLicenseExpiry,
        pharmacist_phone:       values.personalPhone,
        pharmacist_email:       values.personalEmail,
      }));

      toast.success('Business information saved');
      dispatch(nextStep());
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="registration-page container-fluid py-5">
      <div className="row g-4 min-vh-100 d-flex justify-content-between">

        {/* LEFT SIDE */}
        <div className="col-lg-8">
        <Formik
          initialValues={{
            pharmacyName:              '',
            tradingName:               '',
            businessRegNo:             '',
            kraPin:                    '',
            ppbLicenseNo:              '',
            ppbLicenseExpiry:          '',
            businessPhone:             '',
            businessEmail:             '',
            superintendent:            '',
            idOrPassportNumber:        '',
            pharmacistRegistrationNo:  '',
            practicingLicenseNo:       '',
            practicingLicenseExpiry:   '',
            personalPhone:             '',
            personalEmail:             '',
            idDocument:                null,
            practicingLicenseDocument: null,
          }}
          validationSchema={BusinessInfoSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, setFieldValue, setFieldTouched, values, isSubmitting }) => (
            <Form className="card border-0 shadow-sm p-4 rounded-4" noValidate>

              {/* ===== STEP 1 ===== */}
              <section id="sector-1" className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center mb-4">
                  <RiHospitalLine className="text-primary fs-3 me-2" />
                  <div>
                    <h5 className="mb-0 fw-bold">Step 1: Business Information</h5>
                    <p className="text-muted small">Enter your official business and regulatory details</p>
                  </div>
                </div>

                <hr />

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Pharmacy Name</label>
                    <Field name="pharmacyName" className={fc('pharmacyName', errors, touched)}
                      placeholder="e.g. AfyaBridge Solutions Ltd" />
                    <FieldError name="pharmacyName" errors={errors} touched={touched} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Trading Name</label>
                    <Field name="tradingName" className={fc('tradingName', errors, touched)}
                      placeholder="Name on storefront" />
                    <FieldError name="tradingName" errors={errors} touched={touched} />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Business Reg No.</label>
                    <Field name="businessRegNo" className={fc('businessRegNo', errors, touched)}
                      placeholder="PVT-XXXXXX" />
                    <FieldError name="businessRegNo" errors={errors} touched={touched} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">KRA PIN</label>
                    <Field name="kraPin" className={fc('kraPin', errors, touched)}
                      placeholder="A00XXXXXXXXZ" />
                    <FieldError name="kraPin" errors={errors} touched={touched} />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">PPB License No.</label>
                    <Field name="ppbLicenseNo" className={fc('ppbLicenseNo', errors, touched)}
                      placeholder="PPB/2024/XXXX" />
                    <FieldError name="ppbLicenseNo" errors={errors} touched={touched} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">License Expiry</label>
                    <Field name="ppbLicenseExpiry" type="date"
                      className={fc('ppbLicenseExpiry', errors, touched)} />
                    <FieldError name="ppbLicenseExpiry" errors={errors} touched={touched} />
                  </div>
                </div>

                <LocationPicker position={position} setPosition={setPosition} />

                <div className="mt-4">
                  <h3 className="fs-6 text-muted">CONTACT DETAILS</h3>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Business Phone</label>
                      <Field name="businessPhone" className={fc('businessPhone', errors, touched)}
                        placeholder="e.g. 0700123456" />
                      <FieldError name="businessPhone" errors={errors} touched={touched} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Business Email</label>
                      <Field name="businessEmail" type="email"
                        className={fc('businessEmail', errors, touched)}
                        placeholder="e.g. info@mypharmacy.co.ke" />
                      <FieldError name="businessEmail" errors={errors} touched={touched} />
                    </div>
                  </div>
                </div>
              </section>

              {/* ===== STEP 2 ===== */}
              <section id="sector-2" className="d-flex flex-column gap-4 mt-5">
                <div className="d-flex align-items-center mb-4">
                  <RiUserStarLine className="text-primary fs-3 me-2" />
                  <div>
                    <h5 className="mb-0 fw-bold">Step 2: Superintendent Details</h5>
                    <p className="text-muted small">Information about the responsible pharmacist</p>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-bold">Pharmacist Name (as per ID)</label>
                    <Field name="superintendent" className={fc('superintendent', errors, touched)}
                      placeholder="Full legal name" />
                    <FieldError name="superintendent" errors={errors} touched={touched} />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">ID or Passport Number</label>
                    <Field name="idOrPassportNumber"
                      className={fc('idOrPassportNumber', errors, touched)}
                      placeholder="National ID / Passport No." />
                    <FieldError name="idOrPassportNumber" errors={errors} touched={touched} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Pharmacist Registration No.</label>
                    <Field name="pharmacistRegistrationNo"
                      className={fc('pharmacistRegistrationNo', errors, touched)}
                      placeholder="e.g. P/2024/12345" />
                    <FieldError name="pharmacistRegistrationNo" errors={errors} touched={touched} />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Practicing License No.</label>
                    <Field name="practicingLicenseNo"
                      className={fc('practicingLicenseNo', errors, touched)}
                      placeholder="e.g. P/2024/12345" />
                    <FieldError name="practicingLicenseNo" errors={errors} touched={touched} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">License Expiry</label>
                    <Field name="practicingLicenseExpiry" type="date"
                      className={fc('practicingLicenseExpiry', errors, touched)} />
                    <FieldError name="practicingLicenseExpiry" errors={errors} touched={touched} />
                  </div>
                </div>

                {/* DOCUMENT UPLOADS */}
                <div className="mt-4">
                  <h3 className="fs-6 text-muted">DOCUMENT UPLOADS</h3>

                  <div className="row g-3 mt-4">
                    {/* ID / Passport upload */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">ID / Passport</label>
                      <div
                        className={`upload-box${touched.idDocument && errors.idDocument ? ' border-danger' : touched.idDocument && values.idDocument ? ' border-success' : ''}`}
                        onClick={() => idInputRef.current.click()}
                      >
                        <input
                          ref={idInputRef}
                          type="file"
                          hidden
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            setFieldValue('idDocument', e.currentTarget.files[0]);
                            setFieldTouched('idDocument', true, false);
                          }}
                        />
                        <div className="upload-content">
                          <i className="ri-file-text-line upload-icon"></i>
                          <p className="mb-1 fw-semibold w-100 text-overflow-ellipsis">
                            {values.idDocument ? values.idDocument.name : 'Upload ID/Passport'}
                          </p>
                          <small className="text-muted">PDF, JPG or PNG (Max 5MB)</small>
                        </div>
                      </div>
                      <FieldError name="idDocument" errors={errors} touched={touched} />
                    </div>

                    {/* Practicing License upload */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Practicing License</label>
                      <div
                        className={`upload-box${touched.practicingLicenseDocument && errors.practicingLicenseDocument ? ' border-danger' : touched.practicingLicenseDocument && values.practicingLicenseDocument ? ' border-success' : ''}`}
                        onClick={() => licenseInputRef.current.click()}
                      >
                        <input
                          ref={licenseInputRef}
                          type="file"
                          hidden
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            setFieldValue('practicingLicenseDocument', e.currentTarget.files[0]);
                            setFieldTouched('practicingLicenseDocument', true, false);
                          }}
                        />
                        <div className="upload-content">
                          <i className="ri-id-card-line upload-icon"></i>
                          <p className="mb-1 fw-semibold w-100 text-overflow-ellipsis">
                            {values.practicingLicenseDocument
                              ? values.practicingLicenseDocument.name
                              : 'Upload Practicing License'}
                          </p>
                          <small className="text-muted">PDF, JPG or PNG (Max 5MB)</small>
                        </div>
                      </div>
                      <FieldError name="practicingLicenseDocument" errors={errors} touched={touched} />
                    </div>
                  </div>

                  <div className="row g-3 mt-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Personal Phone</label>
                      <Field name="personalPhone" className={fc('personalPhone', errors, touched)}
                        placeholder="e.g. 0700123456" />
                      <FieldError name="personalPhone" errors={errors} touched={touched} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Personal Email</label>
                      <Field name="personalEmail" type="email"
                        className={fc('personalEmail', errors, touched)}
                        placeholder="pharmacist@example.com" />
                      <FieldError name="personalEmail" errors={errors} touched={touched} />
                    </div>
                  </div>
                </div>
              </section>

              {/* ACTIONS */}
              <div className="d-flex justify-content-between mt-5">
                <Link to="/auth/login">Back to Login</Link>
                <button
                  type="submit"
                  className="btn btn-primary px-5 rounded-pill"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Processing…</>
                    : 'Next Step'
                  }
                </button>
              </div>

            </Form>
          )}
        </Formik>
      </div>

      {/* RIGHT INFO PANEL */}
      <div className="col-lg-4">
        <div className="card bg-primary text-white border-0 p-4 rounded-4 mb-3">
          <h5 className="fw-bold">Why register?</h5>
          <ul className="list-unstyled mt-3 small">
            <li><RiCheckLine /> Real-time inventory sync</li>
            <li><RiCheckLine /> Automated license renewals</li>
            <li><RiCheckLine /> Priority support access</li>
          </ul>
        </div>

        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
          <h6 className="fw-bold mb-3">Pharmacy Location</h6>
          <p className="small text-muted">
            Your GPS location will help patients find the nearest branch.
          </p>
        </div>
      </div>

    </div>
  </div>
    
  );
};

export default BusinessInfo;
