"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import { CldUploadWidget } from "next-cloudinary";

// ------ TYPE DEFINITIONS ------
type CarFormValues = {
  brand?: string;
  model?: string;
  year?: string | number;
  price?: string | number;
  kmDriven?: string | number;
  fuelType?: string;
  transmission?: string;
  owners?: string | number;
  location?: string;
  description?: string;
  images?: string[];
};

type CarFormProps = {
  dealerId: string;
  onSuccess?: () => void;
  initialCar?: CarFormValues;
};

// ------ HEADER/FOOTER ------
function SiteHeader() {
  return (
    <header className="w-full bg-blue-800 text-white shadow">
      <div className="max-w-5xl mx-auto p-4 flex items-center">
        <span className="font-bold text-lg tracking-wide">CarStreets Dealer</span>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="w-full mt-12 bg-gray-50 border-t">
      <div className="max-w-5xl mx-auto p-4 text-gray-500 text-sm text-center">© {new Date().getFullYear()} CarStreets. All rights reserved.</div>
    </footer>
  );
}

// ------ MAIN CAR FORM ------
export default function CarForm({
  dealerId,
  onSuccess,
  initialCar = {},
}: CarFormProps) {
  const [form, setForm] = useState<CarFormValues>({
    brand: initialCar.brand || "",
    model: initialCar.model || "",
    year: initialCar.year || "",
    price: initialCar.price || "",
    kmDriven: initialCar.kmDriven || "",
    fuelType: initialCar.fuelType || "",
    transmission: initialCar.transmission || "",
    owners: initialCar.owners || "",
    location: initialCar.location || "",
    description: initialCar.description || "",
    images: Array.isArray(initialCar.images) ? initialCar.images : [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleImageUpload(urls: string[]) {
    setForm(f => ({ ...f, images: [...(f.images ?? []), ...urls] }));
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dealers/[subdomain]/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealerId, ...form }),
      });
      if (!res.ok) throw new Error(await res.text());
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-col min-h-screen py-8 bg-gray-100">
        <div className="max-w-2xl w-full mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-8 text-blue-900">Add New Car</h1>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {error && <div className="col-span-2 bg-red-100 text-red-700 p-2 rounded">{error}</div>}

            <input name="brand" value={form.brand as string} onChange={handleChange} placeholder="Brand" required className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 w-full" />
            <input name="model" value={form.model as string} onChange={handleChange} placeholder="Model" required className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 w-full" />
            <input name="year" value={form.year as string} onChange={handleChange} placeholder="Year" type="number" required className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 w-full" />
            <input name="price" value={form.price as string} onChange={handleChange} placeholder="Price" type="number" required className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 w-full" />
            <input name="kmDriven" value={form.kmDriven as string} onChange={handleChange} placeholder="KM Driven" type="number" required className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 w-full" />
            <input name="fuelType" value={form.fuelType as string} onChange={handleChange} placeholder="Fuel Type" required className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 w-full" />
            <input name="transmission" value={form.transmission as string} onChange={handleChange} placeholder="Transmission" required className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 w-full" />
            <input name="owners" value={form.owners as string} onChange={handleChange} placeholder="Owners" type="number" required className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 w-full" />

            <input name="location" value={form.location as string} onChange={handleChange} placeholder="Location" className="md:col-span-2 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 w-full" />
            <textarea name="description" value={form.description as string} onChange={handleChange} placeholder="Description" className="md:col-span-2 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 w-full" />

            {/* Cloudinary upload */}
            <div className="md:col-span-2 mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Car Images</label>
              <CldUploadWidget
                uploadPreset="carstreets-unsigned" // Change to your actual unsigned preset
                options={{
                  maxFiles: 10,
                  resourceType: "image",
                  multiple: true,
                  clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                  cropping: false,
                  folder: "carstreets/cars"
                }}
                onUpload={(result: any) => {
                  if (result.event === "success") {
                    const newImageUrl = result.info.secure_url;
                    setForm(f => ({
                      ...f,
                      images: [...(f.images ?? []), newImageUrl]
                    }));
                  }
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    className="inline-block px-4 py-2 bg-blue-50 text-blue-900 rounded border border-blue-200 hover:bg-blue-100 transition"
                    onClick={e => { e.preventDefault(); open(); }}
                  >
                    Upload Images
                  </button>
                )}
              </CldUploadWidget>
              <div className="flex gap-2 mt-2 flex-wrap">
                {(form.images ?? []).map((img, i) => (
                  <img key={i} src={img} alt={`car img ${i + 1}`} className="w-20 h-16 object-cover rounded border" />
                ))}
              </div>
            </div>

            <button type="submit" className="col-span-2 mt-4 w-full py-3 rounded bg-blue-700 text-white font-semibold text-lg shadow hover:bg-blue-800 transition" disabled={loading}>
              {loading ? "Saving..." : "Add Car"}
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
