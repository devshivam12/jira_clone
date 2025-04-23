import axios from "axios"


export default class ApiService {
    constructor() {
        this.api = axios.create({
            baseURL: import.meta.env.VITE_SERVER,
            withCredentials: true, // Optional if you need cookies or cross-domain credentials
        });

        const token = localStorage.getItem('accessToken');
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (token && userData) {
            this.setAuthorizationToken(token, userData);
        }
    }

    async setAuthorizationToken(token, userData) {
        this.api.defaults.headers.common['Authorization'] = `${token}`; // Optional if needed
        this.api.defaults.headers.common['x-clientId'] = userData.clientId; // Set clientId
    }

    async clearHeaders() {
        delete this.api.defaults.headers.common['Authorization'];
        delete this.api.defaults.headers.common['x-clientId']; // ✅ Fix typo
    }
    

    async makeRequest(requestMethod, endpoint, data = null, params = {}) {
        try {
            const response = await requestMethod(endpoint, data, { params });
            // Return both the response data and a message
            return {
                // success: true,
                data: response.data,
                // status : response.data.status,
                // message: response.data?.message || 'Request was successful',
            };
        } catch (error) {
            // Pass the response message if available
            const errorMessage = error.response?.data?.message || 'An error occurred';
            this.handleRequestError(error, errorMessage);
            return {
                success: false,
                data: null,
                message: errorMessage,
            };
        }
    }

    async get(endpoint, params = {}) {
        return this.makeRequest(this.api.get.bind(this.api), endpoint, null, params);
    }

    async post(endpoint, data) {
        return this.makeRequest(this.api.post.bind(this.api), endpoint, data);
    }

    async put(endpoint, data) {
        return this.makeRequest(this.api.put.bind(this.api), endpoint, data);
    }

    async delete(endpoint, params = {}) {
        return this.makeRequest(this.api.delete.bind(this.api), endpoint, null, params);
    }

    handleRequestError(error, customMessage) {
        if (error.response) {
            console.error('HTTP Error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Request Error:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        console.error('Message:', customMessage); // Log the custom error message
    }
}