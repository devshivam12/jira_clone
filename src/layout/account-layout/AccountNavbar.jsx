import UserButton from '@/components/auth/UserButton';
import { Link, NavLink } from 'react-router-dom';
import Logo from '../../assets/logo.svg'
const navbarContent = [
    {
        name: 'Profile and visibility',
        to: '/manage-account/profile-and-visibility'
    },
    { name: 'Email', to: '/manage-account/email' },
    { name: 'Security', to: '/manage-account/security' },
]

const AccountNavbar = () => {
    return (
        <nav className="border-b border-gray-300 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">

                    <div className='flex items-center space-x-6 overflow-x-auto text-sm font-medium'>
                        <div className='mr-4'>
                            <Link href="/">
                                <img src={Logo} alt="" className='w-[164px] h-[48px]' />
                            </Link>
                        </div>
                        <div className='flex items-center overflow-x-auto text-sm font-medium'>
                            {navbarContent.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `px-3 py-5 whitespace-nowrap hover:text-blue-600 ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
                                        }`
                                    }
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    <UserButton />
                </div>
            </div>
        </nav>
    );
};

export default AccountNavbar;
