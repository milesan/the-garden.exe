export interface Accommodation {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  type: string;
  beds: number;
  bathrooms: number;
  superhost: boolean;
}