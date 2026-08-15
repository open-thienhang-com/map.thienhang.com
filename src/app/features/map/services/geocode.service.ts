import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { GeocodeResult } from '../models/map.models';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * No in-house geocoder exists yet (the /map API only does NER extraction, not
 * lat/lng lookup) — this calls the public OSM Nominatim service, restricted to
 * Vietnam, as a stand-in. Nominatim's usage policy caps this at ~1 req/sec and
 * disallows heavy/production traffic; swap for a paid provider or self-hosted
 * Nominatim before this sees real load.
 */
@Injectable({ providedIn: 'root' })
export class GeocodeService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  search(query: string): Observable<GeocodeResult[]> {
    const params = new URLSearchParams({
      format: 'json',
      countrycodes: 'vn',
      addressdetails: '0',
      limit: '5',
      q: query,
    });
    return this.http.get<NominatimResult[]>(`${this.baseUrl}?${params.toString()}`).pipe(
      map((results) =>
        results.map((r) => ({
          displayName: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        }))
      )
    );
  }
}
