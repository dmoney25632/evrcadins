"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface GeoPayload {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  timestamp?: number;
  error?: string;
}

interface TimeEntryDisplay {
  id: string;
  clockIn: string;
  clockOut: string | null;
  clockInGeo: Record<string, number> | null;
  clockOutGeo: Record<string, number> | null;
}

interface TimeClockClientProps {
  isClockedIn: boolean;
  openEntryId: string | null;
  todayEntries: TimeEntryDisplay[];
}

async function getGeolocation(): Promise<GeoPayload> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ error: "Geolocation not supported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        resolve({ error: err.message });
      },
      { timeout: 10000 }
    );
  });
}

export default function TimeClockClient({ isClockedIn, openEntryId, todayEntries }: TimeClockClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [geoStatus, setGeoStatus] = useState("");

  async function handleClockIn() {
    setLoading(true);
    setError("");
    setGeoStatus("Getting location...");

    const geo = await getGeolocation();
    setGeoStatus(geo.error ? `Location: ${geo.error}` : "Location captured ✓");

    const res = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clock-in", geo }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to clock in");
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  async function handleClockOut() {
    if (!openEntryId) return;
    setLoading(true);
    setError("");
    setGeoStatus("Getting location...");

    const geo = await getGeolocation();
    setGeoStatus(geo.error ? `Location: ${geo.error}` : "Location captured ✓");

    const res = await fetch(`/api/time-entries/${openEntryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clock-out", geo }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to clock out");
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  function formatLocation(geo: Record<string, number> | null): string {
    if (geo?.latitude != null && geo?.longitude != null) {
      return `${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)}`;
    }
    return "—";
  }

  function formatDuration(clockIn: string, clockOut: string | null): string {
    const start = new Date(clockIn).getTime();
    const end = clockOut ? new Date(clockOut).getTime() : Date.now();
    const ms = end - start;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm p-8 mb-6 text-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${isClockedIn ? "bg-green-100" : "bg-gray-100"}`}>
          <span className="text-3xl">{isClockedIn ? "🟢" : "⚫"}</span>
        </div>
        <p className="text-lg font-semibold text-gray-900 mb-2">{isClockedIn ? "Currently Clocked In" : "Not Clocked In"}</p>
        <p className="text-sm text-gray-500 mb-6">{new Date().toLocaleDateString()}</p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {geoStatus && <p className="text-gray-500 text-xs mb-4">{geoStatus}</p>}

        <button
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          disabled={loading}
          className={`px-8 py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 ${isClockedIn ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
        >
          {loading ? "Processing..." : isClockedIn ? "Clock Out" : "Clock In"}
        </button>
        <p className="text-xs text-gray-400 mt-3">Your location will be captured for compliance purposes.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Time Entries</h2>
        {todayEntries.length === 0 ? (
          <p className="text-sm text-gray-500">No entries today.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {todayEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 text-sm">{format(new Date(entry.clockIn), "h:mm a")}</td>
                  <td className="px-4 py-3 text-sm">{entry.clockOut ? format(new Date(entry.clockOut), "h:mm a") : <span className="text-green-600">Active</span>}</td>
                  <td className="px-4 py-3 text-sm">{formatDuration(entry.clockIn, entry.clockOut)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatLocation(entry.clockInGeo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
