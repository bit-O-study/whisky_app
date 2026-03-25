export interface LiquorDto {
  id: number;
  productCode?: string;
  product_code?: string;
  name: string;
  brand: string;
  category: string;
  volume: number;
  alcoholPercent?: number;
  alcohol_percent?: number;
  country: string;
  currentPrice?: number;
  current_price?: number;
  originalPrice?: number;
  original_price?: number;
  imageUrl?: string;
  image_url?: string;
  productUrl?: string;
  product_url?: string;
  source: string;
}

export interface LiquorPageDto {
  items: LiquorDto[];
  page: number;
  size: number;
  hasNext: boolean;
}

export type LiquorListDto = LiquorDto[];
