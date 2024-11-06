import { useState, useEffect } from 'react';
import { Badge, Box, Button, Grid, Image, LoadingOverlay, Modal, ScrollArea, Text } from '@mantine/core';
import tableImage from '../assets/table.png';
import coffeeImage from '../assets/coffee.png';
import { useDisclosure } from '@mantine/hooks';
import '@mantine/notifications/styles.css';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { placeOrder, updateTableStatus } from '../api/apiService';
import socket from '../api/socket'; // Import the single socket instance

interface Product {
  name: string;
  count: number;
}

interface Table {
  _id: string;
  number: number;
  status: 'available' | 'occupied' | 'finished';
  currentOrder?: any;
}

function Menu() {
  const [tables, setTables] = useState<Table[]>([]);
  const [tableData, setTableData] = useState<{ [key: number]: Product[] }>({});
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);

  // Fetch tables from the backend
  const fetchTables = async () => {
    try {
      const response = await axios.get('http://172.20.10.2:9000/tables');
      const tablesFromBackend = response.data;
      setTables(tablesFromBackend);
      setVisible(false);

      // Initialize tableData with default items for each table
      const initialTableData = tablesFromBackend.reduce((acc: { [key: number]: Product[] }, table: Table) => {
        acc[table.number] = [
          { name: 'Cà phê đá', count: 0 },
          { name: 'Cà phê sữa', count: 0 },
        ];
        return acc;
      }, {});

      setTableData(initialTableData);
    } catch (err) {
      console.error("Error fetching tables:", err);
    }
  };

  useEffect(() => {
    // Connect and listen for table updates in real-time
    socket.on('connect', () => {
      console.log('Connected to socket server with ID:', socket.id);
    });

    // Initial fetch of tables on component mount
    fetchTables();

    // Listen for tableUpdated events and refresh the table data
    socket.on('tableUpdated', () => {
      console.log('Table updated, fetching latest data');
      fetchTables(); // Refresh tables whenever there’s a tableUpdated event
    });

    return () => {
      socket.off('tableUpdated');
    };
  }, []);

  const handleOpen = (tableNumber: number) => {
    setSelectedTable(tableNumber);
    open();
  };

  const incrementCount = (tableNumber: number, index: number) => {
    setTableData((prevData) => ({
      ...prevData,
      [tableNumber]: prevData[tableNumber].map((item, i) =>
        i === index ? { ...item, count: item.count + 1 } : item
      ),
    }));
  };

  const decrementCount = (tableNumber: number, index: number) => {
    setTableData((prevData) => ({
      ...prevData,
      [tableNumber]: prevData[tableNumber].map((item, i) =>
        i === index ? { ...item, count: Math.max(0, item.count - 1) } : item
      ),
    }));
  };

  const totalItems = selectedTable !== null
    ? tableData[selectedTable]?.reduce((total, item) => total + item.count, 0)
    : 0;

  const handleOrderPlacement = async () => {
    if (selectedTable !== null) {
      const itemsToOrder = tableData[selectedTable]
        .filter((item) => item.count > 0)
        .map((item) => ({
          name: item.name,
          quantity: item.count,
        }));

      try {
        setVisible(true);
        await placeOrder(String(selectedTable), itemsToOrder);
        setTables((prevTables) =>
          prevTables.map((table) =>
            table.number === selectedTable ? { ...table, status: 'occupied' } : table
          )
        );
        setVisible(false);
        notifications.show({
          title: 'Đặt hàng thành công',
          message: `Đã đặt ${totalItems} món cho bàn ${selectedTable}`,
          position: 'top-right',
          color: 'teal',
        });
        close();
      } catch (error) {
        console.error('Error placing order:', error);
        notifications.show({
          title: 'Lỗi đặt hàng',
          message: 'Không thể đặt hàng. Vui lòng thử lại.',
          position: 'top-right',
          color: 'red',
        });
      }
    }
  };

  const toggleTableStatus = async (tableId: string, currentStatus: string, number: number) => {
    const newStatus = currentStatus === 'occupied' ? 'available' : 'occupied';
    try {
      setVisible(true);
      await updateTableStatus(tableId, newStatus);
      notifications.show({
        title: 'Status Updated',
        message: `Bàn số ${number} đã thanh toán`,
        color: newStatus === 'available' ? 'green' : 'blue',
      });
      close();
    } catch (error) {
      console.error('Error updating table status:', error);
    }
    setVisible(false);
  };

  // Find the table data by selected table number
  const selectedTableData = tables.find((table) => table.number === selectedTable);

  return (
    <>
          <LoadingOverlay visible={visible} zIndex={10000} overlayProps={{ radius: "sm", blur: 2 }} />
      <Box className="flex justify-center items-center text-2xl font-bold mb-3">Danh sách các bàn</Box>
      <Grid gutter="md">
        {tables.map((table) => (
          <Grid.Col
            span={{ base: 6, md: 6, lg: 3 }}
            key={table._id}
            onClick={() => handleOpen(table.number)}
            className="cursor-pointer"
          >
            <Box
              className={`text-center p-4 rounded-md ${table.status === 'occupied' ? 'bg-blue-200' : 'bg-red-100'
                }`}
            >
              <Text>
                Bàn {table.number}
                <br />
                {table.status === 'occupied' ? '(Đang dùng)' : '(Trống)'}
              </Text>
              <Image src={tableImage} width={200} />
            </Box>
          </Grid.Col>
        ))}
      </Grid>

      <Modal opened={opened} onClose={close} title={`Bàn ${selectedTable}`} centered>
      <LoadingOverlay visible={visible} zIndex={10000} overlayProps={{ radius: "sm", blur: 2 }} />
        <ScrollArea h={250}>
          {selectedTable !== null &&
            tableData[selectedTable]?.map((item, index) => (
              <Box key={item.name} className="flex justify-between items-center w-full mb-2">
                <Box className="flex items-center">
                  <Image src={coffeeImage} style={{ height: 50, width: 'auto' }} className="mr-2" />
                  <Text>{item.name}</Text>
                </Box>
                <Box className="flex items-center">
                  <Button onClick={() => incrementCount(selectedTable, index)}>+</Button>
                  <Box className="mx-3 w-2.5 flex justify-center">{item.count}</Box>
                  <Button onClick={() => decrementCount(selectedTable, index)}>-</Button>
                </Box>
              </Box>
            ))}
        </ScrollArea>

        <Box className="flex justify-between items-center w-full mt-4">
          <Box className="flex justify-between items-center">
            <Text>Tổng món: </Text>
            <Badge className="ml-1">{totalItems}</Badge>
          </Box>

          {selectedTableData?.status==='occupied' ? (
            <Button onClick={() => toggleTableStatus(selectedTableData._id, selectedTableData.status,selectedTableData.number)}>
              Thanh toán
            </Button>
          ) : <Button onClick={handleOrderPlacement}>Đặt đơn</Button>}
        </Box>
      </Modal>
    </>
  );
}

export default Menu;
