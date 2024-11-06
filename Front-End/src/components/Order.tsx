import { useState, useEffect } from 'react';
import { getOrdersByStatus, updateOrderStatus } from '../api/apiService';
import { Link } from 'react-router-dom';
import { Box, Text, Divider, Button } from '@mantine/core';

interface OrderItem {
  name: string;
  quantity: number;
  status: 'pending' | 'making' | 'done';
}

interface TableRef {
  _id: string;
  number: number; // Populated field
}

interface Order {
  _id: string;
  table: TableRef; // Updated to reference populated Table object
  items: OrderItem[];
  status: 'pending' | 'making' | 'done';
}

function OrdersByStatus() {
  const [status, setStatus] = useState<string>('pending');
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
  }, [status]);

  const fetchOrders = async () => {
    try {
      const orders = await getOrdersByStatus(status);
      setOrders(orders);
    } catch (error) {
      console.error('Failed to fetch orders by status');
    }
  };

  const handleStatusChange = async (orderId: string) => {
    const nextStatus = getNextStatus(status);
    if (!nextStatus) return;

    try {
      await updateOrderStatus(orderId, nextStatus);
      fetchOrders(); // Refresh orders after updating the status
    } catch (error) {
      console.error('Failed to update order status');
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'making';
      case 'making':
        return 'done';
      case 'done':
        return null;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Text size="xl" w={500}>Trạng thái đơn nước: {status}</Text>
      <select onChange={(e) => setStatus(e.target.value)} value={status}>
        <option value="pending">Đang chờ</option>
        <option value="making">Đang làm</option>
        <option value="done">Hoàn thành</option>
      </select>

      {orders.length > 0 ? (
        orders.map((order) => (
          <Box key={order._id} my="lg" p="md" style={{ border: '1px solid #ccc', borderRadius: '8px' }}>
            <Text>Bàn: số {order.table.number}</Text> {/* Access the populated table number */}
            <Divider my="sm" />
            <Text w={500} size="md">Items:</Text>
            {order.items.map((item, index) => (
              <Box key={index} ml="md">
                <Text>Name: {item.name}</Text>
                <Text>Quantity: {item.quantity}</Text>
                <Text>Status: {item.status}</Text>
                {index < order.items.length - 1 && <Divider my="sm" />}
              </Box>
            ))}
            <Button
              mt="md"
              onClick={() => handleStatusChange(order._id)}
              disabled={order.status === 'done'}
            >
              {order.status === 'done' ? 'Completed' : `Move to ${getNextStatus(order.status)}`}
            </Button>
          </Box>
        ))
      ) : (
        <Text>No orders found for this status.</Text>
      )}

      <Box mt="lg">
        <Link to="/">Back to Table View</Link>
      </Box>
    </Box>
  );
}

export default OrdersByStatus;
