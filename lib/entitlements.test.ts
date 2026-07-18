import { describe, expect, it } from 'vitest';
import {
  canAddVehicleForPlan,
  FREE_PLAN_VEHICLE_LIMIT,
  getVehicleLimit,
  PRO_PLAN_VEHICLE_LIMIT,
} from './entitlements';

describe('vehicle entitlements', () => {
  it('limits free users to one vehicle', () => {
    expect(getVehicleLimit(false)).toBe(FREE_PLAN_VEHICLE_LIMIT);
    expect(canAddVehicleForPlan(0, false)).toBe(true);
    expect(canAddVehicleForPlan(1, false)).toBe(false);
  });

  it('limits Pro users to five vehicles', () => {
    expect(getVehicleLimit(true)).toBe(PRO_PLAN_VEHICLE_LIMIT);
    expect(canAddVehicleForPlan(4, true)).toBe(true);
    expect(canAddVehicleForPlan(5, true)).toBe(false);
  });
});
