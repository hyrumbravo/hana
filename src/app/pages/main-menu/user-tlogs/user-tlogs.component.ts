import { Component, OnInit, OnDestroy  } from '@angular/core';
import { BakcEndService } from '@/bakc-end.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-user-tlogs',
  templateUrl: './user-tlogs.component.html',
  styleUrls: ['./user-tlogs.component.scss']
})
export class UserTLogsComponent implements OnInit, OnDestroy {
  loading = false;
  logs = [];
  users = [];
  hasInitialized = false;
  dtOptions: any;
  dtTrigger: Subject<any> = new Subject<any>();
  // Filter Variables
  dateToday = new Date()
  filterType: string = 'byDate'; // default filter type
  filterDate: string = new Date().toISOString().split('T')[0]; // current date by default
  startDate: string;
  endDate: string;

  constructor(
    private service: BakcEndService,
    private router: Router
  ) {

  }

  ngOnInit(): void {
    this.loading = true;
    
    this.getUsers();
    
    this.dtOptions = {
      autoWidth: false,
      language: {
        search: '',
        searchPlaceholder: 'Search',
        lengthMenu: 'Show _MENU_ entries'
      },
      pageLength: 10,
      ordering: false,
      paging: true,
      dom: 'frtip',
      drawCallback: (settings) => {
        this.hasInitialized = true;
        // console.log('DataTable initialization complete');
      }
    };
    this.applyFilter(); // Apply default filter by today's date
    
    
  }
  
  ngOnDestroy(): void {
    // Unsubscribe from the dtTrigger to prevent memory leaks
    this.dtTrigger.unsubscribe();
  }

  getUsers(){
    this.service.allUsers().subscribe((r) => {
      this.users = r.rows
      // console.log('users: ', this.users);
    })
  }
  
   // Apply Filter based on Filter Type and Dates
  applyFilter() {
    this.loading = true;
    const dummyData = {
      value: {
        timestamp: new Date().toISOString(),
        module: "N/A",
        action: "No data available",
        details: "No logs available for the selected date."
      }
    };
  
    if (this.filterType === 'byDate') {
      // Use the filterDate for a single day filter
      this.service.getFilteredLogsByDate(this.filterDate).subscribe((r) => {
        this.logs = r.rows.length > 0 ? r.rows : [dummyData];
        this.loading = false;
        this.reinitializeDataTable(); // Reinitialize DataTable with new data
      });
    } else if (this.filterType === 'byDateRange') {
      // Use startDate and endDate for a date range filter
      this.service.getFilteredLogsByDateRange(this.startDate, this.endDate).subscribe((r) => {
        this.logs = r.rows.length > 0 ? r.rows : [dummyData];
        this.loading = false;
        this.reinitializeDataTable(); // Reinitialize DataTable with new data
      });
    }
  }

  getLogs(){
    this.loading = true;
    this.logs = []
      this.service.getfilteredLogs().subscribe(
        (response) => {
          // console.log('API Response:', response); // Log the full response
          this.logs = response.rows; // If `response.rows` is undefined or empty, check API response structure
          // console.log('t-logs', this.logs);
          this.loading = false;
        },
        (error) => {
          console.error('Error fetching logs:', error);
          this.loading = false;
        }
      );
      
  }
  
  reinitializeDataTable() {
    
    if (this.hasInitialized) {
      // Destroy DataTable instance and reset it
      $('#dataTable').DataTable().clear().destroy();
    }
    setTimeout(() => {
      this.dtTrigger.next(null);
    });
    this.hasInitialized = true;
  }
  
  // Handle filter type change
  onFilterTypeChange() {
    this.applyFilter(); // Apply the filter whenever the filter type changes
  }

  refresh(){
    window.location.reload();
  }

  getUserName(id){
    var data = this.users.find((u) => u.id == id)
    return data ? `${data.doc.lastName}, ${data.doc.firstName} ${data.doc.middleName}` : 'Not Found'
  }

  reloadRoute() {
    this.loading = true;
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/UserTLogs', { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(currentUrl);
      this.loading = false;
    });
  }

}
