const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io'); // Import Server from socket.io
const Table = require('./models/Table');
const Order = require('./models/Order');
const MenuItem = require('./models/MenuItem');

// Set up Express app
const app = express();
const server = http.createServer(app); // Bind HTTP server to app

// Set up Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: true, // Adjust to match your frontend's URL and port
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://huyhuy:huyhuy@cluster0.i6slrnu.mongodb.net/coffeeOrder?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Failed to connect to MongoDB", err));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API Routes

// 1. Get all tables with their status
app.get('/tables', async (req, res) => {
  try {
    const tables = await Table.find();
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch tables' });
  }
});

// 2. Create a new table
app.post('/tables', async (req, res) => {
  const { number } = req.body;
  try {
    const newTable = new Table({ number, status: 'available' });
    await newTable.save();
    res.status(201).json({ message: 'Table created successfully', table: newTable });
  } catch (err) {
    res.status(500).json({ error: 'Could not create table' });
  }
});

// 3. Place an order for a specific table
app.post('/order', async (req, res) => {
  const { tableId, items } = req.body;
  try {
    const table = await Table.findOne({ number: tableId });
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Create a new order
    const order = new Order({
      table: table._id,
      items: items.map(item => ({ name: item.name, quantity: item.quantity, status: 'pending' })),
    });
    await order.save();

    // Update the table's status in the database
    await Table.findByIdAndUpdate(table._id, { status: 'occupied', currentOrder: order._id });

    // Emit a table update event to all clients
    io.emit('tableUpdated', { tableId, status: 'occupied', currentOrder: order });

    res.json({ message: 'Order placed successfully', order });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ error: 'Could not place order' });
  }
});

// 4. Update item status in an order (for kitchen)
app.patch('/order/:orderId/item/:itemId/status', async (req, res) => {
  const { orderId, itemId } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    item.status = status;
    await order.save();

    res.json({ message: 'Item status updated successfully', order });
  } catch (err) {
    console.error("Error updating item status:", err);
    res.status(500).json({ error: 'Could not update item status' });
  }
});

// 5. Complete an order (update table status to finished)
app.patch('/order/:orderId/complete', async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await Order.findByIdAndUpdate(orderId, { status: 'completed' });
    await Table.findByIdAndUpdate(order.table, { status: 'finished', currentOrder: null });

    // Emit an update to all clients when the table is marked as finished
    io.emit('tableUpdated', { tableNumber: order.table, status: 'finished' });

    res.json({ message: 'Order completed and table marked as finished' });
  } catch (err) {
    console.error("Error completing order:", err);
    res.status(500).json({ error: 'Could not complete order' });
  }
});

// 6. Get menu items
app.get('/menu', async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch menu' });
  }
});
// Toggle table status between 'occupied' and 'available'
app.patch('/tables/:tableId/status', async (req, res) => {
  const { tableId } = req.params; // This should be the _id, not the table number
  const { status } = req.body;

  try {
    // Use `_id` to find the table by its ObjectId
    const table = await Table.findByIdAndUpdate(
      tableId,
      { status },
      { new: true }
    );
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Emit an event to all connected clients to update the table's status
    io.emit('tableUpdated', { tableId: table.number, status: table.status });

    res.json({ message: 'Table status updated successfully', table });
  } catch (err) {
    console.error('Error updating table status:', err);
    res.status(500).json({ error: 'Could not update table status' });
  }
});
app.post('/orders/by-status', async (req, res) => {
  const { status } = req.body;

  // Check if the provided status is valid
  if (!['pending', 'making', 'done'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // Find orders with the specified status
    const orders = await Order.find({ status });
    res.json(orders);
  } catch (error) {
    console.error('Error retrieving orders by status:', error);
    res.status(500).json({ error: 'Could not retrieve orders' });
  }
});
// server.js or your routes file
app.patch('/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});
// Get orders by status with table number populated
// server.js or your routes file
app.get('/orders/status/:status', async (req, res) => {
  const { status } = req.params;

  try {
    const orders = await Order.find({ status })
      .populate('table', 'number') // Populate only the 'number' field of the table
      .exec();
    res.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders by status', error);
    res.status(500).json({ error: 'Failed to fetch orders by status' });
  }
});



  

// Start the server
const PORT = 9000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
