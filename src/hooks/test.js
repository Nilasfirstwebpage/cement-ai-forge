import admin from "firebase-admin";
import { Parser } from "json2csv";
import fs from "fs";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function exportCollectionToCSV() {
  const records = [];
  const snapshot = await db.collection("telemetry").get();

  snapshot.forEach((doc) => {
    records.push({ id: doc.id, ...doc.data() });
  });

  const parser = new Parser();
  const csv = parser.parse(records);

  fs.writeFileSync("records_export.csv", csv);

  console.log("CSV Export Complete: records_export.csv");
}

exportCollectionToCSV();
