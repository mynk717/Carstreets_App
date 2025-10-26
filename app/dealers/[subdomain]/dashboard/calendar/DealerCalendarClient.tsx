"use client";
import { useState } from "react";

export default function DealerCalendarClient({ calendar, subdomain, dealerName }) {
  const [items, setItems] = useState(calendar || []);

  const handleApprove = async (id) => {
    await fetch(`/api/dealers/${subdomain}/content/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: id }),
    });
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "approved" } : item
      )
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">
        Content Calendar for {dealerName}
      </h1>
      {items.length === 0 ? (
        <div className="bg-yellow-50 text-gray-700 rounded p-6 mt-4">
          No content scheduled yet for this dealer.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.id} className="py-4 flex flex-col gap-1">
              <span className="font-semibold text-indigo-700">
                {item.platform} — {item.status}
              </span>
              <span className="text-xs text-gray-500">
                Scheduled:{" "}
                {item.scheduledDate
                  ? new Date(item.scheduledDate).toLocaleString()
                  : "No date set"}
              </span>
              <span className="text-xs text-gray-400">
                Created: {new Date(item.createdAt).toLocaleString()}
              </span>
              <span className="text-gray-700 text-sm">
                {item.textContent || <i>(No content)</i>}
              </span>
              {item.brandedImage && (
                <div className="relative w-full max-w-lg aspect-video bg-gray-50 rounded shadow overflow-hidden mt-2 border border-gray-200">
                  <img
                    src={item.brandedImage}
                    alt="Branded"
                    className="absolute inset-0 object-cover w-full h-full"
                    loading="lazy"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
              {item.status === "pending" && (
                <button
                  className="mt-2 bg-green-600 text-white rounded px-3 py-1 font-bold hover:bg-green-700"
                  onClick={() => handleApprove(item.id)}
                >
                  Approve
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
