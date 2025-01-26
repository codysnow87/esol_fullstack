"use client";

import React, { useState, useEffect } from 'react';

type Item = {
  id: number;
  name: string;
};

export default function ItemsList() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/resources', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}: ${response.statusText}`);
        }

        const data: Item[] = await response.json();
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Filter items based on the `filter` state
  const filteredItems = items.filter(({ name }) =>
    name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return <p>Loading items...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md bg-white rounded-md shadow-md p-6">
        <h1 className="text-black text-2xl font-bold mb-4">My Items</h1>

        {/* Filter Input */}
        <div className="mb-4">
          <label htmlFor="filterInput" className="block mb-2 font-semibold text-gray-700">
            Filter by name:
          </label>
          <input
            id="filterInput"
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-black border border-gray-300 rounded-md p-2 w-full"
            placeholder="Type a name..."
          />
        </div>

        {/* Filtered Items List */}
        <ul className="space-y-3">
          {filteredItems.map(({ id, name }) => (
            <li
              key={id}
              className="border border-gray-200 p-3 rounded-md shadow-sm bg-gray-50"
            >
              <div className="font-semibold mb-1">ID: {id}</div>
              <div className="text-gray-700">Name: {name}</div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
