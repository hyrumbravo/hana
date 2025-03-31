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
  private baseUrl = 'http://18.139.82.238:5984/audit-logs'; // Updated endpoint
  private pressStartTime: number | null = null; // Timestamp when the press started
  private longPressThreshold = 20000; // Threshold in milliseconds for considering a press as long press (20 seconds)

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    document.addEventListener('mousedown', this.handlePressStart.bind(this));
    document.addEventListener('keydown', this.handlePressStart.bind(this));
    document.addEventListener('mouseup', this.handlePressEnd.bind(this, 'click'));
    document.addEventListener('keyup', this.handlePressEnd.bind(this, 'keydown'));
  }

  private handlePressStart(event: Event) {
    this.pressStartTime = new Date().getTime();
  }

  private handlePressEnd(eventType: string, event: Event) {
    if (this.pressStartTime) {
      const duration = new Date().getTime() - this.pressStartTime;
      this.pressStartTime = null; // Reset the start time

      if (duration < this.longPressThreshold) {
        this.handleEvent(eventType, event);
      }
    }
  }

  private handleEvent(eventType: string, event: Event) {
    const target = event.target as HTMLElement;
    let detail = '';

    if (eventType === 'click' && target.tagName === 'BUTTON') {
      detail = target.textContent || target.innerText || '';
    } else if (eventType === 'keydown' && (event as KeyboardEvent).key) {
      detail = (event as KeyboardEvent).key;
    }

    // Determine the userId from local storage
    const userId = localStorage.getItem('userID');

    // Determine the module from the URL
    const urlSegments = this.router.url.split('/');
    const module = urlSegments[urlSegments.length - 1];

    // Other details
    const action = eventType;
    const timestamp = new Date().toISOString();

    const logEntry = { userId, action, timestamp, module, detail };

    // Logging the details to the console
    console.log(`User: ${userId}, Module: ${module}, Action: ${action}, Detail: ${detail}, Timestamp: ${timestamp}`);

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
