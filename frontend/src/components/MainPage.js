// frontend/src/components/MainPage.js
import React, { useState } from "react";
import { getSolarData, checkHealth } from "../api";

const MainPage = () => {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Call backend health check
  const testBackend = async () => {
    try {
      const res = await checkHealth();
      console.log("Backend health:", res);
    } catch (err) {
      console.error("Health check failed:", err);
    }
  };

  // ✅ Call backend solar optimizer
  const handleGetSolarData = async () => {
    if (!lat || !lon) {
      setError("Please enter latitude and longitude");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getSolarData({
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        polygon: null, // replace with polygon data if using map
      });
      console.log("Solar API Response:", data);
      setResults(data);
    } catch (err) {
      console.error("Error fetching solar data:", err);
      setError("Failed to fetch solar data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Solar Panel Optimizer</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Latitude"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Longitude"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          className="border p-2 mr-2"
        />
        <button
          onClick={handleGetSolarData}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Get Solar Data
        </button>
        <button
          onClick={testBackend}
          className="ml-2 bg-green-600 text-white px-4 py-2 rounded"
        >
          Test Backend
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {results && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default MainPage;
