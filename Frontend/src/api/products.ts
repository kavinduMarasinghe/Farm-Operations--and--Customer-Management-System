import apiClient from "./apiClient";

const API_URL = "/api/products";

export const getProducts = async () => {
  const res = await apiClient.get(API_URL);
  return res.data.data; // data comes from { success, data }
};

export const createProduct = async (product: any) => {
  const res = await apiClient.post(API_URL, product);
  return res.data.data;
};

export const updateProduct = async (id: string, product: any) => {
  const res = await apiClient.put(`${API_URL}/${id}`, product);
  return res.data.data;
};

export const deleteProduct = async (id: string) => {
  const res = await apiClient.delete(`${API_URL}/${id}`);
  return res.data;
};
