import { useEffect, useRef, useState } from 'react';
import { TelemetryData } from '../types/telemetry';
import { connectTelemetrySocket } from '../services/telemetrySocket';
import { getTelemetryHistory } from '../pages/firestoreService';

// Function to load CSV data as fallback
const loadCSVData = async (): Promise<TelemetryData[]> => {
  try {
    const response = await fetch('/records_export.csv');
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1).map(line => {
      // Parse CSV line properly handling quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // Field separator
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current); // Add last field

      const obj: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Parse numeric values
        if (['mill_power_kw', 'mill_throughput_tph', 'separator_efficiency', 'kiln_temp_c', 'cooler_fan_rpm', 'raw_caO', 'raw_siO2', 'raw_al2O3', 'raw_fe2O3', 'raw_moisture', 'clinker_temp_c', 'energy_per_ton_kwh', 'thermal_substitution_rate'].includes(header)) {
          obj[header] = value ? parseFloat(value) : 0;
        } else if (header === 'fuel_mix') {
          try {
            // fuel_mix is already a JSON string in the CSV, parse it directly
            obj[header] = value ? JSON.parse(value) : [];
          } catch (e) {
            console.warn('Failed to parse fuel_mix:', value, e);
            obj[header] = [];
          }
        } else {
          obj[header] = value;
        }
      });

      return obj as TelemetryData;
    });
  } catch (error) {
    console.error('Error loading CSV data:', error);
    return [];
  }
};

export const useTelemetry = () => {
  const [latestData, setLatestData] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const initializeTelemetry = async () => {
      try {
        // First try to get data from Firestore
        const firestoreHistory = await getTelemetryHistory(50); // Get up to 50 records

        if (firestoreHistory.length >= 10) {
          // Use Firestore data if we have enough records
          setHistory(firestoreHistory);
          if (firestoreHistory.length > 0) {
            setLatestData(firestoreHistory[0]);
          }
        } else {
          // Fall back to CSV data if less than 10 records in Firestore
          console.log('Insufficient Firestore data, loading CSV fallback');
          const csvData = await loadCSVData();
          setHistory(csvData.slice(0, 20)); // Use first 20 CSV records
          if (csvData.length > 0) {
            setLatestData(csvData[0]);
          }
        }
      } catch (error) {
        console.error('Error initializing telemetry:', error);
        // Fall back to CSV on error
        const csvData = await loadCSVData();
        setHistory(csvData.slice(0, 20));
        if (csvData.length > 0) {
          setLatestData(csvData[0]);
        }
      }

      // Set up real-time updates
      socketRef.current = connectTelemetrySocket((data) => {
        setLatestData(data);
        setHistory((prev) => {
          const updated = [data, ...prev];
          return updated.slice(0, 20); // Keep only latest 20
        });
      });

      setLoading(false);
    };

    initializeTelemetry();

    return () => {
      socketRef.current?.close();
    };
  }, []);

  return { latestData, history, loading };
};
