"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CarForm({ existingCar, dealerId, subdomain }) {
  const editing = !!existingCar;
  const [brand, setBrand] = useState(existingCar?.brand || "");
  const [model, setModel] = useState(existingCar?.model || "");
  const [year, setYear] = useState(existingCar?.year || "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `/api/dealers/${subdomain}/cars/${existingCar.id}`
      : `/api/dealers/${subdomain}/cars`;
    const body = { brand, model, year, dealerId };
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      router.push(`/dealers/${subdomain}/dashboard/cars`);
    } else {
      alert("Failed to save car!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">{editing ? "Edit" : "Add"} Car</h2>
      <div className="mb-2">
        <label className="block font-semibold">Brand</label>
        <input value={brand} onChange={e => setBrand(e.target.value)} className="w-full border p-2 rounded" required />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Model</label>
        <input value={model} onChange={e => setModel(e.target.value)} className="w-full border p-2 rounded" required />
      </div>
      <div className="mb-2">
        <label className="block font-semibold">Year</label>
        <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full border p-2 rounded" required />
      </div>
      <button type="submit" disabled={loading}
        className="bg-blue-600 text-white px-5 py-2 rounded font-bold hover:bg-blue-700">
        {loading ? "Saving..." : (editing ? "Update Car" : "Add Car")}
      </button>
    </form>
  );
}
