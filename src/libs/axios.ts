import axios from "axios";

const apiBaseUrl = "http://127.0.0.1:5000";

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
});

export default axiosInstance;
