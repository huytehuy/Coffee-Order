const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true }, // Unique number identifier for the table
  status: { type: String, enum: ['available', 'occupied', 'finished'], default: 'available' },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Reference to the current order
});

module.exports = mongoose.model('Table', TableSchema);
