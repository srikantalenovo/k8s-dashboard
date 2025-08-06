// src/pages/AnalyzerView/index.js
import React, { useState } from "react";
import HealthSummary from "./HealthSummary";
// import CostAnalysis from "./CostAnalysis"; // future feature
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const AnalyzerView = () => {
  const [tab, setTab] = useState("health");

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Analyzer</h2>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="health">Health Summary</TabsTrigger>
          {/* <TabsTrigger value="cost">Cost Analysis</TabsTrigger> */}
        </TabsList>

        <TabsContent value="health">
          <HealthSummary />
        </TabsContent>

        {/* <TabsContent value="cost">
          <CostAnalysis />
        </TabsContent> */}
      </Tabs>
    </div>
  );
};

export default AnalyzerView;
