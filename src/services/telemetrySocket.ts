import { TelemetryData } from "@/types/telemetry";
export function connectTelemetrySocket(
  onData: (data: TelemetryData) => void,
  onError?: (err: Event) => void
) {
  const socket = new WebSocket('https://genai-ws-api-994522648258.asia-south1.run.app/ws/telemetry');
// const socket = new WebSocket('wss://us-central1-genai-cement-op.cloudfunctions.net/ws/telemetry');
  socket.onmessage = (event) => {
    const data: TelemetryData = JSON.parse(event.data);
    onData(data);
  };

  socket.onerror = (err) => {
    console.error('WebSocket error', err);
    onError?.(err);
  };

  return socket;
}
