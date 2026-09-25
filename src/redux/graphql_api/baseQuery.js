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

// Retry is wired up but switched off by default. It used to run with
// maxRetries: 2 for every endpoint, so a single failing page fired three
// requests per query with backoff in between - on a slow or unreachable
// backend that tripled the load for no benefit, because a 400 or a 401 is
// never going to succeed on the second try.
//
// An endpoint that genuinely benefits from a retry can still opt in without
// touching this file, by passing it through extraOptions:
//
//   getSomething: builder.query({
//     query: () => ({ ... }),
//     extraOptions: { maxRetries: 2 },
//   })
const baseQueryWithRetries = retry(baseQuery, { maxRetries: 0 });

export const baseQueryWithReauthGraphQl = async (args, api, extraOptions) => {
  const modifiedArgs = {
    ...args,
    method: 'POST',
  };
  let result = await baseQueryWithRetries(modifiedArgs, api, extraOptions);
  if (result.error?.status === 401) {
    try {
      await api.dispatch(apiAuth.endpoints.logout.initiate()).unwrap();
    } catch {
      // The session is already gone. The local cleanup below is what matters,
      // so a failing logout call must not stop it from running.
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
