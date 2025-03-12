import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:5000", // Update to match Flask server port
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for session cookies
})

export default api;
