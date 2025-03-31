import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbModal, NgbDateStruct, NgbCalendar, NgbDate, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import moment from 'moment';
import { Store } from '@ngrx/store';
import { AppState } from '@/store/state';
import Swal from 'sweetalert2';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { ProfileService } from '@services/profile/profile.service';
import { BakcEndService } from '@/bakc-end.service';
import { PayrollService } from '@services/payroll/payroll.service';
import { TimelogsService } from '@services/timelogs/timelogs.service';

@Component({
  selector: 'app-employee-payslip',
  templateUrl: './employee-payslip.component.html',
  styleUrls: ['./employee-payslip.component.scss']
})
export class EmployeePayslipComponent implements OnInit {
  @ViewChild('pdfIframe') pdfIframe: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  pageSize: number = 10;   
  pageIndex: number = 0;
  displayedColumns: string[] = [
    'payrollNumber',
    'payrollType',
    'payrollPeriod',
    'grossPay',
    'deductions',
    'netPay',
    'action'
  ];

  // For Date Range
	hoveredDate: NgbDate | null = null;
	fromDate: NgbDate | null;
	toDate: NgbDate | null;
  dateFilter: NgbDateStruct;
  filterbyDay:boolean = true;
  today: NgbDateStruct;
  loading = false;
  isEditId: boolean = false;

  // profile-card
  idNo: string = '';
  userName: string = '';
  designation: string = '';
  userId: string | null = null;
  imageUrl: string;
  form: FormGroup

  employeeId: string; 
  filteredPayslips = new MatTableDataSource<any>([]);
  payroll = []
  employeeRates: any[] = [];
  allRequests: any[] = [];

  darkMode: boolean;

  constructor(
    private calendar: NgbCalendar,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private datePipe: DatePipe,
    private http: HttpClient,
    public formatter: NgbDateParserFormatter,
    private cdr: ChangeDetectorRef,
    private backendService: BakcEndService,
    private profileService: ProfileService,
    public payrollService: PayrollService,
    private timelogsService: TimelogsService,
    private store: Store<AppState>
  ) {
    this.today = this.calendar.getToday();
   }

  ngOnInit(): void {
    this.store.select('ui').subscribe((state) => {
      this.darkMode = state.darkMode;
    });
    
    this.clearDateFilter();
    this.loadUserDetails(); 
  }

  ngAfterViewInit(): void {
    this.filteredPayslips.paginator = this.paginator;
  }

  loadUserDetails(): void {
    this.loading = true;
    this.timelogsService.loadUserDetails().subscribe(
      (response) => {
        const employeeId = response.id_no;
        this.idNo = response.id_no;
        this.userName = response.userName;
        this.designation = response.designation;
        this.loadUserPayslips(employeeId);
        this.setValues(response)
        this.loading = false; 
      },
      (error) => {
        this.toastr.error('Error fetching user details.');
        this.loading = false;
      }
    );
  }

  loadUserPayslips(employeeId: string): void {
    this.backendService.getPayrollData().subscribe(
      (data) => {
        if (data && Array.isArray(data)) {
          const allEmployeePayslips = data
            .reduce((acc, payrollDoc) => {
              const updatedEmployees = (payrollDoc.employees || []).map((employee) => ({
                ...employee,
                payrollType: payrollDoc.payrollType,
                dateFrom: payrollDoc.dateFrom,
                dateTo: payrollDoc.dateTo,
              }));
              return acc.concat(updatedEmployees);
            }, [])
            .filter((employee) => employee.employeeId === employeeId);
  
          this.payroll = allEmployeePayslips; // Store raw data
          this.filteredPayslips.data = allEmployeePayslips; // Update MatTableDataSource
        } else {
          console.error('No valid data found in response:', data);
        }
      },
      (error) => {
        console.error('Error fetching payroll data:', error);
      }
    );
  }    

  setValues(data: any) {
    // console.log('Data received:', data._attachements);
    if (data && data._attachments) {
      if ('profilePic' in data._attachments) {
        this.http.get(environment.globalUrl + `/employees/${data._id}/profilePic`, {
          responseType: 'blob',
          headers: {
            'Authorization': 'Basic ' + btoa('admin:h@n@')
          }
        })
        .toPromise()
        .then(response => {
          const blobUrl = URL.createObjectURL(response);
          this.imageUrl = blobUrl;  // Set the image URL
        })
        .catch(error => {
          console.error('Error loading profile image:', error);
          this.imageUrl = '/assets/img/default-profile.png';
        });
      } else {
        this.imageUrl = '/assets/img/default-profile.png';
      }
    } else {
      this.imageUrl = '/assets/img/default-profile.png';
    }
  }
  
  refresh(): void {
    this.loading = true;
    this.loadUserDetails();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  filterPayslips() {
    if (!this.fromDate && !this.toDate && !this.dateFilter) {
      this.filteredPayslips.data = [...this.payroll]; // Reset the filter
      return;
    }
  
    if (this.filterbyDay && this.dateFilter) {
      const selectedDate = moment({
        year: this.dateFilter.year,
        month: this.dateFilter.month - 1, // Moment.js months are 0-based
        day: this.dateFilter.day,
      }).startOf('day');
  
      this.filteredPayslips.data = this.payroll.filter((payslip) => {
        const payslipDate = moment(payslip.dateFrom).startOf('day');
        return selectedDate.isSame(payslipDate); // Match exact day
      });
    } else if (this.fromDate && this.toDate) {
      const fromDate = moment({
        year: this.fromDate.year,
        month: this.fromDate.month - 1,
        day: this.fromDate.day,
      }).startOf('day');
  
      const toDate = moment({
        year: this.toDate.year,
        month: this.toDate.month - 1,
        day: this.toDate.day,
      }).endOf('day');
  
      this.filteredPayslips.data = this.payroll.filter((payslip) => {
        const payslipStartDate = moment(payslip.dateFrom).startOf('day');
        const payslipEndDate = moment(payslip.dateTo).endOf('day'); // Ensure inclusive range

        return (
          payslipStartDate.isBetween(fromDate, toDate, undefined, '[]') || // Starts within range
          payslipEndDate.isBetween(fromDate, toDate, undefined, '[]') ||  // Ends within range
          (payslipStartDate.isBefore(fromDate) && payslipEndDate.isAfter(toDate)) // Overlaps the range
        );
      });
    }
  }
    

  clearDateFilter(): void {
    this.dateFilter = null;
    this.fromDate = null;
    this.toDate = null;
    this.filteredPayslips.data = [...this.payroll];
  }
  
  setFilterMode(dayMode: boolean): void {
    this.filterbyDay = dayMode;
  }

  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
      this.filterPayslips(); // Apply filter on date range selection
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
  
  handleSinglePrint(data: any) {
    this.payrollService.printSinglePayslip(data);
  }
}