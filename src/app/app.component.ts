import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private baseUrl = environment.globalUrl + '/audit-logs'; // Updated endpoint
  private pressStartTime: number | null = null; // Timestamp when the press started
  private longPressThreshold = 20000; // Threshold in milliseconds for considering a press as long press (20 seconds)

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    document.addEventListener('mousedown', this.handlePressStart.bind(this));
    document.addEventListener('keydown', this.handlePressStart.bind(this));
    document.addEventListener('mouseup', this.handlePressEnd.bind(this, 'click'));
    document.addEventListener('keyup', this.handlePressEnd.bind(this, 'keydown'));
    
    document.addEventListener('click', this.handleGlobalClick.bind(this));
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
  
  // New method to handle global click events
  private handleGlobalClick(event: Event) {
    const target = event.target as HTMLElement;

    // Check if the clicked element is part of the sidebar menu
    if (target.closest('.nav-link')) {
      const menuItemName = target.textContent?.trim(); // Get the text of the clicked menu item
      this.logAudit(menuItemName, 'click');
    }
  }
  
  // Function to log audit data
  private logAudit(menuItemName: string, action: string) {
    const userId = localStorage.getItem('userID');
    const timestamp = new Date().toISOString();
    const details = `has clicked sidebar ${menuItemName || 'an unknown item'} module`;
    const module = "Sidebar module";

    const logEntry = { userId, action, module, timestamp, details };

    // Logging the event to the console
    // console.log(logEntry);

    // Send logEntry to CouchDB
    const headers = new HttpHeaders()
      .set('Authorization', `Basic ${btoa('admin:h@n@')}`)
      .set('Content-Type', 'application/json');

    this.http.post(this.baseUrl, logEntry, { headers })
      .pipe(
        // tap(response => console.log('Audit log saved successfully', response)),
        catchError(error => {
          console.error('Failed to save audit log', error);
          return of(null); // Return an observable to complete the pipeline
        })
      )
      .subscribe();
  }

  private handleEvent(eventType: string, event: Event) {
    const target = event.target as HTMLElement;
    let keypress = '';
    let buttonText = '';

    // Handle click events on buttons
    if (eventType === 'click') {
      const clickedButton = target.closest('button'); // Find the closest BUTTON element
      const clickedIcon = target.closest('i'); // Find the closest ICON element (i.e., <i> tag)
      
      if (clickedButton) {
        buttonText = clickedButton.textContent?.trim() || ''; // Get the button's text content and trim whitespace
      }
      
      // If an icon is clicked, use its title or custom data-action attribute
      if (clickedIcon) {
        buttonText = clickedIcon.getAttribute('title') || clickedIcon.getAttribute('data-action') || '';
      }
    }
    
    // Handle keydown events for capturing keypresses
    if (eventType === 'keydown' && (event as KeyboardEvent).key) {
      keypress = (event as KeyboardEvent).key;
    }
    
    // If both buttonText and keypress are empty, do nothing
    if (!buttonText && !keypress) {
      return; // Exit the function without logging or making a request
    }

    // Determine the userId from local storage
    const userId = localStorage.getItem('userID');

    // Determine the module from the URL
    const urlSegments = this.router.url.split('/');
    const module = urlSegments[urlSegments.length - 1];

    // Other keypresss
    
    const action = eventType;
    const timestamp = new Date().toISOString();
    const details = `has ${buttonText ? `clicked ${buttonText} button` : `pressed ${keypress} key`}`;

    const logEntry = { userId, action, timestamp, module, keypress, details };

    // Logging the keypresss to the console
    // console.log(`User: ${userId}, Module: ${module}, Action: ${action}, keypress: ${keypress}, button: ${buttonText}, Timestamp: ${timestamp}, Details: ${details}`);
    // console.log(logEntry);
    
    // Send logEntry to CouchDB
    const headers = new HttpHeaders()
      .set('Authorization', `Basic ${btoa('admin:h@n@')}`)
      .set('Content-Type', 'application/json');

    this.http.post(this.baseUrl, logEntry, { headers })
      .pipe(
        // tap(response => console.log('Audit log saved successfully', response)),
        catchError(error => {
          console.error('Failed to save audit log', error);
          return of(null); // Return an observable to complete the pipeline
        })
      )
      .subscribe();
  }
}
