import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { getApiBase } from '../../../core/config/api-config';
import { Warehouse } from '../models/map.models';

interface ListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
}

/** Requires auth — /retail/* is tenant-scoped RBAC, unlike the public /map/* endpoints. */
@Injectable({ providedIn: 'root' })
export class WarehouseService {
  constructor(private http: HttpClient) {}

  listWithCoordinates(): Observable<Warehouse[]> {
    return this.http
      .get<ListResponse<Warehouse>>(`${getApiBase()}/retail/warehouses`, {
        params: { is_enabled: true, limit: 100 },
      })
      .pipe(map((res) => (res.data || []).filter((w) => w.latitude != null && w.longitude != null)));
  }
}
