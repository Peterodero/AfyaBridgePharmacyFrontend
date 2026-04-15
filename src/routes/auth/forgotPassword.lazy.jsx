import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
  RiUserLine,
  RiArrowLeftLine,
  RiMailSendLine,
  RiCheckLine,
} from "react-icons/ri";
import { toast } from "react-toastify";
import authApi from "../../api/authClient"; // ← Import from authClient
import { useState } from "react";

export const Route = createLazyFileRoute("/auth/forgotPassword")({
  component: ForgotPasswordPage,
});

// Step indicator component
const StepIndicator = ({ currentStep, steps }) => {
  return (
    <div className="d-flex justify-content-between mb-4">
      {steps.map((step, index) => (
        <div key={index} className="text-center grow">
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 ${
              currentStep >= index + 1
                ? "bg-primary text-white"
                : "bg-light text-muted"
            }`}
            style={{ width: "35px", height: "35px", fontSize: "14px" }}
          >
            {currentStep > index + 1 ? <RiCheckLine /> : index + 1}
          </div>
          <small
            className={`${currentStep >= index + 1 ? "text-primary fw-bold" : "text-muted"}`}
          >
            {step}
          </small>
        </div>
      ))}
    </div>
  );
};

// Step 1: Send OTP Form Component
const SendOtpForm = ({ onSubmit, isLoading }) => {
  const emailSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

  return (
    <Formik
      initialValues={{ email: "" }}
      validationSchema={emailSchema}
      onSubmit={onSubmit}
    >
      {({ errors, touched }) => (
        <Form>
          <div className="mb-4">
            <label className="form-label small fw-bold text-secondary">
              Email Address
            </label>
            <div
              className={`input-group border rounded-3 p-1 ${errors.email && touched.email ? "border-danger" : ""}`}
            >
              <span className="input-group-text bg-transparent border-0">
                <RiUserLine className="text-muted" />
              </span>
              <Field
                name="email"
                type="email"
                className="form-control border-0 shadow-none"
                placeholder="e.g. name@example.com"
              />
            </div>
            {errors.email && touched.email && (
              <div className="text-danger small mt-1">{errors.email}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-bold mb-3"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </button>
        </Form>
      )}
    </Formik>
  );
};

// Step 2: Verify OTP Form Component
const VerifyOtpForm = ({
  email,
  onSubmit,
  onResend,
  isLoading,
  isResending,
}) => {
  const otpSchema = Yup.object().shape({
    otp_code: Yup.string()
      .required("OTP is required")
      .matches(/^\d{6}$/, "OTP must be 6 digits"),
  });

  return (
    <Formik
      initialValues={{ otp_code: "" }}
      validationSchema={otpSchema}
      onSubmit={onSubmit}
    >
      {({ errors, touched }) => (
        <Form>
          <div className="mb-4">
            <label className="form-label small fw-bold text-secondary">
              Enter OTP Code
            </label>
            <p className="text-muted small mb-2">
              We've sent a 6-digit OTP to the phone number linked to {email}
            </p>
            <div
              className={`border rounded-3 p-1 ${errors.otp_code && touched.otp_code ? "border-danger" : ""}`}
            >
              <Field
                name="otp_code"
                type="text"
                className="form-control border-0 shadow-none text-center"
                placeholder="000000"
                style={{ fontSize: "24px", letterSpacing: "8px" }}
                maxLength="6"
              />
            </div>
            {errors.otp_code && touched.otp_code && (
              <div className="text-danger small mt-1">{errors.otp_code}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-bold mb-3"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="text-center">
            <button
              type="button"
              className="btn btn-link text-decoration-none small"
              onClick={onResend}
              disabled={isResending}
            >
              {isResending ? "Resending..." : "Resend OTP"}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

// Step 3: Reset Password Form Component
const ResetPasswordForm = ({ onSubmit, isLoading }) => {
  const passwordSchema = Yup.object().shape({
    newPassword: Yup.string()
      .required("New password is required")
      .min(8, "Password must be at least 8 characters")
      .max(15, "Password must not exceed 15 characters")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/\d/, "Password must contain at least one number"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Please confirm your password"),
  });

  return (
    <Formik
      initialValues={{ newPassword: "", confirmPassword: "" }}
      validationSchema={passwordSchema}
      onSubmit={onSubmit}
    >
      {({ errors, touched }) => (
        <Form>
          <div className="mb-3">
            <label className="form-label small fw-bold text-secondary">
              New Password
            </label>
            <div className="border rounded-3 p-1">
              <Field
                name="newPassword"
                type="password"
                className="form-control border-0 shadow-none"
                placeholder="Enter new password"
              />
            </div>
            {errors.newPassword && touched.newPassword && (
              <div className="text-danger small mt-1">{errors.newPassword}</div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label small fw-bold text-secondary">
              Confirm Password
            </label>
            <div className="border rounded-3 p-1">
              <Field
                name="confirmPassword"
                type="password"
                className="form-control border-0 shadow-none"
                placeholder="Confirm new password"
              />
            </div>
            {errors.confirmPassword && touched.confirmPassword && (
              <div className="text-danger small mt-1">
                {errors.confirmPassword}
              </div>
            )}
          </div>

          <div className="mb-3 p-3 bg-light rounded-3">
            <small className="text-muted">Password requirements:</small>
            <ul className="small text-muted mb-0 mt-1">
              <li>At least 8 characters</li>
              <li>At most 15 characters</li>
              <li>At least one uppercase letter (A-Z)</li>
              <li>At least one lowercase letter (a-z)</li>
              <li>At least one number (0-9)</li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-bold mb-3"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </Form>
      )}
    </Formik>
  );
};

// Main Page Component
function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  // Step 1: Send OTP
  const sendOtpMutation = useMutation({
    mutationFn: (email) => authApi.post("/admin/auth/send-otp", { email }),
    onSuccess: (response) => {
      toast.success(
        response.data.message || "OTP sent to your registered phone number!",
      );
      setStep(2);
    },
    onError: (err) => {
      const message = err?.response?.data?.error || "Failed to send OTP";
      toast.error(message);
    },
  });

  // Step 2: Verify OTP
  const verifyOtpMutation = useMutation({
    mutationFn: ({ email, otp_code }) =>
      authApi.post("/admin/auth/verify-otp", { email, otp_code }),
    onSuccess: (response) => {
      toast.success("OTP verified successfully!");
      setResetToken(response.data.resetToken);
      setStep(3);
    },
    onError: (err) => {
      const message = err?.response?.data?.error || "Invalid or expired OTP";
      toast.error(message);
    },
  });

  // Resend OTP
  const resendOtpMutation = useMutation({
    mutationFn: (email) => authApi.post("/admin/auth/send-otp", { email }),
    onSuccess: (response) => {
      toast.success(response.data.message || "OTP resent successfully!");
    },
    onError: (err) => {
      const message = err?.response?.data?.error || "Failed to resend OTP";
      toast.error(message);
    },
  });

  // Step 3: Reset Password
  const resetPasswordMutation = useMutation({
    mutationFn: ({ resetToken, newPassword }) =>
      authApi.post("/admin/auth/reset-password", { resetToken, newPassword }),
    onSuccess: () => {
      toast.success(
        "Password reset successfully! Please login with your new password.",
      );
      navigate({ to: "/auth/login" });
    },
    onError: (err) => {
      const message = err?.response?.data?.error || "Failed to reset password";
      toast.error(message);
    },
  });

  const handleSendOtp = (values) => {
    setUserEmail(values.email);
    sendOtpMutation.mutate(values.email);
  };

  const handleVerifyOtp = (values) => {
    verifyOtpMutation.mutate({ email: userEmail, otp_code: values.otp_code });
  };

  const handleResendOtp = () => {
    resendOtpMutation.mutate(userEmail);
  };

  const handleResetPassword = (values) => {
    resetPasswordMutation.mutate({
      resetToken,
      newPassword: values.newPassword,
    });
  };

  return (
    <div className="vh-100 vw-100 bg-light d-flex flex-column">
      <nav className="navbar navbar-light bg-white px-4 border-bottom">
        <img src="/logo.svg" alt="AfyaBridge" height="30" />
        <span className="text-muted small d-none d-md-block">
          Bridging Healthcare Access Across Kenya
        </span>
        <Link to="/auth/login" className="btn btn-primary btn-sm px-4">
          Login
        </Link>
      </nav>

      <div className="grow d-flex align-items-center justify-content-center px-3">
        <div
          className="card border-0 shadow-sm p-4"
          style={{ maxWidth: "450px", width: "100%", borderRadius: "12px" }}
        >
          <div className="text-center mb-4">
            <div className="bg-primary-subtle rounded-circle d-inline-flex p-3 mb-3">
              {step === 1 && <RiUserLine className="text-primary fs-3" />}
              {step === 2 && <RiMailSendLine className="text-primary fs-3" />}
              {step === 3 && <RiCheckLine className="text-primary fs-3" />}
            </div>
            <h2 className="fw-bold h4">
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Verify OTP"}
              {step === 3 && "Create New Password"}
            </h2>
            <p className="text-muted small">
              {step === 1 &&
                "Enter your email address and we'll send an OTP to your phone."}
              {step === 2 && "Enter the 6-digit code sent to your phone."}
              {step === 3 && "Create a new strong password for your account."}
            </p>
          </div>

          <StepIndicator currentStep={step} steps={["Email", "OTP", "Reset"]} />

          {step === 1 && (
            <SendOtpForm
              onSubmit={handleSendOtp}
              isLoading={sendOtpMutation.isPending}
            />
          )}

          {step === 2 && (
            <VerifyOtpForm
              email={userEmail}
              onSubmit={handleVerifyOtp}
              onResend={handleResendOtp}
              isLoading={verifyOtpMutation.isPending}
              isResending={resendOtpMutation.isPending}
            />
          )}

          {step === 3 && (
            <ResetPasswordForm
              onSubmit={handleResetPassword}
              isLoading={resetPasswordMutation.isPending}
            />
          )}

          <div className="text-center mt-3">
            <Link
              to="/auth/login"
              className="text-decoration-none small fw-bold text-blue-400 d-inline-flex align-items-center"
            >
              <RiArrowLeftLine className="me-1" /> Back to Login
            </Link>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center">
        <p className="text-muted small">
          Need help?
          <a
            href="mailto:peterodero450@gmail.com"
            className="text-primary text-decoration-none"
          >
            Contact Support
          </a>
        </p>
        <div className="text-muted small mt-2">
          © 2026 AfyaBridge Kenya. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
