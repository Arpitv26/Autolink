export type BuildItemStatus = 'planned' | 'ordered' | 'installed';

export type BuildSummary = {
  id: string;
  userId: string;
  vehicleId: string;
  title: string;
  description: string;
  isPublic: boolean;
  isActive: boolean;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
};

export type BuildItem = {
  id: string;
  buildId: string;
  catalogPartId: string;
  category: string;
  partName: string;
  brand: string;
  price: number;
  notes: string;
  sortOrder: number;
  positionX: number;
  positionY: number;
  status: BuildItemStatus;
  createdAt: string;
};
