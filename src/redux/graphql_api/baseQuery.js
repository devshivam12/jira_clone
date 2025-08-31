// api/baseQueryWithReauth.js
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiAuth } from '../api/authApi';
// import { apiAuth } from './authApi';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.GRAPHQL_SERVER,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('accessToken');
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (token && userData) {
      headers.set('Authorization', token);
      headers.set('x-clientId', userData.clientId);
    }
    return headers;
  }
});

export const baseQueryWithReauthGraphQl = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error?.status === 401) {
    // Attempt to call logout endpoint before clearing local storage
    try {
      await api.dispatch(
        apiAuth.endpoints.logout.initiate()
      ).unwrap();
    } catch (error) {
      console.log('Logout API call failed', error);
    }
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
    
    // Return error with redirect info
    return {
      error: {
        status: 401,
        data: { message: 'Session expired', redirect: '/login' }
      }
    };
  }
  
  return result;
};