import axios from "axios";

const API_URL = "http://localhost:8070/api/cottages";

export const getCottages = async () => {
  const res = await axios.get(API_URL);
  return res.data.data;
};

export const createCottage = async (cottage: any) => {
  const res = await axios.post(API_URL, cottage);
  return res.data.data;
};

export const updateCottage = async (id: string, updates: any) => {
  const res = await axios.put(`${API_URL}/${id}`, updates);
  return res.data.data;
};

export const deleteCottage = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};
