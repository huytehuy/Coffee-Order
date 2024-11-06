import axios from 'axios';

axios.defaults.baseURL = 'http://172.20.10.2:9000'; // Ensure this points to your backend

// Define a separate type for placing an order
interface OrderItem {
  name: string;
  quantity: number;
}

// Use the new type in the placeOrder function
// export const placeOrder = async (tableId: string, items: OrderItem[]) => {
//   const response = await axios.post('/order', { tableId, items });
//   return response.data;
// };
export const placeOrder = async (tableId: string, items: OrderItem[]) => {
    const response = await axios.post(`http://172.20.10.2:9000/order`, {
      tableId,
      items,
    });
    return response.data;
  };

export const updateTableStatus = async (tableId: string, status: string) => {
    return axios.patch(`${axios.defaults.baseURL}/tables/${tableId}/status`, { status });
  };

  export const getOrdersByStatus = async (status: string) => {
    try {
      const response = await axios.get(`${axios.defaults.baseURL}/orders/status/${status}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  };
  export const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await axios.patch(`http://localhost:9000/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };
