"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { startProgress, stopProgress } from "@/lib/progress";
import ToggleSwitch from "@/components/ToggleSwitch";
// import { Pencil, Trash2 } from "lucide-react";
import { MdDoubleArrow, MdEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  is_active: boolean;
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

  async function loadCategories() {
    const res = await apiFetch("/categories", { method: "GET" });
    setCategories(res);
  }

  useEffect(() => {
    loadCategories();
  }, []);

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

    // 🔥 update both parent + children immediately
    setCategories((prev) => updateCategoryTree(prev, id, enabled));
  } catch (err) {
    console.error("Failed to toggle category", err);
  }
}


function updateCategoryTree(cats: Category[], id: number, enabled: boolean): Category[] {
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

  // Flatten categories + subcategories into single list
  function renderTree(cats: Category[]) {
    const rows: React.ReactNode[] = [];

    function walk(catList: Category[]) {
      catList.forEach((cat) => {
        rows.push(
          <li
            key={cat.id}
            className={`border-b border-gray-200 px-4 py-2 bg-white
                      ${highlightId === cat.id ? "animate-pulse bg-green-50" : ""}
                      ${cat.is_active ? "text-gray-800" : "text-gray-400"}
                    `}
          >
            <div className="flex items-center justify-between">
              {/* Left: name */}
              <span
                className={`${
                  cat.parent_id ? "font-normal pl-8 flex items-center gap-2" : "font-normal flex items-center gap-2"
                }`}
              >
                {cat.parent_id && (
                  <MdDoubleArrow className="text-xs" />
                )}
                {cat.name}
              </span>
              {/* <span className={cat.parent_id ? "font-normal pl-8" : "font-normal"}>
                {cat.parent_id && <MdDoubleArrow />} {cat.name}                
              </span> */}

              {/* Right: actions */}
              <div className="flex space-x-3 text-sm">
                <button
                  onClick={() => handleEdit(cat)}
                  className="text-blue-500 hover:underline" title="Edit"
                >                  
                  <MdEdit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-red-600 hover:underline" title="Delete"
                >
                  <AiOutlineDelete size={18} />
                </button>
                {/* Toggle switch */}
                <ToggleSwitch
                  enabled={cat.is_active} // you need is_active in your API
                  onChange={(value) => handleToggle(cat.id, value)}
                />
              </div>
            </div>
          </li>
        );

        // keep recursing, but still push to flat rows (not nested)
        if (cat.children && cat.children.length > 0) {
          walk(cat.children);
        }
      });
    }

    walk(cats);

    return <ul className="space-y-0">{rows}</ul>;
  }

  return (
    <div className="grid grid-cols-12 gap-6">
  {/* Left side: Category List */}
  <div className="col-span-8 bg-white rounded shadow">
    {/* Title bar */}
    <div className="border-b px-4 py-3 bg-gray-50 font-semibold text-gray-800">
      Categories
    </div>

    {/* List */}
    <div className="p-0">
      {renderTree(categories)}
    </div>
  </div>

  {/* Right side: Category Form */}
  <div className="col-span-4 bg-white rounded shadow">
    {/* Title bar */}
    <div className="border-b px-4 py-3 bg-gray-50 font-semibold text-gray-800">
      {editing ? `Edit Category: ${editCategory?.name}` : "Add Category"}
    </div>

    {/* Form */}
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
          <label className="block text-sm font-medium mb-1">Parent Category (optional)</label>
          <select
            value={parentId ?? ""}
            onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
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
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {editing ? "Update Category" : "Save Category"}
        </button>
      </form>
    </div>
  </div>
</div>

  );
}
