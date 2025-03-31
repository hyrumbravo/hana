import { Component, OnInit } from '@angular/core';
import { TimelogsService } from '@services/timelogs/timelogs.service';
import { DataTablesModule } from 'angular-datatables';
import { ToastrService } from 'ngx-toastr';
import moment from 'moment'; // dependent on system time
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';

@Component({
  selector: 'app-timelogs',
  templateUrl: './timelogs.component.html',
  styleUrls: ['./timelogs.component.scss']
})
export class TimelogsComponent implements OnInit {
  allRequests: any[] = []; // Array to hold the time log data
  dtOptions: DataTables.Settings = {};
  loading = false; // Flag for showing a loading spinner
  
  currentEmployee: any = {}; 
  currentTimelog: any = {}; 
  timeIn: string = '';
  timeOut: string = '';
  
  constructor(
    private timelogsService: TimelogsService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.refresh();

    // datatables cofig
    this.dtOptions = {
      language: {
        search: '',
        searchPlaceholder: 'Search',
        lengthMenu: 'Show _MENU_ entries'
      },
      ordering: false,
      paging: true,
      pageLength: 10,
      searching: true,
      lengthChange: true,
    };
  }
  
  // refresh timelogs
  refresh(): void {
    this.loading = true;
    this.allRequests = [];
    this.timelogsService.getTimelogs().subscribe(
      (data: any) => {
        this.allRequests = data.rows;
        // console.log('All Requests:', this.allRequests);
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        this.toastr.error('Error fetching time logs.');
      }
    );
  }
  
  // timeIn Logic
  timeInEmployee(): void {
    
    const employeeIdInput = (document.getElementById('employee-id-in') as HTMLInputElement).value;
    if (!employeeIdInput) {
      this.toastr.error('Please enter an Employee ID.');
      return;
    }
    
    const currentDate = moment().format('YYYY-MM-DD');  // Fetch the current date
    this.timelogsService.getTimelogByEmployeeIdAndDate(employeeIdInput, currentDate).subscribe(
      (existingTimelog) => {
        if (existingTimelog && existingTimelog.timeIn) {
          this.toastr.error('Employee has already timed in for today.');
          return;
        }
        this.timelogsService.getEmployeeById(employeeIdInput).subscribe(
          (response) => {
            const employee = response.docs[0];
            if (!employee) {
              this.toastr.error('Employee not found.');
              return;
            }
            const firstName = employee.firstName || 'Unknown';
            const lastName = employee.lastName || 'Unknown';
            const employeeData = {
              employee_id: employee.id_no,
              employee_name: `${firstName} ${lastName}`,
              designation: employee.position_title,
            };
            const currentTime = moment();
            const currentHour = currentTime.hour();
            const timelog = {
              ...employeeData,
              date: currentTime.format('YYYY-MM-DD'),
              timeIn: currentTime.format('hh:mm A'),
              late: this.calculateLate(currentHour, currentTime.minutes()), // late calculation function
              timeOut: '',
              overtime: '',
              workhours: '',
              timestamp: currentTime.format('YYYY-MM-DD HH:mm:ss')
            };
            this.timelogsService.createTimelog(timelog).subscribe(
              () => {
                this.toastr.success('Time In recorded successfully.');
                this.refresh();
              },
              (error) => {
                this.toastr.error('Error saving time log.');
              }
            );
          },
          (error) => {
            this.toastr.error('Error fetching employee data.');
          }
        );
      },
      (error) => {
        this.toastr.error('Error checking for existing timelog.');
      }
    );
  }
  
  // Time Out
  timeOutEmployee(): void {

    const employeeIdInput = (document.getElementById('employee-id-out') as HTMLInputElement).value;
    if (!employeeIdInput) {
      this.toastr.error('Please enter an Employee ID.');
      return;
    }
  
    const currentDate = moment().format('YYYY-MM-DD');  // Fetch the current date
    const currentTime = moment();  // Get the current time for timeOut
    this.timelogsService.getTimelogByEmployeeIdAndDate(employeeIdInput, currentDate).subscribe(
      (existingTimelog) => {
        if (existingTimelog && existingTimelog.timeIn) {
          existingTimelog.timeOut = currentTime.format('hh:mm A'); // Save timeOut as current time
          existingTimelog.overtime = this.calculateOvertime(currentTime.hour(), currentTime.minutes());
          existingTimelog.workhours = this.calculateWorkHours(existingTimelog.timeIn, existingTimelog.timeOut);
  
          this.timelogsService.updateTimelog(existingTimelog._id, existingTimelog).subscribe(
            () => {
              this.toastr.success('Time Out recorded successfully.');
              this.refresh(); // Refresh the datatable
            },
            (error) => {
              this.toastr.error('Error updating time log.');
            }
          );
        } else {
          this.toastr.error('Employee has no record of time in.');
        }
      },
      (error) => {
        this.toastr.error('Error fetching employee time log.');
      }
    );
  }

  // Calculations for late
  calculateLate(hour: number, minutes: number): string {
   
    const morningStartHour = 8; // 8 AM
    const afternoonStartHour = 13; // 1 PM
    const isAfternoon = hour >= 12; // If it's 12 PM or later, it's the afternoon session
    const workStartHour = isAfternoon ? afternoonStartHour : morningStartHour;

    if (hour > workStartHour || (hour === workStartHour && minutes > 0)) {
      const lateMinutes = (hour - workStartHour) * 60 + minutes;
      const lateHours = Math.floor(lateMinutes / 60);
      const remainingMinutes = lateMinutes % 60;

      if (lateHours > 0) {
        return `${lateHours} hours ${remainingMinutes} minutes`;
      }
      return `${remainingMinutes} minutes`;
    }
    return '0 minutes';
  }

  // calculate overtime
  calculateOvertime(currentHour: number, currentMinutes: number): string {
    const workEndHour = 17; // 5 PM
    if (currentHour > workEndHour) {
      const overtimeMinutes = (currentHour - workEndHour) * 60 + currentMinutes;
      const overtimeHours = Math.floor(overtimeMinutes / 60);
      const remainingMinutes = overtimeMinutes % 60;
      return `${overtimeHours} hours ${remainingMinutes} minutes`;
    }
    return '0 minutes'; // No overtime
  }
  
  // calculate total workhours
  calculateWorkHours(timeIn: string, timeOut: string): string {
    const startTime = moment(timeIn, 'hh:mm A'); 
    const endTime = moment(timeOut, 'hh:mm A');
    const workDuration = moment.duration(endTime.diff(startTime));
    const workHours = Math.floor(workDuration.asHours());
    const workMinutes = workDuration.minutes();
  
    return `${workHours} hours ${workMinutes} minutes`;
  }

  isLate(timeIn: string): boolean {
    return this.timelogsService.isLate(timeIn);
  }

  callNoTimeOut(timeInDate: string, timeOut: string | null | undefined): boolean {
    return this.timelogsService.noTimeOut(timeInDate, timeOut);
  }
}