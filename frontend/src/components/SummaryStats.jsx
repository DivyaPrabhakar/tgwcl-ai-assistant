import React from "react";
import { Shirt, Package, Calendar, DollarSign } from "lucide-react";
import StatCard from "./StatCard";
import ActiveFormulaDisplay from "./ActiveFormulaDisplay";

const SummaryStats = ({ data, showActiveFormula, onToggleActiveFormula }) => {
  const activeFormulaContent = (
    <ActiveFormulaDisplay
      activeStatusesConfig={data.activeItems?.activeStatusesConfig}
      isVisible={showActiveFormula}
    />
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Active Items"
        value={data.activeItems?.totalCount || 0}
        icon={Shirt}
        subtitle="Ready to wear"
        color="blue"
        helpContent={activeFormulaContent}
        onToggleHelp={onToggleActiveFormula}
      />
      <StatCard
        title="Total Outfits"
        value={data.analytics?.totalOutfits || 0}
        icon={Package}
        subtitle="Combinations logged"
        color="green"
      />
      <StatCard
        title="Usage Entries"
        value={data.analytics?.totalUsageEntries || 0}
        icon={Calendar}
        subtitle="Wears tracked"
        color="purple"
      />
      <StatCard
        title="Total Investment"
        value={`$${data.costAnalysis?.totalInvestment?.toLocaleString() || 0}`}
        icon={DollarSign}
        subtitle="Wardrobe value"
        color="yellow"
      />
    </div>
  );
};

export default SummaryStats;
