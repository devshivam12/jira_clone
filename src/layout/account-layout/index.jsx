import Navbar from '@/components/Navbar'
import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import AccountNavbar from './AccountNavbar'

const AccountLayout = () => {
  return (
    <div>
      {/* Fixed path names */}
      <AccountNavbar />
      {/* <NavLink to='profile-and-visibility' activeClassName="active">Profile & Visibility</NavLink>
      <NavLink to='email' activeClassName="active">Email</NavLink>
      <NavLink to='security' activeClassName="active">Security</NavLink> */}

      {/* Renders the selected tab */}
      <Outlet />
    </div>
  )
}

export default AccountLayout
