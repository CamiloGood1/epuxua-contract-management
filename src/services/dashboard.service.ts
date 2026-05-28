import { getContracts } from "./contracts.service";

export async function getDashboardMetrics() {
  const contracts = await getContracts();

  const totalContracts = contracts.length;

  const inProgressContracts = contracts.filter(
    (contract) => contract.status === "in_progress"
  ).length;

  const liquidationContracts = contracts.filter(
    (contract) => contract.status === "liquidation"
  ).length;

  const totalValue = contracts.reduce(
    (acc, contract) => acc + Number(contract.initial_value),
    0
  );

  return {
    totalContracts,
    inProgressContracts,
    liquidationContracts,
    totalValue,
  };
}