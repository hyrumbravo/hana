import { Component, OnInit, ViewChild } from '@angular/core';
import { AppService } from '@services/app.service';
import { TimelogsService } from '@services/timelogs/timelogs.service';
import { ToastrService } from 'ngx-toastr';
import moment from 'moment'; // dependent on system time
import Swal from 'sweetalert2';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Store } from '@ngrx/store';
import { AppState } from '@/store/state';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit{
  @ViewChild(MatPaginator) paginator: MatPaginator;

  pageSize: number = 10;
  pageIndex: number = 0;
  displayedColumns: string[] = [
    'date',
    'timeIn', 
    'timeOut', 
    'late',
    'overtime', 
    'workhours'
  ];

  userId: string | null = null;
  userName: string = '';
  idNo: string = '';
  designation: string = '';
  isEditId: boolean = false;
  imageUrl: string = '/assets/img/default-profile.png'; // Default avatar
  
  allRequests: any[] = [];
  dtOptions: DataTables.Settings = {};
  loading = false; // loading spinner
  
  buttonLabel: string = '';
  lastClickTime: moment.Moment | null = null; // buffer time
  isTimeOut: boolean = false;
  isUpdating:boolean = false;

  darkMode: boolean;
  
  constructor(
    private appService: AppService,
    private timelogsService: TimelogsService,
    private toastr: ToastrService,
    private store: Store<AppState>
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.store.select('ui').subscribe((state) => {
      this.darkMode = state.darkMode;
    });

    this.loadUserDetails();
    this.checkTimelogStatus();
    this.refresh();
  }

  get filteredRequests() {
    return this.allRequests.filter(request => request.doc.employee_id === this.idNo);
  }
    
  // Refresh timelogs
  refresh(): void {
    this.loading = true;
    this.allRequests = []; // filter
    this.timelogsService.getTimelogs().subscribe(
      (data: any) => {
        this.allRequests = data.rows;
        this.loading = false;
        this.checkTimelogStatus();
      },
      (error) => {
        this.loading = false;
        this.toastr.error('Error fetching time logs.');
      }
    );
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  updateButtonLabel(): void {
    this.loading = false;
    if (this.allRequests.length === 0) {
      this.buttonLabel = 'Time In'; // No timelog record, set to 'Time In'
    } else {
      this.buttonLabel = this.isTimeOut ? 'Time In' : 'Time Out';
    }
  }

  checkTimelogStatus(): void {
  const currentDate = moment().format('YYYY-MM-DD');
  this.timelogsService.getTimelogByEmployeeIdAndDate(this.idNo, currentDate).subscribe(
      (existingTimelog) => {
        if (existingTimelog) {
          if (existingTimelog.timeIn && !existingTimelog.timeOut) {
            this.isTimeOut = false; // It means the user is "timed in"
          } else {
            this.isTimeOut = true; // Either no time-in or time-out already exists
          }
        } else {
          this.isTimeOut = true; // Default to showing "Time In"
        }
        this.updateButtonLabel(); // Update the button label based on the state
      },
      (error) => {
        this.toastr.error('Error checking timelog status.');
      }
    );
  }

  toggleTime(): void {
    if (!this.idNo) {
      this.toastr.error('Please enter an Employee ID.');
      return;
    }
    
    const currentDate = moment().format('YYYY-MM-DD'); // Get the current date
    const currentTime = moment(); // Get the current time
    const cutoffTime = moment().hour(17).minute(0).second(0); // 5:00 PM cutoff time
  
    if (this.lastClickTime && currentTime.diff(this.lastClickTime, 'seconds') < 5) {
      this.toastr.error('Please wait before trying again.');
      return;
    }
    this.lastClickTime = currentTime;
    this.timelogsService.getTimelogByEmployeeIdAndDate(this.idNo, currentDate).subscribe(
      (existingTimelog) => {
        if (existingTimelog) {
          if (!existingTimelog.isTimeOut) {
            existingTimelog.timeOut = currentTime.format('hh:mm A'); // Record time-out
            existingTimelog.isTimeOut = true; // Mark as timed out
            const workHours = this.calculateWorkHours(existingTimelog.timeIn, existingTimelog.timeOut);
            const timeOutMoment = moment(existingTimelog.timeOut, 'hh:mm A');
            const overtime = this.calculateOvertime(timeOutMoment.hour(), timeOutMoment.minutes());
            existingTimelog.workhours = workHours;
            existingTimelog.overtime = overtime;
  
            this.timelogsService.updateTimelog(existingTimelog._id, existingTimelog).subscribe(
              () => {
                this.toastr.success('Time Out recorded successfully.');
                this.isTimeOut = true; // Update the component property
                this.updateButtonLabel(); // Update button label
                this.refresh(); // Refresh the UI
              },
              (error) => {
                this.toastr.error('Error updating time log.');
              }
            );
          } else {
            this.checkTimeInRestriction(currentTime, cutoffTime, currentDate);
          }
        } else {
          this.checkTimeInRestriction(currentTime, cutoffTime, currentDate);
        }
      },
      (error) => {
        this.toastr.error('Error checking for existing timelog.');
      }
    );
  }

  createNewTimelog(currentDate: string, currentTime: any): void {
    this.timelogsService.getEmployeeById(this.idNo).subscribe(
      (response) => {
        console.log('Employee ID:', this.idNo);
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

        const timelog = {
          ...employeeData,
          date: currentDate,
          timeIn: currentTime.format('hh:mm A'),
          late: this.calculateLate(currentTime.hour(), currentTime.minutes()), // Calculate lateness
          timeOut: '',
          isTimeOut: false, // New timelog is created with isTimeOut set to false
          overtime: '',
          workhours: '',
          timestamp: currentTime.format('YYYY-MM-DD HH:mm:ss')
        };

        // Save the new timelog with time-in information
        this.timelogsService.createTimelog(timelog).subscribe(
          () => {
            this.toastr.success('Time In recorded successfully.');
            this.isTimeOut = false; // Set component property
            this.updateButtonLabel(); // Update button label
            this.refresh(); // Refresh the UI
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
  }

  loadUserDetails(): void {
    this.timelogsService.loadUserDetails().subscribe(
      (response) => {
        this.idNo = response.id_no;
        this.userName = response.userName;
        this.designation = response.designation;
      },
      (error) => {
        this.toastr.error('Error fetching user details.');
        this.loading = false;
      }
    );
  }

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
  
  calculateWorkHours(timeIn: string, timeOut: string): string {
    const startTime = moment(timeIn, 'hh:mm A'); 
    const endTime = moment(timeOut, 'hh:mm A');
    
    const workDuration = moment.duration(endTime.diff(startTime));
    const workHours = Math.floor(workDuration.asHours());
    const workMinutes = workDuration.minutes();
  
    return `${workHours} hours ${workMinutes} minutes`;
  }

  // ********************** Helper Functions *************************** //
  
  //handle time-in restriction
  private checkTimeInRestriction(currentTime: moment.Moment, cutoffTime: moment.Moment, currentDate: string): void {
    if (currentTime.isSameOrAfter(cutoffTime)) {
      Swal.fire({
        title: 'Time-In Restricted',
        text: 'Employees cannot time-in after 5:00 PM. Please try again tomorrow.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }
    this.createNewTimelog(currentDate, currentTime);
  }
  
  isLate(timeIn: string): boolean {
    return this.timelogsService.isLate(timeIn);
  }

  callNoTimeOut(timeInDate: string, timeOut: string | null | undefined): boolean {
    return this.timelogsService.noTimeOut(timeInDate, timeOut);
  }
}