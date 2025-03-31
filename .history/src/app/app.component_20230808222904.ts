import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuditLogService } from './path-to-your-service/audit-log.service'; // Adjust the path accordingly

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private auditLogService: AuditLogService, private router: Router) {} // Inject the Router

  ngOnInit() {
    document.addEventListener('click', this.handleClick.bind(this));
  }

  private handleClick(event: Event) {
    const target = event.target as HTMLElement;

    // Check if the clicked element is a button, an input of type "text", or a submit input
    if (target.tagName === 'BUTTON' || 
        (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') || 
        (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'submit')) {

      // Determine the userId from local storage
      const userId = localStorage.getItem('userID'); // Adjust as needed

      // Determine the module from the URL
      const urlSegments = this.router.url.split('/');
      const module = urlSegments[urlSegments.length - 1];

      // Other details
      const action = 'click';
      const timestamp = new Date().toISOString();

      this.auditLogService.logAction(userId, action, timestamp, module);
    }
  }
}
