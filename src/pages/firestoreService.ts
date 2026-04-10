import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, Timestamp, getDocs } from 'firebase/firestore';

export interface TelemetryData {
  [key: string]: any;
  timestamp?: string;
}

/**
 * Adds a new telemetry data document to the 'telemetry' collection in Firestore.
 * @param data The telemetry data to store.
 * @returns The document reference of the newly created document.
 */
export const addTelemetryData = async (data: TelemetryData) => {
  const telemetryCollectionRef = collection(db, 'telemetry');
  return await addDoc(telemetryCollectionRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
};

/**
 * Gets all telemetry history from Firestore, ordered by creation time (most recent first).
 * @param limitCount Optional limit for the number of records to fetch.
 * @returns Array of telemetry data.
 */
export const getTelemetryHistory = async (limitCount?: number): Promise<TelemetryData[]> => {
  const telemetryCollectionRef = collection(db, 'telemetry');
  const q = query(telemetryCollectionRef, orderBy('createdAt', 'desc'), ...(limitCount ? [limit(limitCount)] : []));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  } as TelemetryData));
};

/**
 * Listens for real-time updates to the latest telemetry document.
 * @param callback The function to call with the latest document's data.
 * @returns The unsubscribe function for the listener.
 */
export const onLatestTelemetryUpdate = (callback: (data: TelemetryData | null) => void) => {
  const telemetryCollectionRef = collection(db, 'telemetry');
  const q = query(telemetryCollectionRef, orderBy('createdAt', 'desc'), limit(1));

  return onSnapshot(q, (querySnapshot) => {
    if (!querySnapshot.empty) {
      const latestDoc = querySnapshot.docs[0];
      callback({ ...latestDoc.data(), id: latestDoc.id });
    } else {
      callback(null);
    }
  });
};