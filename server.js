
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Schema & Model
const locationSchema = new mongoose.Schema({
  deviceId: String,
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now }
});

const Location = mongoose.model('Location', locationSchema);

// POST /api/location → Kirim lokasi
app.post('/api/location', async (req, res) => {
  const { deviceId, latitude, longitude } = req.body;

  if (!deviceId || !latitude || !longitude) {
    return res.status(400).send({ message: 'deviceId, latitude, and longitude are required.' });
  }

  try {
    const location = new Location({ deviceId, latitude, longitude });
    await location.save();
    res.status(201).send({ message: 'Location saved', data: location });
  } catch (err) {
    console.error('Error saving location:', err);
    res.status(500).send({ message: 'Failed to save location', error: err });
  }
});

// GET /api/location/all-latest → Ambil lokasi terakhir dari semua HP
app.get('/api/location/all-latest', async (req, res) => {
  try {
    const devices = await Location.distinct("deviceId");

    const latestLocations = await Promise.all(
      devices.map(async (deviceId) => {
        return await Location.findOne({ deviceId }).sort({ timestamp: -1 });
      })
    );

    res.json(latestLocations);
  } catch (err) {
    console.error('Error fetching latest locations:', err);
    res.status(500).send({ message: 'Error fetching data', error: err });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
