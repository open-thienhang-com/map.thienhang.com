import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { MapService } from '../../services/map.service';
import { GeocodeService } from '../../services/geocode.service';
import { WarehouseService } from '../../services/warehouse.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AddressExtractData, GeocodeResult, Warehouse } from '../../models/map.models';

const VIETNAM_CENTER: L.LatLngTuple = [16.5, 106.0];
const DEFAULT_ZOOM = 6;

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './map-page.component.html',
  styleUrl: './map-page.component.css',
})
export class MapPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef<HTMLDivElement>;

  private map!: L.Map;
  private searchMarker: L.Marker | null = null;
  private warehouseMarkers: L.LayerGroup = L.layerGroup();

  searchText = '';
  searching = false;
  searchError = '';
  extraction: AddressExtractData | null = null;
  geocodeResult: GeocodeResult | null = null;

  showWarehouses = false;
  warehousesLoading = false;
  warehousesError = '';

  constructor(
    private mapService: MapService,
    private geocodeService: GeocodeService,
    private warehouseService: WarehouseService,
    public auth: AuthService
  ) {}

  ngAfterViewInit(): void {
    this.map = L.map(this.mapContainerRef.nativeElement).setView(VIETNAM_CENTER, DEFAULT_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);
    this.warehouseMarkers.addTo(this.map);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  search(): void {
    const text = this.searchText.trim();
    if (!text || this.searching) return;

    this.searching = true;
    this.searchError = '';
    this.extraction = null;
    this.geocodeResult = null;

    this.mapService.extractAddress(text).subscribe({
      next: (res) => {
        this.extraction = res.data;
      },
      error: () => {
        // Extraction is best-effort context; geocoding below still runs.
      },
    });

    this.geocodeService.search(text).subscribe({
      next: (results) => {
        this.searching = false;
        if (!results.length) {
          this.searchError = 'Không tìm thấy địa chỉ này.';
          return;
        }
        this.geocodeResult = results[0];
        this.dropPin(results[0]);
      },
      error: () => {
        this.searching = false;
        this.searchError = 'Không thể tra cứu địa chỉ lúc này. Vui lòng thử lại.';
      },
    });
  }

  private dropPin(result: GeocodeResult): void {
    if (this.searchMarker) {
      this.map.removeLayer(this.searchMarker);
    }
    this.searchMarker = L.marker([result.lat, result.lng])
      .addTo(this.map)
      .bindPopup(escapeHtml(result.displayName))
      .openPopup();
    this.map.setView([result.lat, result.lng], 15);
  }

  toggleWarehouses(): void {
    if (!this.showWarehouses) {
      this.showWarehouses = true;
      this.loadWarehouses();
    } else {
      this.showWarehouses = false;
      this.warehouseMarkers.clearLayers();
    }
  }

  private loadWarehouses(): void {
    this.warehousesLoading = true;
    this.warehousesError = '';
    this.warehouseService.listWithCoordinates().subscribe({
      next: (warehouses) => this.renderWarehouses(warehouses),
      error: (err) => {
        this.warehousesLoading = false;
        this.warehousesError =
          err.status === 401 || err.status === 403
            ? 'Bạn cần đăng nhập để xem điểm giao/kho hàng.'
            : 'Không tải được dữ liệu điểm giao/kho hàng.';
      },
    });
  }

  private renderWarehouses(warehouses: Warehouse[]): void {
    this.warehousesLoading = false;
    this.warehouseMarkers.clearLayers();
    for (const w of warehouses) {
      const marker = L.marker([w.latitude, w.longitude], {
        icon: L.divIcon({
          className: 'warehouse-marker',
          html: '📦',
          iconSize: [24, 24],
        }),
      }).bindPopup(
        `<strong>${escapeHtml(w.name)}</strong><br>${escapeHtml(w.location || w.district_name || '')} ${escapeHtml(w.province_name || '')}`
      );
      this.warehouseMarkers.addLayer(marker);
    }
  }
}

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}
