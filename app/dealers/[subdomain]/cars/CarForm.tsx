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
  subdomain: string;
  onSuccess?: () => void;
  initialCar?: any;  // ✅ Changed to 'any' to handle Prisma BigInt types
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
      <div className="max-w-5xl mx-auto p-4 text-gray-700 text-sm text-center">
        © {new Date().getFullYear()} CarStreets. All rights reserved.
      </div>
    </footer>
  );
}

// ------ MAIN CAR FORM ------
export default function CarForm({
  dealerId,
  subdomain,
  onSuccess,
  initialCar = {},
}: CarFormProps) {
  // ✅ Convert BigInt to string/number for form state
  const [form, setForm] = useState<CarFormValues>({
    brand: initialCar.brand || "",
    model: initialCar.model || "",
    year: initialCar.year || "",
    price: initialCar.price ? Number(initialCar.price) : "",  // ✅ Convert BigInt to Number
    kmDriven: initialCar.kmDriven || "",
    fuelType: initialCar.fuelType || "",
    transmission: initialCar.transmission || "",
    owners: initialCar.owners || "",
    location: initialCar.location || "",
    description: initialCar.description || "",
    images: Array.isArray(initialCar.images) ? [...initialCar.images] : [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);  // ✅ Add success state

  // Remove image utility
  function handleRemoveImage(idx: number) {
    setForm(f => ({
      ...f,
      images: (f.images ?? []).filter((_, i) => i !== idx),
    }));
  }

  // ✅ NEW: Set cover utility (moves selected image to index 0)
  function handleSetCover(idx: number) {
    setForm(f => {
      const current = [...(f.images ?? [])];
      if (idx <= 0 || idx >= current.length) return f;
      const [sel] = current.splice(idx, 1);
      current.unshift(sel);
      return { ...f, images: current };
    });
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);  // ✅ Reset success state

    try {
      const res = await fetch(`/api/dealers/${subdomain}/cars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealerId, ...form }),
      });

      if (!res.ok) {
        let msg = "Submission failed";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const json = await res.json();
            msg = typeof json.error === "string"
              ? json.error
              : (json.error?.message || msg);
          } else {
            msg = await res.text();
          }
        } catch {}
        throw new Error(msg);
      }

      // ✅ Success handling
      setSuccess(true);
      setForm({
        brand: "", model: "", year: "", price: "",
        kmDriven: "", fuelType: "", transmission: "", owners: "",
        location: "", description: "", images: []
      });

      // ✅ Redirect after 2 seconds
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = `/dealers/${subdomain}/dashboard`;
        }
      }, 2000);

    } catch (err: any) {
      setError(typeof err === "string" ? err : (err?.message || "Submission failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-col min-h-screen py-8 bg-gray-100">
        <div className="max-w-2xl w-full mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-8 text-blue-900">
            {initialCar.id ? "Edit Car" : "Add New Car"}
          </h1>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {error && (
              <div className="col-span-2 bg-red-100 text-red-700 p-3 rounded break-words">
                {error}
              </div>
            )}
            {success && (
              <div className="col-span-2 bg-green-100 text-green-700 p-3 rounded">
                ✅ Car {initialCar.id ? "updated" : "added"} successfully! Redirecting...
              </div>
            )}

            <input
              name="brand"
              value={form.brand as string}
              onChange={handleChange}
              placeholder="Brand"
              required
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-gray-900 placeholder-gray-500"
            />
            <input
              name="model"
              value={form.model as string}
              onChange={handleChange}
              placeholder="Model"
              required
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-gray-900 placeholder-gray-500"
            />
            <input
              name="year"
              value={form.year as string}
              onChange={handleChange}
              placeholder="Year"
              type="number"
              required
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-gray-900 placeholder-gray-500"
            />
            <input
              name="price"
              value={form.price as string}
              onChange={handleChange}
              placeholder="Price"
              type="number"
              required
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-gray-900 placeholder-gray-500"
            />
            <input
              name="kmDriven"
              value={form.kmDriven as string}
              onChange={handleChange}
              placeholder="KM Driven"
              type="number"
              required
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-gray-900 placeholder-gray-500"
            />
            <input
              name="fuelType"
              value={form.fuelType as string}
              onChange={handleChange}
              placeholder="Fuel Type"
              required
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-gray-900 placeholder-gray-500"
            />
            <input
              name="transmission"
              value={form.transmission as string}
              onChange={handleChange}
              placeholder="Transmission"
              required
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-gray-900 placeholder-gray-500"
            />
            <input
              name="owners"
              value={form.owners as string}
              onChange={handleChange}
              placeholder="Owners"
              type="number"
              required
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-gray-900 placeholder-gray-500"
            />

            <input
              name="location"
              value={form.location as string}
              onChange={handleChange}
              placeholder="Location"
              className="md:col-span-2 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-gray-900 placeholder-gray-500"
            />
            <textarea
              name="description"
              value={form.description as string}
              onChange={handleChange}
              placeholder="Description"
              className="md:col-span-2 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-gray-900 placeholder-gray-500"
            />

            {/* Cloudinary upload */}
            <div className="md:col-span-2 mb-2">
              <label className="block text-sm font-medium text-gray-900 mb-1">Upload Car Images</label>
              <CldUploadWidget
                uploadPreset="carstreets-unsigned"
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
                    const url = result.info.secure_url;
                    setForm(f => ({
                      ...f,
                      images: [...(f.images ?? []), url],
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

              {/* Preview grid with Set cover (only addition/change) */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {(form.images ?? []).map((img, i) => (
                  <div className="relative group" key={i}>
                    {/* Cover badge on index 0 */}
                    {i === 0 && (
                      <span className="absolute left-1 top-1 z-10 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}

                    <img
                      src={img}
                      alt={`car img ${i + 1}`}
                      className="w-20 h-16 object-cover rounded border"
                    />

                    {/* Delete */}
                    <button
                      type="button"
                      className="absolute right-1 top-1 bg-red-600 text-white rounded-full p-1 text-xs opacity-80 hover:opacity-100 transition"
                      title="Remove"
                      onClick={() => handleRemoveImage(i)}
                    >
                      ×
                    </button>

                    {/* NEW: Set cover overlay button */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[11px] p-1 flex justify-between rounded-b">
                      <button
                        type="button"
                        onClick={() => handleSetCover(i)}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20"
                        title="Set as cover"
                      >
                        Set cover
                      </button>
                      <span className="opacity-75 pr-1">#{i + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="col-span-2 mt-4 w-full py-3 rounded bg-blue-700 text-white font-semibold text-lg shadow hover:bg-blue-800 transition"
              disabled={loading}
            >
              {loading ? "Saving..." : (initialCar.id ? "Update Car" : "Add Car")}
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
