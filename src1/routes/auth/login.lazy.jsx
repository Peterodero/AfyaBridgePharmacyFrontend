import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { RiLockPasswordLine, RiUserLine, RiEyeLine } from 'react-icons/ri';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'react-toastify';

import { setCredentials } from '../../redux/slices/authSlice';
import api from '../../api/client';

export const Route = createLazyFileRoute('/auth/login')({
  component: RouteComponent,
});

function RouteComponent() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loginSchema = Yup.object().shape({
    email: Yup.string()
      .email('Enter a valid email')
      .required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
  });

  const loginMutation = useMutation({
    mutationFn: (values) => api.post('/auth/login/', values),
    onSuccess: (res) => {
      const { access_token, refresh_token, user } = res.data.data || res.data;
      console.log('Login successful, received tokens:', { access_token, refresh_token });
      dispatch(setCredentials({ user, token: access_token, refreshToken: refresh_token }));
      toast.success('Login successful!');
      navigate({ to: '/dashboard' });
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      const detailedError = errors
        ? Object.values(errors).flat().filter(Boolean).join(', ')
        : null;

      const msg =
        detailedError ||
        err.response?.data?.message ||
        'Login failed. Please check your credentials.';

      toast.error(msg);
    },
  });

  return (
    <div className="container-fluid vh-100 vw-100 p-0">
      <div className="row g-0 h-100">
        {/* Left Side - Branding */}
        <div
          className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #1e4db7 0%, #00a884 100%)' }}
        >
          <div>
            <h1 className="display-4 fw-semibold mt-5">
              Bridging Healthcare Access Across Kenya
            </h1>
            <p className="lead opacity-75">
              Empowering pharmacists with modern tools to manage inventory, 
              track prescriptions, and provide better patient care.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white">
          <div style={{ maxWidth: '500px', width: '100%' }} className="p-4">
            <h2 className="fw-bold">Welcome Back, Pharmacist</h2>
            <p className="text-muted mb-4">
              Enter your credentials to manage your inventory and prescriptions.
            </p>

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={loginSchema}
              onSubmit={(values) => loginMutation.mutate(values)}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Email Address</label>
                    <div className={`input-group border rounded-3 p-1 ${errors.email && touched.email ? 'border-danger' : ''}`}>
                      <span className="input-group-text bg-transparent border-0">
                        <RiUserLine />
                      </span>
                      <Field
                        name="email"
                        type="email"
                        className="form-control border-0 shadow-none"
                        placeholder="pharmacist@afyabridge.com"
                      />
                    </div>
                    {errors.email && touched.email && (
                      <div className="text-danger small mt-1">{errors.email}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <label className="form-label small fw-bold">Password</label>
                      <Link to="/auth/forgotPassword" className="small text-decoration-none">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className={`input-group border rounded-3 p-1 ${errors.password && touched.password ? 'border-danger' : ''}`}>
                      <span className="input-group-text bg-transparent border-0">
                        <RiLockPasswordLine />
                      </span>
                      <Field
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        className="form-control border-0 shadow-none"
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="input-group-text bg-transparent border-0"
                        style={{ cursor: 'pointer' }}
                      >
                        <RiEyeLine />
                      </span>
                    </div>
                    {errors.password && touched.password && (
                      <div className="text-danger small mt-1">{errors.password}</div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-3 rounded-3 fw-bold shadow"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? 'Authenticating…' : 'Login to Dashboard →'}
                  </button>

                  <div className="mt-3 text-center">
                    <p className="small text-muted">
                      New to AfyaBridge?{' '}
                      <Link to="/auth/registration" className="text-decoration-none">
                        Register here
                      </Link>
                    </p>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}