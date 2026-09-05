import { Home, Package, Smartphone, Truck, Warehouse } from "lucide-react";
import { FULFILLMENT_STEPS } from "@/components/marketing/marketing-fixtures";
import { FlowDiagram } from "@/components/marketing/visual/flow-diagram";

const FLOW_STEPS = [
  { icon: Smartphone, title: FULFILLMENT_STEPS[0].title },
  { icon: Warehouse, title: FULFILLMENT_STEPS[1].title, detail: "Centralized ops" },
  { icon: Package, title: FULFILLMENT_STEPS[2].title, detail: "Overnight pick + pack" },
  { icon: Truck, title: FULFILLMENT_STEPS[3].title, detail: "Carrier handoff" },
  { icon: Home, title: FULFILLMENT_STEPS[4].title, detail: "Fan doorstep" },
];

export function FulfillmentSteps() {
  return <FlowDiagram steps={FLOW_STEPS} direction="horizontal" />;
}
