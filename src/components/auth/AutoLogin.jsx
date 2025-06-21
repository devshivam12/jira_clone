import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { useDispatch } from 'react-redux';
import { userExist, setClientId } from '@/redux/reducers/auth';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { setLastAccessedProject } from '@/redux/reducers/dynamicRouting';
import { toast } from 'sonner';
import ShowToast from '../common/ShowToast';
import { useGetAllCompanyProjectQuery } from '@/redux/api/company/api';
import { setAllProjects, setCurrentProject } from '@/redux/reducers/projectSlice';
// import apiService from '@/api/apiService';

const AutoLogin = () => {
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [shouldNavigate, setShouldNavigate] = useState(false)
    const token = searchParams.get('token')
    const clientId = searchParams.get('clientId')
    // const { data: project } = useGetAllCompanyProjectQuery({
    //     skip: !shouldNavigate
    // })

    // useEffect(async () => {

    //     const getProjectDetails = await axios.get(`${import.meta.env.VITE_SERVER}/company/work-space/get-companyProject`,
    //         {
    //             headers: {
    //                 'Authorization': token,
    //                 'x-clientId': clientId
    //             },
    //             withCredentials: true
    //         },
    //     )
    //     console.log("getProjectDetails", getProjectDetails)

    //     if (getProjectDetails.status === 200 && shouldNavigate)
    //         console.log("this is working")
    //     console.log("project------------", project)
    //     dispatch(setAllProjects(getProjectDetails.data))

    //     dispatch(setCurrentProject(getProjectDetails.data[0]))

    //     const defaultTab = getProjectDetails.data[0].template.fields.tabs.find(tab => tab.isDefault === true)

    //     const defaultRouting = defaultTab ? defaultTab.url : 'backlog'

    //     navigate(`/dashboard/${getProjectDetails.data[0].project_slug}/${getProjectDetails.data[0].template.slug}/${defaultRouting}`)

    //     setShouldNavigate(false) // Reset flag
    // }, [project, navigate, shouldNavigate, dispatch])

    useEffect(() => {

        const handleTokenAuth = async () => {
            try {

                const authResponse = await axios.post(`${import.meta.env.VITE_SERVER}/user/auth/token-base-auth`, { token });
                console.log("authResponse", authResponse)

                if (authResponse.data.status === 200) {
                    const { project_details, ...userData } = authResponse.data.user;
                    localStorage.setItem('accessToken', authResponse.data.user.token);
                    localStorage.setItem('userData', JSON.stringify(userData))
                    localStorage.setItem('projectDetails', JSON.stringify(project_details))
                    dispatch(userExist(authResponse.data.user));
                    dispatch(setClientId(authResponse.data.user.clientId));

                    // if (response.data.user.project_id.length > 0) {
                    //     console.log("is it working")
                    //     const userProjectId = response.user.project_id[0]

                    //     setShouldNavigate(true)
                    // }

                    // ShowToast.success('You are authorized', {
                    //     description: response.message
                    // })
                    console.log("authResponse.data.user.clientId", authResponse.data.user.clientId)
                    // Step 2: Fetch company projects
                    const projectsResponse = await axios.get(
                        `${import.meta.env.VITE_SERVER}/company/work-space/get-companyProject`,
                        {
                            headers: {
                                'Authorization': authResponse.data.user.token,
                                'x-clientId': authResponse.data.user.clientId
                            },
                            withCredentials: true
                        }
                    );

                    if (projectsResponse.status === 200 && projectsResponse.data?.data?.length > 0) {
                        const projects = projectsResponse.data.data;

                        // Update Redux with projects
                        dispatch(setAllProjects(projects));
                        dispatch(setCurrentProject(projects[0]));

                        // Navigate to default project
                        const defaultTab = projects[0].template.fields.tabs.find(tab => tab.isDefault);
                        const defaultRouting = defaultTab ? defaultTab.url : 'backlog';

                        navigate(`/dashboard/${projects[0].project_slug}/${projects[0].template.slug}/${defaultRouting}`);
                        
                    } else {
                        navigate('/dashboard'); // Fallback if no projects
                        ShowToast.info('No projects found');
                    }

                    ShowToast.success('Congratulations you are successfully register', {
                        description: authResponse.data.message
                    })
                }
            } catch (error) {
                console.log("error", error)
                navigate('/login');
                ShowToast.error('Authentication failed', {
                    description: error.message
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