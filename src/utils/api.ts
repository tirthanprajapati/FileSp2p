import axios from 'axios';

const raw = import.meta.env.VITE_API_URL as string | undefined;

// trim and remove trailing slash, then append /api
const base =
  raw?.trim().replace(/\/$/, '')?.concat('/api') ??
  'http://localhost:3001/api';

export const api = axios.create({
  baseURL: base,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// List of public paths that should never redirect on auth failure
const publicPaths = ['/', '/receive'];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const path = window.location.pathname;
    const reqUrl = err.config?.url ?? '';

    // don't redirect if
    //  • it's not a 401
    //  • we're already on /login
    //  • this request was the login call itself
    //  • we're on a public path
    if (
      status === 401 &&
      path !== '/login' &&
      !reqUrl.endsWith('/auth/login') &&
      !publicPaths.some(publicPath => path === publicPath || path.startsWith(publicPath + '/'))
    ) {
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default api;