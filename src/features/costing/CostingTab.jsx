import IngredientsManagementPanel from './IngredientsManagementPanel';
import ItemProfitabilityReport from './ItemProfitabilityReport';
import ProductionCostPanel from './ProductionCostPanel';
import RecipeBuilderPanel from './RecipeBuilderPanel';

export function CostingTab({ menuItems = [], notify }) {
  return (
    <div className="space-y-6">
      <IngredientsManagementPanel notify={notify} />
      <RecipeBuilderPanel menuItems={menuItems} notify={notify} />
      <ProductionCostPanel notify={notify} />
      <ItemProfitabilityReport notify={notify} />
    </div>
  );
}

export default CostingTab;
