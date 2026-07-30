import React, { useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Home } from 'lucide-react'
import AccountNavbar from './AccountNavbar'
import AppBreadcrumb from '@/components/common/AppBreadcrumb'

// Readable labels for the account sub-pages, keyed by their url segment.
const ACCOUNT_LABELS = {
  'profile-and-visibility': 'Profile and visibility',
  email: 'Email',
  security: 'Security',
}

const AccountLayout = () => {
  const location = useLocation()

  const breadcrumbItems = useMemo(() => {
    // URL shape: /manage-account/:sub
    const segments = location.pathname.split('/').filter(Boolean)
    const sub = segments[1]

    const trail = [
      { key: 'account', label: 'Account', to: '/manage-account', icon: Home },
    ]
    if (sub && ACCOUNT_LABELS[sub]) {
      trail.push({ key: 'sub', label: ACCOUNT_LABELS[sub] })
    }
    return trail
  }, [location.pathname])

  return (
    <div>
      <AppBreadcrumb items={breadcrumbItems} />
      {/* Fixed path names */}
      <AccountNavbar />

      {/* Renders the selected tab */}
      <Outlet />
    </div>
  )
}

export default AccountLayout
