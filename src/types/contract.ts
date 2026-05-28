export interface Contract {
  id: string;

  contract_number: string;
  contract_name: string;
  contract_object?: string;

  contractor_entity?: string;
  contracting_entity?: string;

  manager_name?: string;
  supervisor_name?: string;

  status: string;

  initial_value: number;

  management_fee_percentage: number;
  management_fee_value: number;
  goods_services_value: number;

  executed_value: number;

  physical_progress: number;
  financial_progress: number;

  start_date?: string;
  end_date?: string;

  risk_level?: string;

  created_at: string;
  updated_at: string;
}