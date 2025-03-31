import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private baseUrl = '/api/audit-logs'; // Adjust to your API endpoint

  constructor(private http: HttpClient) {}

  logAction(userId: string, action: string, timestamp: string, module: string) {
    const logEntry = { userId, action, timestamp, module }; // Removed targetDocumentId

    // Send logEntry to your backend
    this.http.post(this.baseUrl, logEntry)
      .pipe(
        tap(response => {
          console.log('Audit log saved successfully', response);
          // Additional logic for handling success, if needed
        }),
        catchError(error => {
          console.error('Failed to save audit log', error);
          // Additional logic for handling errors, if needed
          return of(null); // Return an observable to complete the pipeline
        })
      )
      .subscribe();
  }
}
