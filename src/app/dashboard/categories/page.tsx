"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { startProgress, stopProgress } from "@/lib/progress";
import ToggleSwitch from "@/components/ToggleSwitch";
import { MdDoubleArrow, MdEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  is_active: boolean;
  total_products?: number; // 👈 added in case API gives this
  children?: Category[];
};

export default function CategoriesPage() {
  const [editing, setEditing] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [highlightId, setHighlightId] = useState<number | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [messageVisible, setMessageVisible] = useState(false);

  async function loadCategories() {
    const res = await apiFetch("/categories", { method: "GET" });
    setCategories(res);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  // 🔥 Auto-clear success/error after 3s
  useEffect(() => {
    if (success || error) {
      setMessageVisible(true);

      const timer = setTimeout(() => {
        setMessageVisible(false); // triggers exit
        setTimeout(() => {
          setSuccess(null);
          setError(null);
        }, 500); // wait for exit
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Save / Update
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      startProgress();

      if (editingId) {
        await apiFetch(`/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ name, parent_id: parentId || null }),
        });
        setSuccess(`Category "${name}" updated successfully ✅`);
      } else {
        const newCat = await apiFetch("/categories", {
          method: "POST",
          body: JSON.stringify({ name, parent_id: parentId || null }),
        });
        setSuccess(
          parentId
            ? `Sub category saved under ${
                categories.find((c) => c.id === parentId)?.name || "Parent"
              } ✅`
            : "Category saved successfully ✅"
        );
        setHighlightId(newCat.id);
        setTimeout(() => setHighlightId(null), 2000);
      }

      setName("");
      setParentId(null);
      setEditingId(null);
      await loadCategories();
    } catch (err: any) {
      setError(err.message || "Failed to save category");
    } finally {
      stopProgress();
    }
  }

  // Edit
  function handleEdit(cat: Category) {
    setEditingId(cat.id);
    setName(cat.name);
    setParentId(cat.parent_id);
    setEditCategory(cat);
    setEditing(true);
  }

  // Delete
  async function handleDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    await apiFetch(`/categories/${id}`, { method: "DELETE" });
    await loadCategories();
  }

  // Toggle Enable/Disable
  async function handleToggle(id: number, enabled: boolean) {
    try {
      await apiFetch(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: enabled }),
      });

      setCategories((prev) => updateCategoryTree(prev, id, enabled));
    } catch (err) {
      console.error("Failed to toggle category", err);
    }
  }

  function updateCategoryTree(
    cats: Category[],
    id: number,
    enabled: boolean
  ): Category[] {
    return cats.map((c) => {
      if (c.id === id) {
        return { ...c, is_active: enabled };
      }
      if (c.children && c.children.length > 0) {
        return { ...c, children: updateCategoryTree(c.children, id, enabled) };
      }
      return c;
    });
  }

  // Flatten categories + subcategories into table rows
  function renderTree(cats: Category[]) {
    const rows: React.ReactNode[] = [];

    function walk(catList: Category[], level = 0) {
      catList.forEach((cat) => {
        rows.push(
          <tr
            key={cat.id}
            className={`${highlightId === cat.id ? "animate-pulse bg-green-50" : ""}
                        ${cat.is_active ? "text-gray-800" : "text-gray-400"}`}
          >
            {/* Category Name */}
            <td className="px-4 py-2">
              <div className={`flex items-center gap-2`} style={{ paddingLeft: level * 16 }}>
                {cat.parent_id && <MdDoubleArrow className="text-xs" />}
                {cat.name}
              </div>
            </td>

            {/* Total Products */}
            <td className="px-4 py-2 text-center">
              {cat.total_products ?? 0}
            </td>

            {/* Actions */}
            <td className="px-4 py-2">
              <div className="flex justify-end items-center space-x-3">
                <button
                  onClick={() => handleEdit(cat)}
                  className="text-blue-400 cursor-pointer"
                  title="Edit"
                >
                  <MdEdit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-red-400 cursor-pointer"
                  title="Delete"
                >
                  <AiOutlineDelete size={18} />
                </button>
                <ToggleSwitch
                  enabled={cat.is_active}
                  onChange={(value) => handleToggle(cat.id, value)}
                />
              </div>
            </td>
          </tr>
        );

        if (cat.children && cat.children.length > 0) {
          walk(cat.children, level + 1); // 👈 indent subcategories
        }
      });
    }

    walk(cats);

    return (
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 border-b border-gray-300">
          <tr className="text-gray-700 font-semibold">
            <th className="px-4 py-2 text-left w-1/2">Category Name</th>
            <th className="px-4 py-2 text-center w-1/4">Total Products</th>
            <th className="px-4 py-2 text-right w-1/4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">{rows}</tbody>
      </table>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left side: Category List */}
      <div className="col-span-8 bg-white rounded shadow">
        <div className="border-b border-blue-400 px-4 py-3 bg-white font-bold text-lg text-gray-500">
          Categories
        </div>
        <div className="p-0">{renderTree(categories)}</div>
      </div>

      {/* Right side: Category Form */}
      <div className="col-span-4">
        <div className="bg-white rounded shadow h-[280px] overflow-y-auto">
          <div className="border-b px-4 py-3 bg-gray-50 font-bold text-gray-800">
            {editing ? `Edit Category: ${editCategory?.name}` : "Add Category"}
          </div>

          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Enter category name"
                  required
                />
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Parent Category (optional)
                </label>
                <select
                  value={parentId ?? ""}
                  onChange={(e) =>
                    setParentId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full border rounded p-2"
                >
                  <option value="">None (Main Category)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-400 text-white py-2 rounded hover:bg-blue-500 cursor-pointer"
              >
                {editing ? "Update Category" : "Save Category"}
              </button>
            </form>
          </div>
        </div>

          {/* ✅ Success / Error Messages under the card */}
          {success && (
            <div
              className={`mt-3 p-2 rounded bg-green-100 text-green-700 text-sm shadow
                transform transition-all duration-500 ease-in-out
                ${messageVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}`}
            >
              {success}
            </div>
          )}

          {error && (
            <div
              className={`mt-3 p-2 rounded bg-red-100 text-red-700 text-sm shadow
                transform transition-all duration-500 ease-in-out
                ${messageVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}`}
            >
              {error}
            </div>
          )}
      </div>
    </div>
  );
}
