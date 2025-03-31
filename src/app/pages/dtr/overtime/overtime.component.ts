import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { NgbDateStruct, NgbCalendar, NgbDateParserFormatter, NgbModal, NgbDate, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { PayrollService } from '@services/payroll/payroll.service';
import { TimelogsService } from '@services/timelogs/timelogs.service';
import { ToastrService } from 'ngx-toastr';
import { Store } from '@ngrx/store';
import { AppState } from '@/store/state';

@Component({
  selector: 'app-overtime',
  templateUrl: './overtime.component.html',
  styleUrls: ['./overtime.component.scss']
})
export class OvertimeComponent implements OnInit {
  @ViewChild('overtimeModal') overtimeModal: TemplateRef<any>;
  @ViewChild('dpFromDate') dpFromDate: NgbInputDatepicker;
  @ViewChild('dpToDate') dpToDate: NgbInputDatepicker;
  @ViewChild('datepicker') datepicker: NgbInputDatepicker;
  
  pageSize: number = 10;
  pageIndex: number = 0;
  displayedColumns: string[] = [
    'date', 
    'timeIn', 
    'timeOut', 
    'overtime', 
    'overtimePay', 
    'status', 
    'action'
  ];

  today: NgbDateStruct;
  overtimeRequests: any[] = [];
  filteredOvertimeRequests: any[] = [];
  selectedStatus: string | null = null;

  filterbyDay = true;
  dateFilter: NgbDateStruct | null = null;

  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;
  hoveredDate: NgbDate | null = null;

  dtOptions: DataTables.Settings = {};
  imageUrl: string = '/assets/img/default-profile.png'; // Default avatar
  isEditId = false;
  userName = '';
  designation = '';
  idNo = '';
  loading = false;
  
  selectedOvertime: any;
  requestReason = '';
  isSubmitted = false;
  isViewMode = false;
  isSelectingFromDate = true;

  darkMode: boolean;

  constructor(
    private modalService: NgbModal,
    private calendar: NgbCalendar,
    private toastr: ToastrService,
    public formatter: NgbDateParserFormatter,
    private payrollService: PayrollService,
    private timelogsService: TimelogsService,
    private store: Store<AppState>
  ) {
    this.today = this.calendar.getToday();
  }

  ngOnInit(): void {
    this.store.select('ui').subscribe((state) => {
      this.darkMode = state.darkMode;
    });
    
    this.loadUserDetails();
    this.loadOvertimeRequests();
  }

  ngAfterViewInit(): void {
    this.loadUserDetails();
    this.loadOvertimeRequests();
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

  loadOvertimeRequests(): void {
    this.timelogsService.getTimelogs().subscribe(
      (data: any) => {
        this.overtimeRequests = data.rows
          .filter(request => {
            if (request.doc.employee_id === this.idNo && request.doc.overtime && request.doc.overtime !== '0 minutes') {
              const overtimeParts = request.doc.overtime.match(/(\d+)\s*(hours?|h|minutes?|m)/gi);
              let totalMinutes = 0;
  
              if (overtimeParts) {
                overtimeParts.forEach(part => {
                  const value = parseInt(part);
                  if (part.includes('hour') || part.includes('h')) {
                    totalMinutes += (value || 0) * 60; // Convert hours to minutes
                  } else if (part.includes('minute') || part.includes('m')) {
                    totalMinutes += value || 0; // Add minutes directly
                  }
                });
              }
              return totalMinutes > 30;
            }
            return false;
          })
          .reverse();
          
        this.applyClientFilters();
        this.loading = false;
      },
      (error) => {
        this.toastr.error('Error fetching overtime requests.');
        this.loading = false;
      }
    );
  }

  openModal(data: any, viewMode: boolean = false): void {
    this.isViewMode = viewMode;
    this.selectedOvertime = {
      ...data.doc,
      overtimeRequest: data.doc.overtimeRequest || {}
    };
    if (!viewMode) {
      this.requestReason = '';
    }
    this.modalService.open(this.overtimeModal, { centered: true, backdrop: false, keyboard: false });
  }

  submitRequest() {
    this.isSubmitted = true;
    if (!this.requestReason.trim()) {
      this.toastr.warning('Please enter a reason for the request.');
      return;
    }
    this.timelogsService.getTimelogById(this.selectedOvertime._id).subscribe(
      (existingTimelog) => {
        const updatedTimelog = {
          ...existingTimelog,
          overtimeRequest: {
            overtime: this.selectedOvertime.overtime,
            status: 'Pending',
            reason: this.requestReason.trim()
          }
        };
        this.timelogsService.createTimelog(updatedTimelog).subscribe(
          () => {
            this.toastr.success('Overtime request submitted successfully!');
            this.modalService.dismissAll();
            this.loadOvertimeRequests();
          },
          (error) => {
            this.toastr.error('Error submitting overtime request.');
          }
        );
      },
      (error) => {
        this.toastr.error('Error fetching existing timelog.');
      }
    );
  }


  isLate(timeIn: string): boolean {
    return this.timelogsService.isLate(timeIn);
  }

  setFilterMode(dayMode: boolean): void {
    this.filterbyDay = dayMode;
    this.clearDateFilter();
  }

  clearDateFilter(): void {
    this.dateFilter = null;
    this.fromDate = null;
    this.toDate = null;
    this.selectedStatus = null;
    this.applyClientFilters();
  }

  applyClientFilters(): void {
    this.filteredOvertimeRequests = this.overtimeRequests
      .filter(this.filterByStatus.bind(this))
      .filter(this.filterByDate.bind(this));
  }

  private filterByStatus(request: any): boolean {
    if (this.selectedStatus === 'null') {
      return true;
    }
    return this.selectedStatus ? request.doc.overtimeRequest?.status === this.selectedStatus : true;
  }
  
  private filterByDate(request: any): boolean {
    const date = request.doc.date;
    if (this.filterbyDay && this.dateFilter) {
      return this.isSameDay(date, this.dateFilter);
    } else if (!this.filterbyDay && this.fromDate && this.toDate) {
      return this.isWithinRange(date, this.fromDate, this.toDate);
    }
    return true;
  }
  
  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
  
  isSameDay(dateString: string, selectedDate: NgbDateStruct): boolean {
    const [year, month, day] = dateString.split('-').map(Number);
    return (
      year === selectedDate.year &&
      month === selectedDate.month &&
      day === selectedDate.day
    );
  }

  isWithinRange(dateString: string, fromDate: NgbDateStruct, toDate: NgbDateStruct): boolean {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const from = new Date(fromDate.year, fromDate.month - 1, fromDate.day);
    const to = new Date(toDate.year, toDate.month - 1, toDate.day);
    return date >= from && date <= to;
  }

  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
      this.applyClientFilters(); // Apply filter on date range selection
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
  }
  
  isHovered(date: NgbDate) {
    return this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);
  }
  
  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }
  
  isRange(date: NgbDate) {
    return date.equals(this.fromDate) || (this.toDate && date.equals(this.toDate)) || this.isInside(date) || this.isHovered(date);
  }
  
  toggleDatepicker() {
    if (this.datepicker) {
      this.datepicker.toggle();
    } else {
      console.error('Datepicker is not initialized');
    }
  }
}