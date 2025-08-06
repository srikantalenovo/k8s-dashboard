// src/pages/AnalyzerView/HealthSummary/ResourceTable.js
import React from "react";
import { AlertTriangle } from "lucide-react";

const badgeColor = {
  pod: "bg-red-100 text-red-600",
  job: "bg-yellow-100 text-yellow-600",
  node: "bg-orange-100 text-orange-700",
  deployment: "bg-pink-100 text-pink-600",
};

const ResourceTable = ({ title, items, type }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-6 border rounded-xl shadow-sm p-4 bg-white">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        {title}
        <span
          className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium ${badgeColor[type] || "bg-gray-200 text-gray-600"}`}
        >
          {items.length} Issues
        </span>
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-3 py-2 border-b">Name</th>
              <th className="px-3 py-2 border-b">Namespace</th>
              <th className="px-3 py-2 border-b">Reason/Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const metadata = item.metadata || {};
              let reason = "-";

              if (type === "pod") {
                const status = item.status?.containerStatuses?.find(cs => cs.state?.waiting);
                reason = status?.state?.waiting?.reason || "-";
              } else if (type === "job") {
                reason = `Failed: ${item.status?.failed || 0}`;
              } else if (type === "node") {
                const condition = item.status?.conditions?.find(c => c.type === "Ready");
                reason = condition?.status === "False" ? "NotReady" : condition?.status;
              } else if (type === "deployment") {
                reason = `Ready: ${item.status?.readyReplicas || 0} / ${item.status?.replicas || 0}`;
              }

              return (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b">{metadata.name}</td>
                  <td className="px-3 py-2 border-b">{metadata.namespace || "N/A"}</td>
                  <td className="px-3 py-2 border-b">{reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResourceTable;
