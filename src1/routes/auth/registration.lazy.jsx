import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import BusinessInfo from '../../components/registration/businessInfo'
import ComplianceAndFinance from '../../components/registration/complianceDocs'
import SecurityAndLegal from '../../components/registration/securityAndLegal'
import { useSelector } from 'react-redux'

export const Route = createLazyFileRoute('/auth/registration')({
  component: RouteComponent,
})

function RouteComponent() {
  useEffect(() => {
    localStorage.removeItem('access_token')
  }, [])
  
  const { currentStep } = useSelector((state) => state.registration);
  
  return (
    <div className="vw-100 bg-light d-flex align-items-center justify-content-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            {currentStep === 1 && <BusinessInfo />}
            {currentStep === 2 && <ComplianceAndFinance />}
            {currentStep === 3 && <SecurityAndLegal />}
          </div>
        </div>
      </div>
    </div>
  );
}