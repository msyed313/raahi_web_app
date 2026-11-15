import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DriverStatus } from './driver-auth.service';
import { DriverDocInfo, DriverDocType, DriverJobs, DriverProfile, UpdateDriverProfile } from '../drivermodels';

const BASE = `${environment.apiUrl}/api/driver/me`;

@Injectable({ providedIn: 'root' })
export class DriverApiService {
  private readonly http = inject(HttpClient);

  profile(): Observable<DriverProfile> {
    return this.http.get<DriverProfile>(BASE);
  }

  updateProfile(body: UpdateDriverProfile): Observable<DriverProfile> {
    return this.http.put<DriverProfile>(BASE, body);
  }

  uploadDoc(type: DriverDocType, file: File): Observable<DriverDocInfo> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<DriverDocInfo>(`${BASE}/docs/${type}`, form);
  }

  docUrl(type: DriverDocType): string {
    return `${BASE}/docs/${type}`;
  }

  submit(): Observable<DriverProfile> {
    return this.http.post<DriverProfile>(`${BASE}/submit`, {});
  }

  setOnline(online: boolean): Observable<DriverProfile> {
    return this.http.post<DriverProfile>(`${BASE}/online`, { online });
  }

  jobs(): Observable<DriverJobs> {
    return this.http.get<DriverJobs>(`${BASE}/jobs`);
  }

  accept(id: number): Observable<void> {
    return this.http.post<void>(`${BASE}/jobs/${id}/accept`, {});
  }

  decline(id: number, reason: string | null): Observable<void> {
    return this.http.post<void>(`${BASE}/jobs/${id}/decline`, { reason });
  }

  start(id: number): Observable<void> {
    return this.http.post<void>(`${BASE}/jobs/${id}/start`, {});
  }

  complete(id: number): Observable<void> {
    return this.http.post<void>(`${BASE}/jobs/${id}/complete`, {});
  }
}