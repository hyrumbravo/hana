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
  private baseUrl = 'http://18.139.82.238:5984/api/audit-logs'; // Updated endpoint

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    // Attach event listeners for click and keydown events
    document.addEventListener('click', this.handleEvent.bind(this, 'click'));
    document.addEventListener('keydown', this.handleEvent.bind(this, 'keydown'));
  }

  private handleEvent(eventType: string, event: Event) {
    // Determine the userId from local storage
    const userId = localStorage.getItem('userID');

    // Determine the module from the URL
    const urlSegments = this.router.url.split('/');
    const module = urlSegments[urlSegments.length - 1];

    // Other details
    const action = eventType;
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
