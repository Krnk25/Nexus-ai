import axios from "axios";

const SystemAPI = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
  timeout: 15000,
});

export default SystemAPI;