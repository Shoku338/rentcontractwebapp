export type Tenant = {
  TenantID: number;
  Firstname: string;
  Lastname: string;
  Phone: string;
  Email: string;
};

export type Contract = {
  ContractId: string;
  ContractStatus: "Active" | "Expired" | "Reserved";
  StartDate: string;
  EndDate: string;
  MonthlyRent: number;
  // This matches the 'tenants(*)' join from your API
  tenants: Tenant;
};

export type Room = {
  RoomID: number;
  RoomName:string;
  ContractId: string | null;
  RoomStatus: string;
};


