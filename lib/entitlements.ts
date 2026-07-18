export const FREE_PLAN_VEHICLE_LIMIT = 1;
export const PRO_PLAN_VEHICLE_LIMIT = 5;

export function getVehicleLimit(isProMember: boolean): number {
  return isProMember ? PRO_PLAN_VEHICLE_LIMIT : FREE_PLAN_VEHICLE_LIMIT;
}

export function canAddVehicleForPlan(
  currentVehicleCount: number,
  isProMember: boolean
): boolean {
  return currentVehicleCount < getVehicleLimit(isProMember);
}
