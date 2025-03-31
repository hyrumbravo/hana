import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuditLogService } from './services/audit-logging/audit-log.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private auditLogService: AuditLogService, private router: Router) {}

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

      // Logging the details to the console
      console.log(`User: ${userId}, Module: ${module}, Action: ${action}, Timestamp: ${timestamp}`);

      this.auditLogService.logAction(userId, action, timestamp, module);
    }
  }
}
