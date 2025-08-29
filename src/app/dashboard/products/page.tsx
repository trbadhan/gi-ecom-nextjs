"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { startProgress, stopProgress } from "@/lib/progress";
import ToggleSwitch from "@/components/ToggleSwitch";
import { MdEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";

type Product = {
  id: number;
  name: string;
  description: string;
  category_id: number | null;
  images: string[];
  options: { label: string; price: number }[];
  is_active: boolean;
};

type Category = {
  id: number;
  name: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);

  async function loadProducts() {
    const res = await apiFetch("/products", { method: "GET" });
    setProducts(res);
  }

  async function loadCategories() {
    const res = await apiFetch("/categories", { method: "GET" });
    setCategories(res);
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startProgress();

    try {
      if (editingId) {
        await apiFetch(`/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            name,
            description,
            category_id: categoryId,
            options: [{ label: "Default", price }],
          }),
        });
      } else {
        await apiFetch(`/products`, {
          method: "POST",
          body: JSON.stringify({
            name,
            description,
            category_id: categoryId,
            options: [{ label: "Default", price }],
          }),
        });
      }
      setName("");
      setDescription("");
      setCategoryId(null);
      setPrice(null);
      setEditingId(null);
      await loadProducts();
    } finally {
      stopProgress();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    await apiFetch(`/products/${id}`, { method: "DELETE" });
    await loadProducts();
  }

  function handleEdit(p: Product) {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description);
    setCategoryId(p.category_id);
    setPrice(p.options?.[0]?.price ?? null);
  }

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Left side: Products list */}
      <div className="col-span-8 bg-white rounded shadow">
        <div className="border-b border-blue-400 px-4 py-3 font-bold text-lg text-gray-500">
          Products
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-center">Price</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">
                  {categories.find((c) => c.id === p.category_id)?.name ?? "-"}
                </td>
                <td className="px-4 py-2 text-center">
                  {p.options?.[0]?.price ?? "-"}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end items-center space-x-3">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-blue-400 cursor-pointer"
                    >
                      <MdEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-400 cursor-pointer"
                    >
                      <AiOutlineDelete size={18} />
                    </button>
                    <ToggleSwitch
                      enabled={p.is_active}
                      onChange={(value) =>
                        apiFetch(`/products/${p.id}`, {
                          method: "PUT",
                          body: JSON.stringify({ is_active: value }),
                        }).then(loadProducts)
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right side: Product form */}
      <div className="col-span-4">
        <div className="bg-white rounded shadow">
          <div className="border-b border-blue-400 px-4 py-3 font-bold text-lg text-gray-500">
            {editingId ? "Edit Product" : "Add Product"}
          </div>
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded p-2"
                required
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded p-2"
              />
              <select
                value={categoryId ?? ""}
                onChange={(e) =>
                  setCategoryId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full border rounded p-2"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Price"
                value={price ?? ""}
                onChange={(e) =>
                  setPrice(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full border rounded p-2"
              />
              <button
                type="submit"
                className="w-full bg-blue-400 text-white py-2 rounded hover:bg-blue-500"
              >
                {editingId ? "Update" : "Save"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
