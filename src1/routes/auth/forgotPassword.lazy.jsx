import { createLazyFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { RiUserLine, RiArrowLeftLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import api from '../../api/client';

export const Route = createLazyFileRoute('/auth/forgotPassword')({
  component: RouteComponent,
})

function RouteComponent() {
  const forgotSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Please enter your email'),
  });

  const resetMutation = useMutation({
    mutationFn: (data) => api.post('/auth/forgot-password/', data),
    onSuccess: () => {
      toast.success("Reset link sent! Check your email for the reset link.");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to send reset link")
  });

  return (
    <div className="vh-100 vw-100 bg-light d-flex flex-column">
      <nav className="navbar navbar-light bg-white px-4 border-bottom">
        <img src="/logo.svg" alt="AfyaBridge" height="30" />
        <span className="text-muted small d-none d-md-block">Bridging Healthcare Access Across Kenya</span>
        <Link to="/auth/login" className="btn btn-primary btn-sm px-4">Login</Link>
      </nav>

      <div className="flex-grow-1 d-flex align-items-center justify-content-center px-3">
        <div className="card border-0 shadow-sm p-4" style={{ maxWidth: '450px', width: '100%', borderRadius: '12px' }}>
          
          <div className="text-center mb-4">
            <div className="bg-primary-subtle rounded-circle d-inline-flex p-3 mb-3">
               <RiUserLine className="text-primary fs-3" />
            </div>
            <h2 className="fw-bold h4">Forgot Password?</h2>
            <p className="text-muted small">Enter your email address and we'll send you a link to reset your password.</p>
          </div>

          <Formik
            initialValues={{ email: '' }}
            validationSchema={forgotSchema}
            onSubmit={(values) => resetMutation.mutate(values)}
          >
            {({ errors, touched }) => (
              <Form>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-secondary">Email Address</label>
                  <div className={`input-group border rounded-3 p-1 ${errors.email && touched.email ? 'border-danger' : ''}`}>
                    <span className="input-group-text bg-transparent border-0"><RiUserLine className="text-muted" /></span>
                    <Field 
                      name="email" 
                      type="email"
                      className="form-control border-0 shadow-none" 
                      placeholder="e.g. name@pharmacy.com" 
                    />
                  </div>
                  {errors.email && touched.email && (
                    <div className="text-danger x-small mt-1">{errors.email}</div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2 fw-bold mb-3"
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? 'Sending...' : 'Send Reset Link'}
                </button>

                <div className="text-center">
                  <Link to="/auth/login" className="text-decoration-none small fw-bold text-secondary d-inline-flex align-items-center">
                    <RiArrowLeftLine className="me-1" /> Back to Login
                  </Link>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      <footer className="py-4 text-center">
        <p className="text-muted x-small">Need help? <a href="#" className="text-primary text-decoration-none">Contact Support</a></p>
        <div className="text-muted x-small mt-2">© 2026 AfyaBridge Kenya. All rights reserved.</div>
      </footer>
    </div>
  );
}
