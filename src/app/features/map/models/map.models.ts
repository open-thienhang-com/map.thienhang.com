export interface AddressEntity {
  label: string; // CITY | DISTRICT | WARD | STREET | HOUSE_NUMBER | PLACE_NAME
  text: string;
  score: number;
  source: string; // bert | gazetteer-exact | gazetteer-fuzzy
}

export interface AddressLevel {
  key: string; // city | district | ward | street | house_number | place_name | other
  label: string;
  label_vi: string;
  entities: AddressEntity[];
}

export interface AddressExtractData {
  text: string;
  canonical: string;
  entities: AddressEntity[];
  levels: AddressLevel[];
  steps?: unknown;
}

export interface AddressExtractResponse {
  success: boolean;
  message: string;
  data: AddressExtractData | null;
}

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
}

export interface Warehouse {
  warehouse_id?: string;
  name: string;
  location?: string;
  province_name?: string;
  district_name?: string;
  latitude: number;
  longitude: number;
  is_enabled?: boolean;
}
