import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useDispatch } from 'react-redux';
import { userExist } from '@/redux/reducers/auth';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { setLastAccessedProject } from '@/redux/reducers/dynamicRouting';
// import apiService from '@/api/apiService';

const AutoLogin = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const dispatch = useDispatch();

    useEffect(() => {
        const token = searchParams.get('token');

        const handleTokenAuth = async () => {
            try {
                // 1. Validate token with backend
                const response = await axios.post(`${import.meta.env.VITE_SERVER}/user/auth/token-base-auth`, { token });
                console.log("responselogin", response)
                // 2. Store token and user data
                if (response.status === 200) {
                    localStorage.setItem('accessToken', response.data.user.token);
                    localStorage.setItem('userData', JSON.stringify(response.data.user))
                    dispatch(userExist(response.data.user));

                    dispatch(setLastAccessedProject({
                        project_slug : response.data.user.project_slug,
                        template_slug :response.data.user.template_slug 
                    }))

                    // 3. Redirect to dashboard
                    navigate(`/dashboard/${response.data.user.project_slug}/${response.data.user.template_slug}/backlog`);

                    toast({
                        title: "Login Successful",
                        variant: "success",
                    });
                }
            } catch (error) {
                navigate('/login');
                toast({
                    title: "Invalid Token",
                    description: "Please log in again",
                    variant: "destructive",
                });
            }
        };

        if (token) handleTokenAuth();
        else navigate('/login');
    }, [dispatch, navigate, searchParams]);

    return <div className="flex items-center justify-center h-screen">
        <Loader2 size={24} className="animate-spin text-blue-400"
        />
    </div>;
};

export default AutoLogin;