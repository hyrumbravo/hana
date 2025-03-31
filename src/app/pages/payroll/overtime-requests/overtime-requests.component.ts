import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { NgbDate, NgbDateStruct, NgbCalendar, NgbDateParserFormatter, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { Store } from '@ngrx/store';
import { AppState } from '@/store/state';
import { PayrollService } from '@services/payroll/payroll.service';
import { TimelogsService } from '@services/timelogs/timelogs.service';
import { BakcEndService } from '@/bakc-end.service';

@Component({
  selector: 'app-overtime-requests',
  templateUrl: './overtime-requests.component.html',
  styleUrls: ['./overtime-requests.component.scss']
})
export class OvertimeRequestsComponent implements OnInit {
  @ViewChild('adminOvertimeModal') adminOvertimeModal: any;

  pageSize: number = 10;
  pageIndex: number = 0;
  displayedColumns: string[] = [
    'date',
    'employeeId',
    'employeeName',
    'overtimeHours',
    'status',
    'overtimePay',
    'action'
  ];
  

  filterbyDay: boolean = true;
  dateFilter: NgbDateStruct;
  today: NgbDateStruct;
  overtime: any[] = [];
  allOvertime: any[] = [];
  selectedStatus: string | null = null; 

  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;
  hoveredDate: NgbDate | null = null;

  overtimeRequests: any[] = [];
  allRequests: any[] = [];
  loading = false;
  validationError = false;

  approvalStatus: string = '';
  approvedBy: string = '';
  selectedOvertime: any;
  employeeRates: { id_no: string, monthlyRate: number }[] = [];

  darkMode: boolean;

  constructor(
    private modalService: NgbModal,
    private calendar: NgbCalendar,
    private toastr: ToastrService,
    public formatter: NgbDateParserFormatter,
    public payrollService: PayrollService,
    private timelogsService: TimelogsService,
    private backendService: BakcEndService,
    private store: Store<AppState>
  ) {
    const today = new Date();
    this.dateFilter = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
    this.today = this.calendar.getToday();
    this.fromDate = this.calendar.getToday();  // Default to today
    this.toDate = this.calendar.getNext(this.fromDate, 'd', 30);  // Default range
  }

  ngOnInit(): void {
    this.store.select('ui').subscribe((state) => {
      this.darkMode = state.darkMode;
    });

    this.allOvertime = [];
    this.overtime = [...this.allOvertime];
    this.loadOvertimeRequests();
    this.clearDateFilter();
  }

  openAdminModal(data: any): void {
    this.selectedOvertime = {
      _id: data.doc._id,
      _rev: data.doc._rev,
      employee_id: data.doc.employee_id,
      employeeName: data.doc.employee_name,
      designation: data.doc.designation,
      date: data.doc.date,
      timeIn: data.doc.timeIn,
      timeOut: data.doc.timeOut,
      overtimeHours: data.doc.overtimeRequest?.overtime,
      reason: data.doc.overtimeRequest?.reason
    };
    this.approvalStatus = '';
    this.approvedBy = '';

    this.modalService.open(this.adminOvertimeModal, { centered: true, backdrop: false, keyboard: false });
  }

  submitApproval(): void {
    this.validationError = false;

    if (!this.approvalStatus) {
      this.validationError = true;
      this.toastr.warning('Please select an approval status.');
      return;
    }
    if (!this.approvedBy.trim()) {
      this.validationError = true;
      this.toastr.warning('Please enter the name of the person approving or rejecting the request.');
      return;
    }
  
    this.timelogsService.getTimelogById(this.selectedOvertime._id).subscribe(
      (existingTimelog: any) => {
        // Fetch the employee rates to get the monthly rate
        this.backendService.getEmployeeRates().subscribe(
          (rates) => {
            // Find the monthly rate for the current employee
            const employeeRate = rates.find(rate => rate.id_no === existingTimelog.employee_id);
            const monthlyRate = employeeRate ? employeeRate.monthlyRate : 0;
  
            if (monthlyRate <= 0) {
              console.warn('Invalid monthlyRate detected for employee:', existingTimelog.employee_id);
            }
  
            // Calculate overtimePay
            const overtimePay = this.approvalStatus === 'Declined' 
              ? 0 
              : this.calculateOvertimePay(existingTimelog.employee_id, existingTimelog.overtimeRequest?.overtime, monthlyRate);
  
            console.log('Overtime Pay being used in submitApproval:', overtimePay);
  
            const updatedRequest = {
              ...existingTimelog,
              overtimeRequest: {
                ...existingTimelog.overtimeRequest,
                status: this.approvalStatus,
                overtimePay: overtimePay,
                approvedBy: this.approvedBy.trim()
              }
            };
  
            console.log('Updated Request before saving:', updatedRequest);
  
            this.timelogsService.updateTimelog(existingTimelog._id, updatedRequest).subscribe(
              () => {
                this.toastr.success('Overtime request has been processed successfully.');
                this.modalService.dismissAll();
                this.loadOvertimeRequests();
              },
              (error) => {
                console.error('Error response:', error);
                this.toastr.error('Error processing overtime request.');
              }
            );
          },
          (error) => {
            console.error('Error fetching employee rates:', error);
            this.toastr.error('Error fetching employee rates.');
          }
        );
      },
      (error) => {
        this.toastr.error('Error fetching the existing timelog.');
      }
    );
  }

  loadOvertimeRequests(): void {
    this.loading = true;
    this.timelogsService.getTimelogs().subscribe(
      (data: any) => {
        this.allRequests = data.rows;
        this.overtimeRequests = this.allRequests
          .filter(request => request.doc.overtimeRequest?.status === 'Pending')
          .reverse();
        this.loadOvertimePay();
        this.loading = false;
      },
      (error) => {
        this.toastr.error('Error fetching overtime requests.');
        this.loading = false;
      }
    );
  }
   

  loadOvertimePay(): void {
    this.backendService.getEmployeeRates().subscribe(
      (rates) => {
        this.employeeRates = rates; // Store the rates
        this.overtimeRequests.forEach(request => {
          const employeeId = request.doc.employee_id;
          const overtimeHours = request.doc.overtimeRequest?.overtime;
          const employeeRate = this.employeeRates.find(rate => rate.id_no === employeeId);
          const monthlyRate = employeeRate ? employeeRate.monthlyRate : 0;
          const pay = this.calculateOvertimePay(employeeId, overtimeHours, monthlyRate);
          request.doc.overtimeRequest.overtimePay = pay; // Store the calculated pay in the request
        });
      },
      (error) => {
        console.error('Error in fetching employee rates:', error);
      }
    );
  }  
  
  calculateOvertimePay(employeeId: string, overtime: string, monthlyRate: number): number {
    console.log('Employee ID:', employeeId);
    console.log('Monthly Rate:', monthlyRate);
  
    if (monthlyRate <= 0) {
      console.warn('Invalid input detected - Monthly Rate is zero or negative.');
      return 0; // Return 0 if the input is invalid
    }
  
    const overtimeParts = overtime.match(/(\d+)\s*(hours?|h|minutes?|m)/gi);
    let totalHours = 0;
  
    if (overtimeParts) {
      overtimeParts.forEach(part => {
        const value = parseInt(part);
        if (part.includes('hour') || part.includes('h')) {
          totalHours += value || 0; // Convert hours to numeric and add
        } else if (part.includes('minute') || part.includes('m')) {
          totalHours += (value || 0) / 60; // Convert minutes to fractional hours and add
        }
      });
    }
  
    console.log('Parsed Overtime Hours:', totalHours);
  
    if (totalHours <= 0) {
      console.warn('Invalid input detected - Overtime Hours is zero or negative.');
      return 0; // Return 0 if inputs are invalid
    }
  
    const ratePerHour = (monthlyRate / 22) / 8; // Assuming 22 workdays/month, 8 hours/day
    const pay = totalHours * ratePerHour;
    console.log('Calculated Pay:', pay);
    return parseFloat(pay.toFixed(2)); // Return the numeric value directly
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
  
  filterPayroll() {
    // Clear filtered overtimeRequests initially
    this.overtimeRequests = [];
  
    // Check if filter is by day or by range
    if (this.filterbyDay && this.dateFilter) {
      // Filter by single day with pending status
      this.overtimeRequests = this.allRequests.filter(request => {
        const requestDate = new Date(request.doc.date);
        return (
          request.doc.overtimeRequest?.status === 'Pending' &&
          requestDate.getFullYear() === this.dateFilter.year &&
          requestDate.getMonth() + 1 === this.dateFilter.month &&
          requestDate.getDate() === this.dateFilter.day
        );
      });
    } else if (!this.filterbyDay && this.fromDate && this.toDate) {
      // Filter by date range with pending status
      this.overtimeRequests = this.allRequests.filter(request => {
        const requestDate = new Date(request.doc.date);
        const fromDate = new Date(this.fromDate.year, this.fromDate.month - 1, this.fromDate.day);
        const toDate = new Date(this.toDate.year, this.toDate.month - 1, this.toDate.day, 23, 59, 59); // Include the entire day
  
        // Include only pending requests that fall within the selected range (inclusive)
        return (
          request.doc.overtimeRequest?.status === 'Pending' &&
          requestDate >= fromDate && requestDate <= toDate
        );
      });
    } else {
      // No date filter is applied; return all pending requests
      this.overtimeRequests = this.allRequests.filter(request =>
        request.doc.overtimeRequest?.status === 'Pending'
      );
    }
  
    // Reload overtime pay calculations if necessary (depends on filtering)
    this.loadOvertimePay();
  }  
  
  clearDateFilter(): void {
    this.dateFilter = null;
    this.fromDate = null;
    this.toDate = null;
    this.selectedStatus = null;
    this.filterPayroll();
  }

  setFilterMode(dayMode: boolean): void {
    this.filterbyDay = dayMode;
    this.clearDateFilter();
  }

  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
      this.filterPayroll(); // Apply filter on date range selection
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
}
