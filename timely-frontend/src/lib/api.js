// src/api/api.js
import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api", // Django backend base URL
  withCredentials: true, // include cookies if using auth
});

// ---- API WRAPPERS ----

// Events
export const getEvents = (params = {}) => api.get("/events/", { params });
export const getEvent = (id) => api.get(`/events/${id}/`);
export const createEvent = (data) => api.post("/events/", data);
export const updateEvent = (id, data) => api.put(`/events/${id}/`, data);
export const deleteEvent = (id) => api.delete(`/events/${id}/`);

// Public modules
export const getNews = () => api.get("/public/news/");
export const getMatches = () => api.get("/public/matches/");
export const getResults = () => api.get("/public/results/");

// ---- Auth ----
export const login = (credentials) => api.post("/auth/login/", credentials);
export const register = (data) => api.post("/auth/register/", data);
export const logout = () => api.post("/auth/logout/");

// Default export if you just need the axios instance
export default api;
