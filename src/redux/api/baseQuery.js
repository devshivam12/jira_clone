// api/baseQueryWithReauth.js
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiAuth } from './authApi';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_SERVER,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const state = getState();
    const userData = state.auth?.userData;   // from your auth slice
    const currentProject = state.projectSlice?.currentProject; // from your project slice
    
    const token = userData?.token;
    if (token && userData) {
      headers.set('Authorization', token);
      headers.set('x-clientId', userData.clientId);
      if (currentProject?.project_key) {
        headers.set('x-projectKey', currentProject.project_key);
      }
    }
    return headers;
  },
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    try {
      await api.dispatch(apiAuth.endpoints.logout.initiate()).unwrap();
    } catch (error) {
      console.log('Logout API call failed', error);
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');

    return {
      error: {
        status: 401,
        data: { message: 'Session expired', redirect: '/login' },
      },
    };
  }

  return result;
};
