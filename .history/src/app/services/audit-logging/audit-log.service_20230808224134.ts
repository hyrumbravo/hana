import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private baseUrl = 'http://localhost:5984/auditlogs'; // Adjust to your CouchDB endpoint
  private headers = new HttpHeaders()
    .set('Authorization', `Basic ${btoa('admin:h@n@')}`)
    .set('Content-Type', 'application/json');

  constructor(private http: HttpClient) {}

  logAction(userId: string, action: string, timestamp: string, module: string) {
    const logEntry = { userId, action, timestamp, module };

    // Send logEntry to CouchDB
    this.http.post(this.baseUrl, logEntry, { headers: this.headers })
      .pipe(
        tap(response => {
          console.log('Audit log saved successfully', response);
        }),
        catchError(error => {
          console.error('Failed to save audit log', error);
          return of(null); // Return an observable to complete the pipeline
        })
      )
      .subscribe();
  }
}
