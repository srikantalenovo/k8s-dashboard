import React, { useState } from "react";

const ResourceTable = ({ resources }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredResources = resources.filter((resource) =>
    Object.values(resource).some(
      (value) =>
        typeof value === "string" &&
        value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="bg-white rounded-2xl shadow p-4 border border-gray-200">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search resources..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredResources.length === 0 ? (
        <p className="text-gray-500 text-sm">No matching resources found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-800">
            <thead className="bg-gray-100 text-xs uppercase font-medium text-gray-600">
              <tr>
                {Object.keys(filteredResources[0] || {}).map((key) => (
                  <th key={key} className="px-4 py-2">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((res, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-200 hover:bg-blue-50 transition"
                >
                  {Object.values(res).map((val, i) => (
                    <td key={i} className="px-4 py-2 whitespace-nowrap">
                      {typeof val === "string" || typeof val === "number" ? (
                        <span className="text-gray-700">{val}</span>
                      ) : (
                        <span className="text-gray-500 italic">N/A</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResourceTable;
