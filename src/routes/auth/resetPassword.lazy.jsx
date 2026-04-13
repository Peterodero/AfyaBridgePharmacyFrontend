import { createLazyFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useSearch } from '@tanstack/react-router';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useState } from 'react';
import { RiLockLine, RiEyeLine, RiEyeOffLine, RiCheckLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import api from '../../api/client';

export const Route = createLazyFileRoute('/auth/resetPassword')({
  component: RouteComponent,
})

function RouteComponent() {
  const searchParams = useSearch({ from: '/auth/reset-password' });
  const navigate = useNavigate();
  const token = searchParams?.token || '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const resetSchema = Yup.object().shape({
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Please confirm your password'),
  });

  const resetMutation = useMutation({
    mutationFn: (data) => api.post('/auth/reset-password/', { token, ...data }),
    onSuccess: () => {
      toast.success("Password reset successfully! You can now login.");
      navigate({ to: '/auth/login' });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to reset password")
  });

  if (!token) {
    return (
      <div className="vh-100 vw-100 bg-light d-flex flex-column">
        <nav className="navbar navbar-light bg-white px-4 border-bottom">
          <img src="/logo.svg" alt="AfyaBridge" height="30" />
        </nav>
        <div className="flex-grow-1 d-flex align-items-center justify-content-center px-3">
          <div className="card border-0 shadow-sm p-4 text-center" style={{ maxWidth: "450px", width: "100%", borderRadius: "12px" }}>
            <h4 className="fw-bold mb-3">Invalid Reset Link</h4>
            <p className="text-muted">This password reset link is invalid or has expired.</p>
            <Link to="/auth/forgotPassword" className="btn btn-primary mt-2">Request New Link</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vh-100 vw-100 bg-light d-flex flex-column">
      <nav className="navbar navbar-light bg-white px-4 border-bottom">
        <img src="/logo.svg" alt="AfyaBridge" height="30" />
        <span className="text-muted small d-none d-md-block">Bridging Healthcare Access Across Kenya</span>
        <Link to="/auth/login" className="btn btn-primary btn-sm px-4">Login</Link>
      </nav>

      <div className="flex-grow-1 d-flex align-items-center justify-content-center px-3">
        <div className="card border-0 shadow-sm p-4" style={{ maxWidth: "450px", width: "100%", borderRadius: "12px" }}>
          
          <div className="text-center mb-4">
            <div className="bg-primary-subtle rounded-circle d-inline-flex p-3 mb-3">
               <RiLockLine className="text-primary fs-3" />
            </div>
            <h2 className="fw-bold h4">Reset Password</h2>
            <p className="text-muted small">Enter your new password below.</p>
          </div>

          <Formik
            initialValues={{ password: '', confirmPassword: '' }}
            validationSchema={resetSchema}
            onSubmit={(values) => {
              resetMutation.mutate({ password: values.password });
            }}
          >
            {({ errors, touched, values }) => (
              <Form>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">New Password</label>
                  <div className={`input-group border rounded-3 p-1 ${errors.password && touched.password ? `border-danger` : ``}`}>
                    <Field 
                      name="password" 
                      type={showPassword ? 'text' : 'password'}
                      className="form-control border-0 shadow-none" 
                      placeholder="Enter new password"
                    />
                    <button type="button" className="input-group-text bg-transparent border-0" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <RiEyeOffLine className="text-muted" /> : <RiEyeLine className="text-muted" />}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <div className="text-danger x-small mt-1">{errors.password}</div>
                  )}
                  {values.password && (
                    <div className="mt-2">
                      <div className="d-flex gap-1">
                        {values.password.length >= 8 && <RiCheckLine className="text-success" size={14} />}
                        <span className={`small ${values.password.length >= 8 ? `text-success` : `text-muted`}`}>8+ characters</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-secondary">Confirm Password</label>
                  <div className={`input-group border rounded-3 p-1 ${errors.confirmPassword && touched.confirmPassword ? `border-danger` : ``}`}>
                    <Field 
                      name="confirmPassword" 
                      type={showConfirm ? 'text' : 'password'}
                      className="form-control border-0 shadow-none" 
                      placeholder="Confirm new password"
                    />
                    <button type="button" className="input-group-text bg-transparent border-0" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <RiEyeOffLine className="text-muted" /> : <RiEyeLine className="text-muted" />}
                    </button>
                  </div>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <div className="text-danger x-small mt-1">{errors.confirmPassword}</div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2 fw-bold mb-3"
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </button>

                <div className="text-center">
                  <Link to="/auth/login" className="text-decoration-none small fw-bold text-secondary">
                    Back to Login
                  </Link>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      <footer className="py-4 text-center">
        <div className="text-muted x-small">© 2026 AfyaBridge Kenya. All rights reserved.</div>
      </footer>
    </div>
  );
}
