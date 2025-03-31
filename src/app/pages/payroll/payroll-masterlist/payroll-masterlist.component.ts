import { Component, ElementRef, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NgbDateStruct, NgbCalendar, NgbDate, NgbDateParserFormatter, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { DataTableDirective } from 'angular-datatables';
import moment from 'moment';
import { Observable, Subject } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '@/store/state';
import { BakcEndService } from '@/bakc-end.service';
import { PayrollService } from '@services/payroll/payroll.service';
import { TimelogsService } from '@services/timelogs/timelogs.service';

@Component({
  selector: 'app-payroll-masterlist',
  templateUrl: './payroll-masterlist.component.html',
  styleUrls: ['./payroll-masterlist.component.scss']
})
export class PayrollMasterlistComponent implements OnInit {
  @ViewChild('payrollModal') payrollModal: TemplateRef<any>;
  @ViewChild('progressModal') progressModal: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('pdfIframe') pdfIframe: ElementRef;
  @ViewChild('printSection', { static: false }) printSection: ElementRef;

  pageSize: number = 10;
  pageIndex: number = 0;
  payroll = []
  allPayroll: any[] = [];
  displayedColumns: string[] = [
    'payrollPeriod',
    'payrollType', 
    'totalEmployees',
    'totalSSS',
    'totalPhilhealth',
    'totalPagibig',
    'totalGSIS',
    'totalNetpay',
    'action'
  ];

  documentTotals: any[] = [];
  payrollData: any[] = [];
  totalEmployees: number = 0;
  totalSSS: number = 0;
  totalPhilhealth: number = 0;
  totalPagibig: number = 0;
  totalGSIS: number = 0;
  totalNetpay: number = 0;

  imageUrl: string;
  formattedValue: string;
  progress: number = 0;
  selectedCount: number = 0
  isGenerating: boolean = false;
  
  employees = [];
  dataArray: any[] = [];
  selectedEmployees: any[] = [];
  selectAll: boolean = false;
  payrollType: string = '';
  dateFrom: NgbDate | null = null;
  dateTo: NgbDate | null = null;
  showValidationErrors: boolean = false;
  payrollNum: string | null = null;

  basicPay: number | null = 0;
  absent: number | null = 0;
  late: number | null = 0;
  loan: number | null = 0;
  incomeTax: number | null = 0;
  sssContribution: number | null = 0;
  philHealthContribution: number | null = 0;
  pagibigContribution: number | null = 0;
  gsisContribution: number | null = 0;
  grossPayTotal: number | null = 0;  
  deductionTotal: number | null = 0;
  netPayTotal: number | null = 0;

  loading = false;
  loadingEmployees: boolean = false; 
  employeesLoaded: boolean = false;

	hoveredDate: NgbDate | null = null;
	fromDate: NgbDate | null;
	toDate: NgbDate | null;
  dateFilter: NgbDateStruct;
  filterbyDay:boolean = true;
  today: NgbDateStruct;
  form: FormGroup;

  idNo: string = '';
  allRequests: any[] = [];
  employeeRates: any[] = [];
  approvedLeaves: any[] = [];

  darkMode: boolean;

  constructor(
    private calendar: NgbCalendar,
    private toastr: ToastrService,
    private backendService: BakcEndService,
    public formatter: NgbDateParserFormatter,
    private payrollService: PayrollService,
    private timelogsService: TimelogsService,
    private modalService: NgbModal,
    private store: Store<AppState>
  ) {
    this.today = this.calendar.getToday(); 
    this.dateFilter = null;
    this.fromDate = null;
    this.toDate = null;
   }

  ngOnInit(): void {
    this.store.select('ui').subscribe((state) => {
      this.darkMode = state.darkMode;
    });

    this.refresh();
    this.loadLeaveApproval();
  }

  /******************************************* Filter & Tables ******************************************/
  refresh(): void {
    this.loading = true;
    this.loadPayrollData();
  }

  loadPayrollData(): void {
    this.loading = true;
    this.backendService.getPayrollData().subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.payroll = data;
          this.allPayroll = [...data]; // Preserve original data
          this.computeTotals(); // Compute totals once data is ready
        } else {
          console.error('No valid payroll data found:', data);
          this.toastr.error('No payroll data available.');
        }
      },
      error: (error) => {
        console.error('Error fetching payroll data:', error);
        this.toastr.error('Failed to load payroll data.');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  
  computeTotals(): void {
    if (!this.payroll || !Array.isArray(this.payroll)) {
      console.error('Invalid payroll data for totals computation.');
      return;
    }
    const totals = this.payroll.map((payroll) => ({
      ...payroll,
      totalEmployees: payroll.employees?.length || 0,
      totalSSS: payroll.employees.reduce((sum, emp) => sum + (emp.payrollDetails.sssContribution || 0), 0),
      totalPhilhealth: payroll.employees.reduce((sum, emp) => sum + (emp.payrollDetails.philHealthContribution || 0), 0),
      totalPagibig: payroll.employees.reduce((sum, emp) => sum + (emp.payrollDetails.pagibigContribution || 0), 0),
      totalGSIS: payroll.employees.reduce((sum, emp) => sum + (emp.payrollDetails.gsisContribution || 0), 0),
      totalNetpay: payroll.employees.reduce((sum, emp) => sum + (emp.payrollDetails.netPayTotal || 0), 0),
    }));
  
    this.payroll = totals; // Update payroll with computed totals
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  setFilterMode(mode: boolean) {
    this.filterbyDay = mode;
     this.computeTotals();
  }

  validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
		const parsed = this.formatter.parse(input);
		return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
	}

  isInside(date: NgbDate) {
		return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
	}

  isHovered(date: NgbDate) {
		return (
			this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate)
		);
	}

  isRange(date: NgbDate) {
		return (
			date.equals(this.fromDate) ||
			(this.toDate && date.equals(this.toDate)) ||
			this.isInside(date) ||
			this.isHovered(date)
		);
	}

  clearDateFilter() {
    if (this.filterbyDay) {
      this.dateFilter = null;
    } else {
      this.fromDate = null;
      this.toDate = null;
    }
    this.refresh();
  }

  onDateSelection(date: NgbDate) {
    if (this.filterbyDay) {
      // Single-day filter logic
      this.dateFilter = date; // Set the selected date for "Filter by Day" mode
      this.filterPayroll();   // Apply the single-day filter
      this.computeTotals();   // Recompute totals
    } else {
      // Range-based filter logic
      if (!this.fromDate && !this.toDate) {
        this.fromDate = date;
      } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
        this.toDate = date;
      } else {
        this.toDate = null;
        this.fromDate = date;
      }
  
      if (this.fromDate && this.toDate) {
        this.filterPayroll();   // Apply the range filter
        this.computeTotals();   // Recompute totals
      }
    }
  } 

  filterPayroll() {
    if (!this.fromDate && !this.toDate && !this.dateFilter) {
        console.log('No filter applied. Showing all payroll data.');
        this.payroll = [...this.allPayroll]; // Reset the payroll to its original state
        this.computeTotals(); // Ensure totals are recalculated
        return;
    }

    if (this.filterbyDay && this.dateFilter) {
        // Single-day filter
        const selectedDate = moment({
            year: this.dateFilter.year,
            month: this.dateFilter.month - 1, // Moment.js months are 0-based
            day: this.dateFilter.day,
        }).startOf('day');
        
        console.log('Filtering by single day:', selectedDate.format());
        this.payroll = this.allPayroll.filter((payroll) => {
            const payrollStartDate = moment(payroll.dateFrom).startOf('day');
            return selectedDate.isSame(payrollStartDate); // Match exact day
        });
    } else if (this.fromDate && this.toDate) {
        // Range-based filter
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
        
        console.log(`Filtering by range: ${fromDate.format()} to ${toDate.format()}`);
        this.payroll = this.allPayroll.filter((payroll) => {
            const payrollStartDate = moment(payroll.dateFrom).startOf('day');
            const payrollEndDate = moment(payroll.dateTo).endOf('day'); // Inclusive range
            return payrollStartDate.isBetween(fromDate, toDate, undefined, '[]') || // Starts within range
                   payrollEndDate.isBetween(fromDate, toDate, undefined, '[]') ||  // Ends within range
                   (payrollStartDate.isBefore(fromDate) && payrollEndDate.isAfter(toDate)); // Overlaps the range
        });
    }

    console.log('Filtered Payroll:', this.payroll);
    this.computeTotals(); // Recompute totals after filtering
  }

  /******************************************* Modal ******************************************/

  openPayrollModal(content: any) {
    this.modalService.open(content, { centered: true, backdrop: false, keyboard: false });
    this.resetSelections();
    this.loadEmployeeData();
  }

  loadEmployeeData(): void {
    if (this.employeesLoaded && this.employees.length > 0) {
      return;
    }
    this.loadingEmployees = true;
    this.backendService.getEmployeeData().subscribe(
      (data) => {
        this.employees = data.map((employee: any) => {
          return {
            id_no: employee.id_no,
            firstName: employee.firstName,
            middleName: employee.middleName,
            lastName: employee.lastName,
            serviceInformation: employee.serviceInformation,
            selected: false
          };
        });
        this.loadingEmployees = false;
        this.employeesLoaded = true;
      },
      (error) => {
        this.toastr.error('Failed to load employee data. Please try again.');
        console.error('Error fetching employee data:', error);
        this.loadingEmployees = false;
      }
    );
  }

  async savePayrollData() {
    if (this.isGenerating) return; 

    this.showValidationErrors = true;
    const selectedEmployees = this.employees.filter(emp => emp.selected);
    const selectedEmployeeIds = selectedEmployees.map(emp => emp.id_no.trim());
  
    if (!this.payrollType || !this.dateFrom || !this.dateTo || selectedEmployees.length === 0) return;
    this.showValidationErrors = false;
    this.isGenerating = true;
  
    const formattedDateFrom = this.formatNgbDate(this.dateFrom);
    const formattedDateTo = this.formatNgbDate(this.dateTo);
  
    const proceedWithOvertime = await this.checkPendingOvertime(selectedEmployeeIds);
    if (!proceedWithOvertime){
      this.isGenerating = false;
      return;
    }

    const proceedWithLeaves = await this.checkPendingLeaves(selectedEmployees);
    if (!proceedWithLeaves){
      this.isGenerating = false;
      return;
    }

    const { proceed, leavePayByEmployee, conflictingDatesByEmployee } = await this.calculateApprovedLeavePay(selectedEmployees, formattedDateFrom, formattedDateTo);
    if (!proceed) {return;}

    const basicPayData = await this.calculateEmployeeBasicPay(formattedDateFrom, formattedDateTo, conflictingDatesByEmployee);
    const documentCount = await this.backendService.getPayrollCount().toPromise();
  
    this.modalService.dismissAll();
    this.modalService.open(this.progressModal, { centered: true, backdrop: false, keyboard: false });
    this.progress = 0;
    selectedEmployees.sort((a, b) => a.lastName.localeCompare(b.lastName));
  
    const compiledPayrollData = {
      payrollType: this.payrollType,
      dateFrom: formattedDateFrom,
      dateTo: formattedDateTo,
      timestamp: new Date().toISOString(),
      employees: []
    };
  
    let completedCount = 0;
    try {
      for (const [index, employee] of selectedEmployees.entries()) {
        const employeeId = employee.id_no.trim();
        const basicPay = basicPayData[employeeId]?.basicPay || 0;
        const workdays = basicPayData[employeeId]?.workdays || 0;
        const leavePay = leavePayByEmployee[employeeId] || 0;
  
        const overtimePay = await this.getTotalOvertimePay(employee.id_no.trim(), formattedDateFrom, formattedDateTo);
        const payrollNum = this.generatePayrollNum(index + 1, documentCount);
        const serviceInfo = { ...employee.serviceInformation };
        const payrollDetails = this.calculatePayroll(basicPay, leavePay, overtimePay, serviceInfo, workdays);
        const cleanedServiceInfo = this.excludeKeys(serviceInfo, ['payrollType', 'dateFrom', 'dateTo']);
        const employeePayrollData = {
          employeeIndex: index + 1,
          payrollNum: payrollNum,
          employeeId: employee.id_no,
          employeeName: `${employee.firstName} ${this.getMiddleInitial(employee.middleName)} ${employee.lastName}`,
          serviceInformation: cleanedServiceInfo,
          payrollDetails: payrollDetails
        };
  
        compiledPayrollData.employees.push(employeePayrollData);
        completedCount++;
        this.progress = Math.round((completedCount / selectedEmployees.length) * 100);
      }
  
      await this.backendService.savePayrollBatch(compiledPayrollData).toPromise();
      this.refresh();
      this.isGenerating = false;
      this.progress = 0;
      this.modalService.dismissAll();
      Swal.fire({
        icon: 'success',
        title: 'Payroll Generated',
        html: `Your Payroll From <strong>${this.formatNgbDate(this.dateFrom)}</strong> to <strong>${this.formatNgbDate(this.dateTo)}</strong> Has Been Successfully Generated.<br> <strong>${selectedEmployees.length} Payslips</strong> Have Been Created.`,
        confirmButtonText: 'OK',
        customClass: { confirmButton: 'btn btn-primary' },
        buttonsStyling: false
      });
  
    } catch (error) {
      console.error('Error during payroll generation:', error);
      this.toastr.error('Failed to generate payroll. Please try again.', 'Error');
    } finally {
      this.isGenerating = false;
      this.modalService.dismissAll();
    }
  }  
  
  calculatePayroll(basicPay: number, leavePay: number, overtimePay: number, serviceInfo: any, workdays: number): any {
    const sssContribution = this.roundToTwoDecimals(this.calculateSSSContribution(basicPay));
    const philHealthContribution = this.roundToTwoDecimals(this.calculatePhilHealthContribution(basicPay));
    const pagibigContribution = this.roundToTwoDecimals(this.calculatePagibigContribution(basicPay));
    const gsisContribution = this.roundToTwoDecimals(this.calculateGSISContribution(basicPay));
    const totalContributions = this.roundToTwoDecimals(
        sssContribution + philHealthContribution + pagibigContribution + gsisContribution
    );
  
    const taxableIncome = this.roundToTwoDecimals(basicPay - totalContributions);
    const incomeTax = this.roundToTwoDecimals(this.calculateIncomeTax(taxableIncome));
  
    const grossPayTotal = this.roundToTwoDecimals(
        this.calculateTotal([
            basicPay,
            overtimePay,
            leavePay,
            serviceInfo.allowance || 0,
            serviceInfo.cnaIncentive || 0,
            serviceInfo.ecola || 0,
            serviceInfo.rata || 0,
            serviceInfo.clothingAllowance || 0,
            serviceInfo.laundryAllowance || 0,
            serviceInfo.cashGift || 0,
            serviceInfo.performanceEhcIncentive || 0,
            serviceInfo.subsistence || 0,
            serviceInfo.deminimis || 0
        ])
    );
  
    const deductionTotal = this.roundToTwoDecimals(
        this.calculateTotal([
            incomeTax,
            sssContribution,
            philHealthContribution,
            pagibigContribution,
            gsisContribution,
            this.late || 0,
            this.absent || 0,
            this.loan || 0
        ])
    );
  
    const netPayTotal = this.roundToTwoDecimals(grossPayTotal - deductionTotal);
  
    return {
        basicPay,
        leavePay,
        overtimePay,
        workdays,
        incomeTax,
        sssContribution,
        philHealthContribution,
        pagibigContribution,
        gsisContribution,
        grossPayTotal,
        deductionTotal,
        netPayTotal
    };
  }
  
  calculateEmployeeBasicPay( dateFrom: string, dateTo: string, conflictingDatesByEmployee: { [key: string]: Set<string> }): Promise<{ [key: string]: { basicPay: number, workdays: number } }> {
    return new Promise((resolve) => {
      this.backendService.getEmployeeRates().pipe(
        tap((data) => {
          this.employeeRates = data;
        }),
        switchMap(() => this.timelogsService.getTimelogs())
      ).subscribe((data) => {
        this.allRequests = data.rows;
  
        if (!this.employeeRates || this.employeeRates.length === 0) {
          console.error('Employee rates are not loaded.');
          resolve({});
          return;
        }
  
        const workHoursByEmployee = this.timelogsService.calculateAllEmployeesWorkHours(this.allRequests);
        const payAndWorkdaysByEmployee: { [key: string]: { basicPay: number, workdays: number } } = {};
  
        for (const employeeId in workHoursByEmployee) {
          const employeeRate = this.employeeRates.find(rate => rate.id_no.trim() === employeeId.trim());
  
          if (!employeeRate || !employeeRate.monthlyRate) {
            console.error(`No rate found for Employee ID: ${employeeId}`);
            continue;
          }
  
          const dailyRate = employeeRate.monthlyRate / 22;
          let totalSalary = 0;
          let workdays = 0; // Counter for workdays
  
          for (const date in workHoursByEmployee[employeeId]) {
            if (date >= dateFrom && date <= dateTo) {
              if (conflictingDatesByEmployee[employeeId]?.has(date)) {
                continue; // Skip this date as it's a conflicting date
              }
  
              let workHours = workHoursByEmployee[employeeId][date] || 0;
              if (workHours > 8) {
                workHours = 8; // Cap work hours at 8
              }
  
              if (workHours > 0) {
                workdays++; // Increment workdays if there are work hours
              }
  
              const dailySalary = workHours * (dailyRate / 8); // Calculate based on capped hours
              totalSalary += dailySalary;
            }
          }
  
          payAndWorkdaysByEmployee[employeeId] = { basicPay: totalSalary, workdays };
        }
  
        resolve(payAndWorkdaysByEmployee);
      });
    });
  }  

  loadLeaveApproval(): void {
    this.backendService.getLeaveSummary().subscribe(
      (response) => {
        if (response && response.rows) {
          this.approvedLeaves = response.rows
            .filter((row) => row.value.status === "approved")
            .map((row) => row.value);
          // console.log("Approved Leaves Loaded:", this.approvedLeaves);
        }
      }
    );
  }
  
  async calculateApprovedLeavePay(
    selectedEmployees: any[],
    formattedDateFrom: string,
    formattedDateTo: string
  ): Promise<{ proceed: boolean; leavePayByEmployee: { [key: string]: number }, conflictingDatesByEmployee: { [key: string]: Set<string> } }> {
    return new Promise(async (resolve) => {
      try {
        // Fetch employee rates and timelogs only
        this.employeeRates = await this.backendService.getEmployeeRates().toPromise();
        const timelogData = await this.timelogsService.getTimelogs().toPromise();
  
        if (!this.employeeRates || this.employeeRates.length === 0) {
          console.error('Employee rates are not loaded.');
          resolve({ proceed: false, leavePayByEmployee: {}, conflictingDatesByEmployee: {} });
          return;
        }
  
        const leavePayByEmployee: { [key: string]: number } = {};
        const conflictingDatesByEmployee: { [key: string]: Set<string> } = {}; // New object to store conflicting dates
  
        for (const employee of selectedEmployees) {
          const employeeId = employee.id_no?.trim();
          if (!employeeId) {
            console.warn("Selected employee is missing an id_no:", employee);
            continue; // Skip employees without an `id_no`
          }
  
          const approvedLeaves = this.approvedLeaves.filter((leave) => {
            const isWithinDateRange = new Date(leave.startDateTime) >= new Date(formattedDateFrom) &&
                                      new Date(leave.finishDateTime) <= new Date(formattedDateTo);
            return leave.id_no?.trim() === employeeId && isWithinDateRange;
          });
          console.log(`Approved Leaves for Employee ${employeeId}:`, approvedLeaves);

          const employeeTimelogs = timelogData.rows
            .map(row => row.doc)
            .filter((log: any) => {
              return log.employee_id?.trim() === employeeId &&
                     new Date(log.date) >= new Date(formattedDateFrom) &&
                     new Date(log.date) <= new Date(formattedDateTo);
            });
          console.log(`Filtered Timelogs for Employee ${employeeId}:`, employeeTimelogs);
  
          conflictingDatesByEmployee[employeeId] = new Set(); // Initialize the set for storing conflicting dates
          approvedLeaves.forEach(leave => {
            const leaveDates = this.getDatesInRange(leave.startDateTime, leave.finishDateTime);
            leaveDates.forEach(date => {
              if (employeeTimelogs.some(log => log.date === date)) {
                conflictingDatesByEmployee[employeeId].add(date); // Add conflicting date to the set
              }
            });
          });

          if (conflictingDatesByEmployee[employeeId].size > 0) {
            const employeeName = `${employee.firstName} ${employee.lastName}`;
            const employeeConflicts = Array.from(conflictingDatesByEmployee[employeeId])
              .map(date => `<li>(Date: ${date}) - ${employeeId} - ${employeeName}</li>`)
              .join('');

            const { isConfirmed } = await Swal.fire({
              icon: 'warning',
              title: 'Conflicting Timelogs Found on Leave Days',
                 html: `
                <div style="font-size: 16px;">
                  Please note that there are timelog entries on approved leave dates for the following dates and employees:
                  <br><br>
                  <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; font-size: 14px;">
                    <ul style="margin: 0; padding-left: 20px;">${employeeConflicts}</ul>
                  </div>
                  <br>
                  <span style="color: red;">These conflicting timelog entries will not be included in this payroll.</span>
                </div>
              `,
              showCancelButton: true,
              confirmButtonText: 'Proceed',
              cancelButtonText: 'Cancel',
              reverseButtons: true,
              customClass: { confirmButton: 'btn btn-primary ml-2', cancelButton: 'btn btn-secondary' },
              buttonsStyling: true
            });
  
            if (!isConfirmed) {
              resolve({ proceed: false, leavePayByEmployee: {}, conflictingDatesByEmployee: {} });
              return;
            }
          }
  
          // Calculate leave pay for the employee based on approved leave days
          const employeeRate = this.employeeRates.find(rate => rate.id_no?.trim() === employeeId);
          
          if (!employeeRate || !employeeRate.monthlyRate) {
            console.error(`No rate found for Employee ID: ${employeeId}`);
            leavePayByEmployee[employeeId] = 0;
            continue;
          }
  
          const dailyRate = employeeRate.monthlyRate / 22;
          const totalLeaveDays = approvedLeaves.reduce((sum, leave) => sum + leave.totalDays, 0);
          const leavePay = dailyRate * totalLeaveDays;
  
          console.log(`Calculated Leave Pay for Employee ID ${employeeId}: ₱${leavePay.toFixed(2)} for ${totalLeaveDays} days`);
  
          // Store calculated leave pay for the employee
          leavePayByEmployee[employeeId] = leavePay;
        }
  
        // Set leave pay to 0 for any selected employees who have no approved leaves within the date range
        selectedEmployees.forEach(emp => {
          const empId = emp.id_no?.trim();
          if (empId && leavePayByEmployee[empId] === undefined) {
            leavePayByEmployee[empId] = 0;
          }
        });
  
        console.log("Computed Leave Pay by Employee:", leavePayByEmployee);
        console.log("Conflicting Dates by Employee:", conflictingDatesByEmployee);
        resolve({  proceed: true, leavePayByEmployee, conflictingDatesByEmployee });
  
      } catch (error) {
        console.error('Error calculating leave pay:', error);
        resolve({ proceed: false, leavePayByEmployee: {}, conflictingDatesByEmployee: {} });
      }
    });
  }    

  getDatesInRange(startDate: string, endDate: string): string[] {
    const dateArray = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
  
    while (currentDate <= end) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  }   
  
  checkPendingLeaves(selectedEmployees: any[]): Promise<boolean> {
    return new Promise((resolve) => {
      this.backendService.getLeaveSummary().subscribe(
        (leaveData) => {
          // Filter for pending or processing leaves for selected employees
          const pendingOrProcessingLeaves = leaveData.rows.filter(
            (row) => {
              const isPendingOrProcessing = row.value.status === "pending" || row.value.status === "processing";
              const isSelectedEmployee = selectedEmployees.some(emp => emp.id_no.trim() === row.value.id_no.trim());
              return isPendingOrProcessing && isSelectedEmployee;
            }
          );
  
          if (pendingOrProcessingLeaves.length > 0) {
            // Prepare the list of selected employees with pending or processing leaves
            const employeeList = pendingOrProcessingLeaves
              .map(leave => `(Date: ${leave.value.startDateTime} to ${leave.value.finishDateTime}) - ${leave.value.id_no} - ${leave.value.empName.empFirstName} ${leave.value.empName.empLastName}`)
              .join('<br>');

            Swal.fire({
              icon: 'warning',
              title: 'Pending or Processing Leaves Found',
              html: `
                <div style="font-size: 16px;">
                  Please note that there are leave requests with pending or processing status for the following employees:
                  <br><br>
                  <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; font-size: 14px;">
                    ${employeeList}
                  </div>
                  <br>
                  <span style="color: red;">These leave requests will not be included in this payroll.</span>
                </div>
              `,
            showCancelButton: true,
            confirmButtonText: 'Proceed',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            customClass: { confirmButton: 'btn btn-primary ml-2', cancelButton: 'btn btn-secondary' },
            buttonsStyling: true          
            }).then((result) => {
              resolve(result.isConfirmed);
            });
          } else {
            // No pending or processing leaves for selected employees, proceed with payroll generation
            resolve(true);
          }
        },
        (error) => {
          console.error('Error fetching leave summary:', error);
          resolve(false); // Resolve false in case of an error
        }
      );
    });
  }

  async checkPendingOvertime(selectedEmployeeIds: string[]): Promise<boolean> {
    try {
      const data = await this.timelogsService.getTimelogs().toPromise();
      const timelogs = data.rows.map((row: any) => row.doc);
      const pendingOvertimeLogs = timelogs.filter((log: any) => {
        return (
          selectedEmployeeIds.includes(log.employee_id) &&
          log.overtimeRequest?.status === 'Pending'
        );
      });
  
      // Create a unique list of employees with pending overtime
      const employeesWithPendingOvertime: { employeeId: string, employeeName: string, overtimeDate: string }[] = Array.from(
        new Set(
          pendingOvertimeLogs.map(log => ({
            employeeId: log.employee_id,
            employeeName: log.employee_name,
            overtimeDate: log.date
          }))
        )
      );
  
      if (employeesWithPendingOvertime.length > 0) {
        const employeeList = employeesWithPendingOvertime
          .map(emp => `(Date: ${emp.overtimeDate}) - ${emp.employeeId} - ${emp.employeeName}`)
          .join('<br>');
        const { isConfirmed } = await Swal.fire({
          icon: 'warning',
          title: 'Pending Overtime Found',
          html: `
            <div style="font-size: 16px;">
              Please note that there are Pending Overtime Requests for the following employees:
              <br><br>
              <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; font-size: 14px;">
                ${employeeList}
              </div>
              <br>
              <span style="color: red;">All pending overtime will not be included in this payroll.</span>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Proceed',
          cancelButtonText: 'Cancel',
          reverseButtons: true,
          customClass: { confirmButton: 'btn btn-primary ml-2', cancelButton: 'btn btn-secondary' },
          buttonsStyling: true
        });
  
        return isConfirmed;
      }
      return true;
    } catch (error) {
      console.error('Error fetching timelogs:', error);
      this.toastr.error('Failed to check pending overtime. Please try again.', 'Error');
      return false;
    }
  }  

  async getTotalOvertimePay(employeeId: string, startDate: string, endDate: string): Promise<number> {
    try {
      // Fetch all timelogs
      const data = await this.timelogsService.getTimelogs().toPromise();
      const timelogs = data.rows.map((row: any) => row.doc);

      const filteredLogs = timelogs.filter((log: any) => {
        const logDate = new Date(log.date);
        return log.employee_id === employeeId &&
               logDate >= new Date(startDate) &&
               logDate <= new Date(endDate) &&
               log.overtimeRequest?.status === 'Approved';
      });
  
      // Log the filtered logs to ensure they are correct
      console.log('Filtered Logs:', filteredLogs);
  
      const totalOvertimePay = filteredLogs.reduce((sum: number, log: any) => {
        const overtimePay = parseFloat(log.overtimeRequest?.overtimePay) || 0;
        console.log(`Adding Overtime Pay: ${overtimePay} from log ID: ${log._id}`);
        return sum + overtimePay;
      }, 0);
  
      console.log('Total Overtime Pay Calculated:', totalOvertimePay);

      return this.roundToTwoDecimals(totalOvertimePay);
    } catch (error) {
      console.error('Error fetching or processing timelogs:', error);
      throw error;
    }
  }  
  
  private excludeKeys(obj: any, keys: string[]): any {
    return Object.keys(obj)
      .filter(key => !keys.includes(key))
      .reduce((result, key) => {
        result[key] = obj[key];
        return result;
      }, {});
  }

  private roundToTwoDecimals(value: number): number {
    return parseFloat(value.toFixed(2));
  }  
  
  private calculateTotal(values: number[]): number {
    return values.reduce((acc, curr) => (curr || 0) + acc, 0);
  }

  private calculateSSSContribution(basicPay: number): number {
    const maxSalaryCredit = 30000;
    const salaryCredit = Math.min(basicPay, maxSalaryCredit);
    const sssRate = 0.045; // Employee share (4.5%)
    return salaryCredit * sssRate;
  }

  private calculatePhilHealthContribution(basicPay: number): number {
    const maxSalaryCap = 90000;
    const salary = Math.min(basicPay, maxSalaryCap);
    const philHealthRate = 0.05; // 5% 2024-2026 rates shared by employee and employer
    return (salary * philHealthRate / 2); // Employee share
  }

  private calculatePagibigContribution(basicPay: number): number {
    const salaryCap = 5000;
    const pagibigRate = 0.02; // 2%
    return Math.min(basicPay, salaryCap) * pagibigRate;
  }

  private calculateGSISContribution(basicPay: number): number {
    const gsisRate = 0.09; // 9% employee share
    return basicPay * gsisRate;
  }

  private calculateIncomeTax(taxableIncome: number): number {
    if (taxableIncome <= 250000) {
      return 0;
    } else if (taxableIncome <= 400000) {
      return (taxableIncome - 250000) * 0.15;
    } else if (taxableIncome <= 800000) {
      return 22500 + (taxableIncome - 400000) * 0.20;
    } else if (taxableIncome <= 2000000) {
      return 102500 + (taxableIncome - 800000) * 0.25;
    } else if (taxableIncome <= 8000000) {
      return 402500 + (taxableIncome - 2000000) * 0.30;
    } else {
      return 2202500 + (taxableIncome - 8000000) * 0.35;
    }
  }

  formatNgbDate(date: NgbDate): string {
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  }

  generatePayrollNum(employeeIndex: number, documentCount: number): string {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${yearMonth}-${(documentCount + 1).toString().padStart(3, '0')}`; // +1 for the new document
  }

  onEmployeeSelect(event: any, employee: any): void {
    if (event.target.checked) {
      this.selectedEmployees.push(employee);
    } else {
      this.selectedEmployees = this.selectedEmployees.filter((emp: any) => emp.id_no !== employee.id_no);
    }
    this.selectedCount = this.selectedEmployees.length; // Update the count dynamically
  }
  
  toggleSelectAll(): void {
    this.employees.forEach(employee => employee.selected = this.selectAll);
    if (this.selectAll) {
      this.selectedEmployees = [...this.employees]; // Select all employees
    } else {
      this.selectedEmployees = []; // Deselect all employees
    }
    this.selectedCount = this.selectedEmployees.length; // Update the count dynamically
  }

  getMiddleInitial(middleName: string): string {
    if (!middleName) return '';
    const initial = middleName.charAt(0).toUpperCase();
    return `${initial}.`;
  }
  
  resetSelections(): void {
    this.employees.forEach(employee => employee.selected = false);
    this.selectAll = false;
    this.payrollType = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.selectedEmployees = [];
    this.selectedCount = 0;
  }

  isAnyEmployeeSelected(): boolean {
    return this.employees.some(emp => emp.selected);
  }

  onDateSelectionM(date: NgbDate) {
    if (!this.dateFrom && !this.dateTo) {
      this.dateFrom = date;
    } else if (this.dateFrom && !this.dateTo && date.after(this.dateFrom)) {
      this.dateTo = date;
    } else {
      this.dateTo = null;
      this.dateFrom = date;
    }
  }

  validateInputM(currentValue: NgbDate | null, input: string): NgbDate | null {
    const parsed = this.formatter.parse(input);
    return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
  }

  isHoveredM(date: NgbDate) {
    return this.dateFrom && !this.dateTo && this.hoveredDate && date.after(this.dateFrom) && date.before(this.hoveredDate);
  }

  isInsideM(date: NgbDate) {
    return this.dateTo && date.after(this.dateFrom) && date.before(this.dateTo);
  }

  isRangeM(date: NgbDate) {
    return date.equals(this.dateFrom) || (this.dateTo && date.equals(this.dateTo)) || this.isInside(date) || this.isHovered(date);
  }

  clearDateFilterM() {
    this.dateFrom = null;
    this.dateTo = null;
  }
  
  /****************************************** Actions ******************************************/
  handleBulkPrint(payrollDoc: any) {
    this.payrollService.printPayslips(payrollDoc); // Pass the specific payrollDoc to printPayslips
  }  

  delete(data: any): void {  
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to delete the payslip for Payroll Number: ${data.payrollNum}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const payslipId = data._id;
        const rev = data._rev;
        if (payslipId && rev) {
          this.backendService.deletePayslip(payslipId, rev).subscribe(
            () => {
              this.payroll = this.payroll.filter(payslip => payslip._id !== payslipId);
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'The payslip has been deleted.',
                timer: 1000,
                showConfirmButton: false
              });
              this.refresh(); // add if filter is active
            },
            (error) => {
              console.error('Error deleting payslip:', error);
              Swal.fire('Error!', 'Failed to delete the payslip.', 'error');
            }
          );
        } else {
          console.error('Payslip ID or revision is undefined:', { payslipId, rev });
          Swal.fire('Error!', 'Invalid payslip data for deletion.', 'error');
        }
      }
    });
  }  
}