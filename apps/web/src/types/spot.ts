export interface Spot {
  id: string;
  name: string;
  category: string;
  address: string;
  description: string | null;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  distanceMeters: number;
}
