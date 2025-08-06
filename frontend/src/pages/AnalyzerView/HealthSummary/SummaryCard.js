import React from "react";

const SummaryCard = ({ title, count }) => {
  return (
    <div className="summary-card">
      <h3>{title}</h3>
      <p>{count}</p>
    </div>
  );
};

export default SummaryCard;
