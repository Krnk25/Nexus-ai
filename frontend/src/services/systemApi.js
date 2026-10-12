
import axios from "axios";

const SystemAPI = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export default SystemAPI;