// import HealthSummary from './HealthSummary';
// // Future: import CostAnalysis from './CostAnalysis';

// const AnalyzerView = () => {
//   const [activeTab, setActiveTab] = useState('health');

//   return (
//     <Box>
//       <Tabs value={activeTab} onChange={(e, newVal) => setActiveTab(newVal)}>
//         <Tab label="Health" value="health" />
//         {/* Future: <Tab label="Cost" value="cost" /> */}
//       </Tabs>

//       <Box mt={2}>
//         {activeTab === 'health' && <HealthSummary />}
//         {/* Future: {activeTab === 'cost' && <CostAnalysis />} */}
//       </Box>
//     </Box>
//   );
// };


// src/pages/AnalyzerView/index.js

//import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HealthSummary from './HealthSummary';
//import CostAnalysis from './CostAnalysis'; // Future

export default function AnalyzerView() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="health" />} />
      <Route path="/health" element={<HealthSummary />} />
     {/* <Route path="/cost" element={<CostAnalysis />} /> */}
    </Routes>
  );
}
