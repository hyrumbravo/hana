import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private baseUrl = '/api/audit-logs'; // Adjust to your CouchDB endpoint

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    document.addEventListener('click', this.handleClick.bind(this));
  }

  private handleClick(event: Event) {
    const target = event.target as HTMLElement;

    if (target.tagName === 'BUTTON' ||
        (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') ||
        (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'submit')) {

      // Determine the userId from local storage
      const userId = localStorage.getItem('userID');

      // Determine the module from the URL
      const urlSegments = this.router.url.split('/');
      const module = urlSegments[urlSegments.length - 1];

      // Other details
      const action = 'click';
      const timestamp = new Date().toISOString();

      const logEntry = { userId, action, timestamp, module };

      // Logging the details to the console
      console.log(`User: ${userId}, Module: ${module}, Action: ${action}, Timestamp: ${timestamp}`);

      // Send logEntry to CouchDB
      const headers = new HttpHeaders()
        .set('Authorization', `Basic ${btoa('admin:h@n@')}`)
        .set('Content-Type', 'application/json');

      this.http.post(this.baseUrl, logEntry, { headers })
        .pipe(
          tap(response => console.log('Audit log saved successfully', response)),
          catchError(error => {
            console.error('Failed to save audit log', error);
            return of(null); // Return an observable to complete the pipeline
          })
        )
        .subscribe();
    }
  }
}
