import React, { useState } from "react";

const ResourceTable = ({ data = [], type }) => {
  const [search, setSearch] = useState("");

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <input
        type="text"
        placeholder="Search resources..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
      />
      {filteredData.length === 0 ? (
        <div className="text-sm text-gray-400">No matching resources found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-white">
            <thead className="bg-gray-800 text-blue-300">
              <tr>
                {Object.keys(filteredData[0] || {}).map((header) => (
                  <th key={header} className="px-4 py-2 capitalize">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-700 transition-all border-b border-gray-700"
                >
                  {Object.values(item).map((value, i) => (
                    <td key={i} className="px-4 py-2 text-gray-200">
                      {String(value)}
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
