"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { startProgress, stopProgress } from "@/lib/progress";
import ToggleSwitch from "@/components/ToggleSwitch";
import { MdDoubleArrow, MdEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
// import CategoryList from "@/components/CategoryList";

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  is_active: boolean;
  order: number;
  total_products?: number; // 👈 added in case API gives this
  children?: Category[];
};

// export default function CategoriesPage() {
//   return (
//     <div className="p-6">
//       <h1 className="text-xl font-bold mb-4">Categories</h1>
//       <CategoryList />
//     </div>
//   );
// }

export default function CategoriesPage() {
  const [editing, setEditing] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [highlightId, setHighlightId] = useState<number | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [order, setOrder] = useState<number | null>(null);
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
        // 🔥 EDIT
        await apiFetch(`/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            name,
            parent_id: parentId || null,
            order: order || null,
          }),
        });
        setSuccess(`Category "${name}" updated successfully ✅`);

        // ✅ do NOT reset name/parentId/order when editing
        // just reload categories
        await loadCategories();
      } else {
        // 🔥 ADD
        const newCat = await apiFetch("/categories", {
          method: "POST",
          body: JSON.stringify({
            name,
            parent_id: parentId || null,
            order: order || null,
          }),
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

        // ✅ reset only after adding
        setName("");
        setParentId(null);
        setOrder(null);

        await loadCategories();
      }
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
    setOrder(cat.order); // 👈 prefill sorting value
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
      const isSubCategory = cat.parent_id !== null;

      rows.push(
        <tr
          key={cat.id}
          className={`${highlightId === cat.id ? "animate-pulse bg-green-50" : ""}
                      ${cat.is_active ? "text-gray-800" : "text-gray-400"}`}
        >
          {/* Category Name */}
          <td className="px-4 py-2">
            <div
              className="flex items-center gap-2"
              style={{ paddingLeft: level * 16 }}
            >
              {isSubCategory && <MdDoubleArrow className="text-xs" />}
              {cat.name}
            </div>
          </td>

          {/* Category Sorting */}
          <td className="px-4 py-2 text-center">
            {!isSubCategory ? cat.order : ""}
          </td>

          {/* Sub-Category Sorting */}
          <td className="px-4 py-2 text-center">
            {isSubCategory ? cat.order : ""}
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
        walk(cat.children, level + 1);
      }
    });
  }

  walk(cats);

  return (
    <table className="w-full border-collapse text-sm ">
      <thead className="bg-gray-50 border-b border-gray-300">
        <tr className="text-gray-700">
          <th className="px-4 py-2 text-left w-1/4">Category Name</th>
          <th className="px-4 py-2 text-center w-1/6">Category Sorting</th>
          <th className="px-4 py-2 text-center w-1/6">Sub-Category Sorting</th>
          <th className="px-4 py-2 text-center w-1/6">Total Products</th>
          <th className="px-4 py-2 text-right w-1/4">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">{rows}</tbody>
    </table>
  );
}


  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Left side: Category List */}
      <div className="col-span-8 bg-white rounded shadow">
        <div className="border-b border-blue-400 px-4 py-3 bg-white font-bold text-lg text-gray-500">
          Categories
        </div>
        <div className="p-0">{renderTree(categories)}</div>
      </div>

      {/* Right side: Category Form */}
      <div className="col-span-4">
        <div className="bg-white rounded shadow">
          <div className="border-b border-blue-400 px-4 py-3 bg-white flex items-center justify-between">
            <span
              className={`font-bold text-lg text-gray-500 transition-opacity duration-300 ${
                editing ? "opacity-100" : "opacity-90"
              }`}
            >
              {editing ? `Edit Category: ${editCategory?.name}` : "Add Category"}
            </span>

            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setEditCategory(null);
                  setName("");
                  setParentId(null);
                  setOrder(null);
                  setEditing(false);
                }}
                className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition-all duration-300 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-100 hover:border-gray-200 focus:border-gray-400 outline-none placeholder:text-sm rounded p-2"
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">
                  Sorting
                  {/* {parentId ? "Sub-Category Sorting" : "Category Sorting"} */}
                </label>
                <input
                  type="number"
                  value={order ?? ""}
                  onChange={(e) => setOrder(e.target.value ? Number(e.target.value) : null)}
                  className="w-full border border-gray-100 hover:border-gray-200 focus:border-gray-400 outline-none placeholder:text-sm rounded p-2"
                  placeholder={parentId ? "Enter sub-category sorting" : "Enter category sorting"}
                />
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">
                  Parent Category (optional)
                </label>
                <select
                  value={parentId ?? ""}
                  onChange={(e) =>
                    setParentId(e.target.value ? Number(e.target.value) : null)
                  }
                  disabled={editCategory?.children && editCategory.children.length > 0} // 👈 disable if has children
                  className={`w-full border border-gray-100 hover:border-gray-200 focus:border-gray-400 outline-none rounded p-2 text-sm ${
                    editCategory?.children && editCategory.children.length > 0
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <option value="">None (Main Category)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                {editCategory?.children && editCategory.children.length > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    This category has sub-categories, so it cannot be moved under another parent.
                  </p>
                )}
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
