const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

// Fuzzy Search for location
router.get('/fuzzy-search', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  try {
    const response = await fetch(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_API_KEY}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch fuzzy search results");
    }

    res.json(data);
  } catch (error) {
    console.error("Error in fuzzy search:", error);
    res.status(500).json({ error: error.message });
  }
});

// Category Search for EV stations
router.get('/category-search', async (req, res) => {
  const { center, radius, limit } = req.query;
  if (!center || !radius) {
    return res.status(400).json({ error: 'Center and radius parameters are required.' });
  }

  try {
    const [lat, lon] = center.split(',');
    const response = await fetch(
      `https://api.tomtom.com/search/2/categorySearch/electric vehicle station.json?lat=${lat}&lon=${lon}&radius=${radius}&limit=${limit || 100}&key=${TOMTOM_API_KEY}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch category search results");
    }

    res.json(data);
  } catch (error) {
    console.error("Error in category search:", error);
    res.status(500).json({ error: error.message });
  }
});

// Charging Availability
router.get('/availability', async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'ID parameter is required.' });
  }

  try {
    const response = await fetch(
      `https://api.tomtom.com/search/2/chargingAvailability.json?chargingAvailability=${encodeURIComponent(id)}&key=${TOMTOM_API_KEY}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch charging availability");
    }

    res.json(data);
  } catch (error) {
    console.error("Error in charging availability:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
