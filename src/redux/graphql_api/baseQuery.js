// api/baseQueryWithReauth.js
import { fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import { apiAuth } from '../api/authApi';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_GRAPHQL_SERVER,
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
    headers.set('Content-Type', 'application/json')
    return headers;
  },
});

const baseQueryWithRetries = retry(baseQuery, { maxRetries: 2 });

export const baseQueryWithReauthGraphQl = async (args, api, extraOptions) => {
  console.log("args", args)
  console.log("api", api)
  console.log("extraOptions", extraOptions)
  const modifiedArgs = {
    ...args,
    method: 'POST',
  };
  let result = await baseQueryWithRetries(modifiedArgs, api, extraOptions);
  console.log("graphql result", result)
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
