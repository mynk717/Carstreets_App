"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { SearchableSelect } from "@/components/SearchableSelect"; // ✅ ADD THIS
import carsData from "@/lib/indian-cars-database.json"


// Types
type CarFormValues = {
  brand?: string;
  model?: string;
  variant?: string;
  year?: string | number;
  price?: string | number;
  kmDriven?: string | number;
  fuelType?: string;
  transmission?: string;
  owners?: string | number;
  location?: string;
  description?: string;
  images?: string[];

  // Listing options (restored)
  carStreetsListed?: boolean;
  isFeatured?: boolean;
  availableForFinance?: boolean;
  availableForExchange?: boolean;

  // ✅ ADD THIS - Verification flag
  isVerified?: boolean;
};

type InitialCar = Partial<CarFormValues> & {
  id?: string | number;
  price?: string | number | bigint;
};

type CarFormProps = {
  dealerId: string;
  subdomain: string;
  onSuccess?: () => void;
  initialCar?: InitialCar;
};

type InputChange =
  | ChangeEvent<HTMLInputElement>
  | ChangeEvent<HTMLTextAreaElement>
  | ChangeEvent<HTMLSelectElement>;

// Reusable Field components
type FormFieldProps = {
  label: string;
  name: string;
  value: string | number | undefined;
  onChange: (e: InputChange) => void;
  type?: string;
  required?: boolean;
};

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        name={name}
        value={(value ?? "") as string | number}
        onChange={onChange}
        type={type}
        required={required}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

type FormSelectProps = {
  label: string;
  name: string;
  value: string | number | undefined;
  onChange: (e: InputChange) => void;
  options: (string | number)[];
};

function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
}: FormSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <select
        name={name}
        value={(value ?? "") as string | number}
        onChange={onChange}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((opt) => (
          <option key={String(opt)} value={opt}>
            {String(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CarForm({
  dealerId,
  subdomain,
  onSuccess,
  initialCar,
}: CarFormProps) {
  const ic: InitialCar = initialCar ?? {};
  const normalizeNumber = (v: unknown) =>
    v === undefined || v === null
      ? ""
      : typeof v === "bigint"
      ? Number(v)
      : (v as string | number);

  const [form, setForm] = useState<CarFormValues>({
    brand: ic.brand ?? "",
    model: ic.model ?? "",
    variant: ic.variant ?? "",
    year: normalizeNumber(ic.year),
    price: normalizeNumber(ic.price),
    kmDriven: normalizeNumber(ic.kmDriven),
    fuelType: ic.fuelType ?? "Petrol",
    transmission: ic.transmission ?? "Manual",
    owners: normalizeNumber(ic.owners ?? 1),
    location: ic.location ?? "",
    description: ic.description ?? "",
    images: Array.isArray(ic.images) ? [...ic.images] : [],

    // Defaults to match previous behavior
    carStreetsListed: ic.carStreetsListed ?? true,
    isFeatured: ic.isFeatured ?? false,
    availableForFinance: ic.availableForFinance ?? true,
    availableForExchange: ic.availableForExchange ?? true,

    // ✅ ADD THIS - Auto-verify all dealer uploads
    isVerified: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  function handleRemoveImage(idx: number) {
    setForm((f) => ({ ...f, images: (f.images ?? []).filter((_, i) => i !== idx) }));
  }

  function handleSetCover(idx: number) {
    setForm((f) => {
      const current = [...(f.images ?? [])];
      if (idx <= 0 || idx >= current.length) return f;
      const [sel] = current.splice(idx, 1);
      current.unshift(sel);
      return { ...f, images: current };
    });
  }

  function handleChange(e: InputChange) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/dealers/${subdomain}/cars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ ADD isVerified: true to the request
        body: JSON.stringify({ dealerId, isVerified: true, ...form }),
      });
      if (!res.ok) {
        let msg = "Submission failed";
        try {
          const json = await res.json();
          msg = (json?.error as string) || msg;
        } catch {}
        throw new Error(msg);
      }
      setSuccess(true);
      if (onSuccess) onSuccess();
      else setTimeout(
        () => (window.location.href = `/dealers/${subdomain}/dashboard/cars`),
        1500
      );
    } catch (err: any) {
      setError(err?.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }
  const getAvailableModels = () => {
    if (!form.brand) return []
    const brand = carsData.brands[form.brand as keyof typeof carsData.brands]
    return brand ? Object.keys(brand.models) : []
  }
  
  const getAvailableVariants = () => {
    if (!form.brand || !form.model) return []
    const brand = carsData.brands[form.brand as keyof typeof carsData.brands]
    if (!brand) return []
    const model = brand.models[form.model as keyof typeof brand.models] as any
    return model?.variants || []
  }
  
  const getAvailableFuelTypes = () => {
    if (!form.brand || !form.model) return ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"]
    const brand = carsData.brands[form.brand as keyof typeof carsData.brands]
    if (!brand) return ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"]
    const model = brand.models[form.model as keyof typeof brand.models] as any
    return model?.fuel || ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"]
  }
  
  const getAvailableTransmissions = () => {
    if (!form.brand || !form.model) return ["Manual", "Automatic"]
    const brand = carsData.brands[form.brand as keyof typeof carsData.brands]
    if (!brand) return ["Manual", "Automatic"]
    const model = brand.models[form.model as keyof typeof brand.models] as any
    return model?.transmission || ["Manual", "Automatic"]
  }
  
  
  return (
    <div className="max-w-4xl w-full mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
        {ic.id ? "Edit Car Details" : "Add a New Car"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700"
      >
        {error && (
          <div className="md:col-span-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="md:col-span-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg border border-green-200 dark:border-green-800">
            ✅ Car {ic.id ? "updated" : "added"} successfully! Redirecting...
          </div>
        )}

        {/* Core fields */}
        <SearchableSelect
  label="Brand"
  options={Object.keys(carsData.brands)}
  value={form.brand || ''}
  onChange={(value) => {
    setForm(f => ({ ...f, brand: value, model: '', variant: '' }))
  }}
  placeholder="Select or search brand..."
/>

<SearchableSelect
  label="Model"
  options={getAvailableModels()}
  value={form.model || ''}
  onChange={(value) => {
    setForm(f => ({ ...f, model: value, variant: '' }))
  }}
  placeholder={form.brand ? "Select or search model..." : "Select brand first"}
  disabled={!form.brand}
/>

        <FormField label="Year" name="year" value={form.year ?? ""} onChange={handleChange} type="number" required />
        <FormField label="Price" name="price" value={form.price ?? ""} onChange={handleChange} type="number" required />
        <FormField label="KM Driven" name="kmDriven" value={form.kmDriven ?? ""} onChange={handleChange} type="number" required />

        <SearchableSelect
  label="Fuel Type"
  options={getAvailableFuelTypes()}
  value={form.fuelType || ''}
  onChange={(value) => setForm(f => ({ ...f, fuelType: value }))}
  placeholder="Select fuel type..."
/>

<SearchableSelect
  label="Transmission"
  options={getAvailableTransmissions()}
  value={form.transmission || ''}
  onChange={(value) => setForm(f => ({ ...f, transmission: value }))}
  placeholder="Select transmission..."
/>
<SearchableSelect
  label="Variant (Optional)"
  options={getAvailableVariants()}
  value={form.variant || ''}
  onChange={(value) => setForm(f => ({ ...f, variant: value }))}
  placeholder={form.model ? "Select variant..." : "Select model first"}
  disabled={!form.model}
/>

        <FormSelect
          label="No. of Owners"
          name="owners"
          value={form.owners ?? 1}
          onChange={handleChange}
          options={[1, 2, 3, 4, 5]}
        />

        <div className="md:col-span-2">
          <FormField label="Location" name="location" value={form.location ?? ""} onChange={handleChange} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            name="description"
            value={(form.description ?? "") as string}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Image upload */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Car Images (up to 10)
          </label>
          <CldUploadWidget
            uploadPreset="carstreets-unsigned"
            options={{ maxFiles: 10, folder: "carstreets/cars" }}
            onUpload={(result: any) => {
              if (result.event === "success") {
                const url = result.info.secure_url as string;
                setForm((f) => {
                  const next = new Set([...(f.images ?? []), url]);
                  return { ...f, images: Array.from(next) };
                });
              }
            }}
          >
            {({ open }) => (
              <button
                type="button"
                className="mb-3 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  open();
                }}
              >
                Upload from Device
              </button>
            )}
          </CldUploadWidget>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {(form.images ?? []).map((img, i) => (
              <div className="relative group aspect-square cursor-pointer" key={i}>
                {i === 0 && (
                  <span className="absolute left-1 top-1 z-10 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                    Cover
                  </span>
                )}
                <img
                  src={img}
                  alt={`car img ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100 transition"
                  title="Remove"
                  onClick={() => handleRemoveImage(i)}
                >
                  &times;
                </button>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(i)}
                    className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md hover:bg-black/80 transition"
                    title="Set as cover"
                  >
                    Set Cover
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Listing Options (restored) */}
        <div className="md:col-span-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Listing Options</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.carStreetsListed}
                  onChange={(e) => setForm((f) => ({ ...f, carStreetsListed: e.target.checked }))}
                  className="mr-2 w-4 h-4"
                />
                List on CarStreets
              </label>

              <label className="flex items-center text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.isFeatured}
                  onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                  className="mr-2 w-4 h-4"
                />
                Featured Car
              </label>

              <label className="flex items-center text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.availableForFinance}
                  onChange={(e) => setForm((f) => ({ ...f, availableForFinance: e.target.checked }))}
                  className="mr-2 w-4 h-4"
                />
                Finance Available
              </label>

              <label className="flex items-center text-gray-800 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.availableForExchange}
                  onChange={(e) => setForm((f) => ({ ...f, availableForExchange: e.target.checked }))}
                  className="mr-2 w-4 h-4"
                />
                Exchange Accepted
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="md:col-span-2 mt-4 w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg shadow-md hover:bg-blue-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : (ic.id ? "Update Car" : "Submit Car")}
        </button>
      </form>
    </div>
  );
}
