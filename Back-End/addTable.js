const mongoose = require('mongoose');
const Table = require('./models/Table'); // Adjust path if necessary

// Connect to MongoDB
mongoose.connect('mongodb+srv://huyhuy:huyhuy@cluster0.i6slrnu.mongodb.net/coffeeOrder?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Failed to connect to MongoDB", err));

// Function to add 20 tables
const addTables = async () => {
  try {
    // Check if tables already exist
    const tableCount = await Table.countDocuments();
    if (tableCount >= 20) {
      console.log("Tables already exist.");
      mongoose.connection.close();
      return;
    }

    // Add tables from 1 to 20
    for (let i = 1; i <= 20; i++) {
      const table = new Table({
        number: i,
        status: 'available'
      });
      await table.save();
    }

    console.log("20 tables added to the database successfully!");
  } catch (err) {
    console.error("Error adding tables:", err);
  } finally {
    mongoose.connection.close(); // Close connection after script is done
  }
};

addTables();
