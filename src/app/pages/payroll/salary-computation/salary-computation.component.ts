import { Component, ElementRef, OnDestroy, OnInit, ViewChild, TemplateRef, ViewContainerRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService } from '@services/profile/profile.service';
import { LeaveService } from '@services/leave/leave.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { BakcEndService } from '@/bakc-end.service';
import { environment } from 'environments/environment';
import { ChangeDetectorRef } from '@angular/core';
import { debounceTime, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { PayrollService } from '@services/payroll/payroll.service';

@Component({
  selector: 'app-salary-computation',
  templateUrl: './salary-computation.component.html',
  styleUrls: ['./salary-computation.component.scss']
})
export class SalaryComputationComponent implements OnInit, OnDestroy {
  @ViewChild('payrollModal') payrollModal: any;
  @ViewChild('pdfIframe') pdfIframe: ElementRef;
  @ViewChild('input') input: ElementRef<HTMLInputElement>;
  @ViewChild('myInput')
  myInputVariable: ElementRef;
  @ViewChild('inputElement') inputElement!: ElementRef;
  loading = false;
  isLoading: boolean = false;
  sgNum = [...Array.from(Array(33)).map((e,i)=>i+1)]
  form: FormGroup
  createEmployeeForm: FormGroup
  otherForm: FormGroup
  serviceRecordForm: FormGroup
  filteredOptions = [];
  employees = [];
  selectedEmployee: any;
  positions = [];
  branches = [];
  divisions: any[] = [];
  departments = [];
  salaryGradeMatrix = [];
  isEditId: boolean = false
  dtOptions: any
  dateToday = new Date()
  page: string = localStorage.getItem('pageState')?localStorage.getItem('pageState'):'SalaryComputation'
  id: string = 'false'
  isEditForm: boolean = false
  currentUser:any = null;
  currentGroup:any = null;
  previousID: string;
  previousEmail: string;
  isUpdating:boolean = false;
  uploadError: string = '';
  editIndex: any;
  tempClinicAttachments = [];
  othersList: any[] = [];
  isEditFamilyForm: boolean;
  editFamilyFormIndex: number;

  imageUrl: string;
  formattedValue: string;
  selectedEmployees: any[] = [];
  selectAll: boolean = false;

  payrollType: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  payrollNum: string | null = null;
  dailyRate: number | null = 0;
  hourlyRate: number | null = 0;
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

  constructor(
    private viewContainerRef: ViewContainerRef,
    private fb: FormBuilder,
    private profileService: ProfileService,
    private leaveService: LeaveService,
    private service: BakcEndService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public payrollService: PayrollService
    ) {
    this.form = fb.group({
      _id: ['', Validators.required],
      _rev: [''],
      id_no: ['', Validators.required],
      isActive: [true],
      branchId: [null],
      position_title: [''],
      leaveBalance: [null],
      creationDate: [null],
      firstName: ['', [Validators.required, Validators.pattern('[a-zA-Z ]*')]],
      lastName: ['', [Validators.required, Validators.pattern('[a-zA-Z ]*')]],
      middleName: ['', Validators.pattern('[a-zA-Z ]*')],
      ext: ['', Validators.pattern('[a-zA-Z.]*')],
      gender: [null],
      birthDate: ['', Validators.required],
      placeOfBirth: [''],
      title: ['', Validators.pattern('[a-zA-Z.]*')],
      suffix: ['', Validators.pattern('[a-zA-Z.]*')],
      telephone: ['', [Validators.pattern('[0-9 ]*')]],
      mobileNumber: ['', [Validators.pattern('[0-9 ]*')]],
      email: ['', [Validators.required, Validators.email]],
      presentAddress: fb.group({
        residence: [''],
        street: [''],
        barangay: [''],
        city: ['', Validators.pattern('[a-zA-Z ]*')],
        province: ['', Validators.pattern('[a-zA-Z ]*')],
        zipCode: ['', Validators.pattern('[0-9 ]*')],
      }),
      permanentAddress: fb.group({
        residence: [''],
        street: [''],
        barangay: [''],
        city: ['', Validators.pattern('[a-zA-Z ]*')],
        province: ['', Validators.pattern('[a-zA-Z ]*')],
        zipCode: ['', Validators.pattern('[0-9 ]*')],
      }),
      serviceInformation: fb.group({
        // employee details
        branch: [null, Validators.required],
        division: [null, Validators.required],
        department: [null, Validators.required],
        position: [null, Validators.required],
        type: [null, Validators.required],
        status: [null, Validators.required],
        salaryGrade: [null, this.salaryGradeValidator],
        salaryStep: [null, Validators.required],
        dateHired: [null, Validators.required],
        appointedDate: [null],
        separationDate: [null],

        // payroll details
        payrollType: [null],
        dateFrom: [null],
        dateTo: [null],
        tin: [null],
        bank: [null],
        basicPayBankAccountNumber: [null],
        exemptionCode: [null],
        costCenter: [null],
        sssNumber: [null],
        phicNumber: [null],
        hdmfNumber: [null],

        // rates
        monthlyRate: [null, [Validators.pattern('[0-9 ]*')]],
        dailyRate: [null],
        hourlyRate: [null],

        // earnings -> allowances
        overtime: [null],
        allowance: [null],
        cnaIncentive: [null],
        ecola: [null],
        rata: [null],
        clothingAllowance: [null],
        laundryAllowance: [null],
        cashGift: [null],
        performanceEhcIncentive: [null],
        subsistence: [null],
        deminimis: [null],
        others: [null],

        rcbcBankAccountNumber: [null],
        rcbcMonthlyRate: [null],
        rcbcDailyRate: [null],
        rcbcHourlyRate: [null],

        payrollRate: [null]
      }),
      attendanceSettings: fb.group({
        scheduleTemplate: [null],
        attendanceId: [null],
        smartCardId: [null],
        exemptedInAttendance: [null],
        exemptedInLate: [null],
        exemptedInUndertime: [null],
      }),
      civilStatus: ['Single'],
      nationality: ['Filipino'],
      religion: ['Catholicism'],
      height: [''],
      weight: [''],
      bloodType: [''],
      gsis: [''],
      pag_ibig: [''],
      philHealth: [''],
      sss: [''],
      tin: [''],
      salaryMatrix: {},
      familyBackground: {},
      educationalAttainments: fb.array([]),
      jobExperiences: fb.array([]),
      eligibilityExaminations: fb.array([]),
      workInvolvements: fb.array([]),
      trainings: fb.array([]),
      others: fb.array([]),
      documents: fb.array([]),
      healthRecords: fb.array([]),
      disciplineManagements: fb.array([]),
      serviceRecords: fb.array([]),
      clinics: fb.array([]),
      _attachments: {}
    })
  }

  ngOnInit(): void {
    this.loading = true;
    this.getCurrentUser()
    this.imageUrl = '/assets/img/default-profile.png';
    this.getEmployees()
    this.pageState()
    this.getPositions()
    this.getBranchDepartment();
    this.getSalaryGradeMatrix();
    this.getDivisions();

    this.form.get('serviceInformation').valueChanges
    .pipe(debounceTime(300))
    .subscribe(() => {
      this.displayPayroll();
      this.displaybasicPay();
      this.calculateSalaryRates();
    });

  }

  ngOnDestroy(): void {
    localStorage.removeItem('employeeId')
  }

  calculateSalaryRates(): void {
    const serviceInfo = this.form.get('serviceInformation').value;
    const monthlyRate = serviceInfo.monthlyRate;
    
    if (monthlyRate) {
      this.dailyRate = monthlyRate / 22; // change based on workdays per week
      this.hourlyRate = this.dailyRate / 8; // assuming 8 hours in a working day
    } else {
      this.dailyRate = null;
      this.hourlyRate = null;
    }
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

  displaybasicPay(): void {
    const serviceInfo = this.form.get('serviceInformation').value;
    const monthlyRate = serviceInfo.monthlyRate;
    const payrollType = serviceInfo.payrollType;
  
    if (!monthlyRate || monthlyRate <= 0) {
      this.toastr.error('Invalid monthly rate');
      return;
    }
    // change the divisor based on protocol or create a dynamic placeholder
    const dailyRate = monthlyRate / 22;
    switch (payrollType) {
      case 'Monthly':
        this.basicPay = monthlyRate;
        break;
      case 'Semi-Monthly':
        this.basicPay = monthlyRate / 2;
        break;
      case 'Weekly':
        this.basicPay = dailyRate * 5;
        break;
      case 'Daily':
        this.basicPay = dailyRate;
        break;
      default:
        throw new Error('Invalid payroll type');
    }
  }

  displayPayroll() {
    this.isLoading = true;
    setTimeout(() => {
      const serviceInfo = this.form.get('serviceInformation').value;
      const basicPay = this.basicPay;
      this.sssContribution = this.calculateSSSContribution(basicPay);
      this.philHealthContribution = this.calculatePhilHealthContribution(basicPay);
      this.pagibigContribution = this.calculatePagibigContribution(basicPay);
      this.gsisContribution = this.calculateGSISContribution(basicPay);

      const totalContributions = (this.sssContribution || 0) + (this.philHealthContribution || 0) + (this.pagibigContribution || 0) + (this.gsisContribution || 0);
      const taxableIncome = basicPay - totalContributions;
      this.incomeTax = this.calculateIncomeTax(taxableIncome);
      const earnings = [
        this.basicPay || 0,
        serviceInfo.overtime || 0,
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
      ];
      this.grossPayTotal = this.calculateTotal(earnings);
  
      const deductions = [
        this.incomeTax || 0,
        this.sssContribution || 0,
        this.philHealthContribution || 0,
        this.pagibigContribution || 0,
        this.gsisContribution || 0,
        this.late || 0,
        this.absent || 0,
        this.loan || 0
      ];
      this.deductionTotal = this.calculateTotal(deductions);
      this.netPayTotal = this.grossPayTotal !== null && this.deductionTotal !== null
        ? this.grossPayTotal - this.deductionTotal
        : null;
      this.isLoading = false;
    }, 1000);
  }

  onEmployeeSelect(event: any, employee: any) {
    if (event.target.checked) {
      this.selectedEmployees.push(employee);
    } else {
      this.selectedEmployees = this.selectedEmployees.filter((emp: any) => emp.id_no !== employee.id_no);
    }
  }

  toggleSelectAll(): void {
    this.employees.forEach(employee => employee.selected = this.selectAll);
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
    this.dateFrom = '';
    this.dateTo = '';
  }

  formatCurrency(value: number | null): string {
    return this.payrollService.formatCurrency(value);
  }

  filter(): void {
    const filterValue = this.input.nativeElement.value.toLowerCase();
    this.filteredOptions = this.employees.filter(employee => {
      const idMatch = employee.doc.id_no.includes(filterValue);
      const lastNameMatch = employee.doc.lastName.toLowerCase().includes(filterValue);
      const firstNameMatch = employee.doc.firstName.toLowerCase().includes(filterValue);
      const middleNameMatch = employee.doc.middleName && employee.doc.middleName.toLowerCase().includes(filterValue);
      return idMatch || lastNameMatch || firstNameMatch || middleNameMatch;
    }).slice(0, 5);
  }  

  selectEmp(e: any){
    if (e.isUserInput) {
      e.target = {}
      e.target.value = e.source.value;
      this.changeEmployee(e)
    }
  }

  getCurrentUser(){
    this.service.getSystemUser().subscribe(
      (response: any) => {
        this.currentUser = response?.rows[0].doc
        if(this.currentUser){
          this.service.getUserGroupbyId(this.currentUser.setting_id).subscribe(
            (response: any) => {
              this.currentGroup = response?.rows[0].doc
            })
        }
      })
  }
  
  getBranchDepartment() {
    this.profileService.getBranches().subscribe(
      (response: any) => {
        this.branches = response?.rows
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )

    this.profileService.getDepartment().subscribe(
      (response: any) => {
        this.departments = response?.rows
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  getDivisions() {
    this.profileService.getDivisions().subscribe(
      (response: any) => {
      this.divisions = response?.rows;
      },
      (error) => {
        this.toastr.error(error.error.reason);
    });
  }

  getSalaryGradeMatrix() {
    this.profileService.getSalaryGrade().subscribe(
      (response: any) => {
        this.salaryGradeMatrix = response?.rows
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  getPositions() {
    this.profileService.getPositions().subscribe(
      (response: any) => {
        this.positions = response?.rows
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  getPositionName(id) {
    for (let index = 0; index < this.positions?.length; index++) {
      if (this.positions[index].doc.position_name == id) {
        return this.positions[index].doc.position_name
      }
    }
  }

  getBranchId(value){
    let newValue = this.branches.find(x=> x.doc.branchName === value)
    if(newValue){
      return newValue.doc._id
    }
    return false
  }

  pageState() {
    localStorage.setItem('pageState', this.page)
  }

  /**
   * Add Service Record Template
   * @returns
   */
  addServiceRecordTemplate() {
    return this.fb.group({
      placeOfAssignment: [null, Validators.required],
      from: [null, Validators.required],
      to: [null, Validators.required],
      type: [null, Validators.required],
      present: [null],
      designation: [null, Validators.required],
      isGovernmentOffice: [null],
      status: [null, Validators.required],
      salary: [null, Validators.required],
      salaryType: [null],
      branch: [null],
      vlWithoutPay: [null],
      separationDate: [null],
      separationCause: [null],
    })
  }

  get f() {
    return this.form
  }

  get ce() {
    return this.createEmployeeForm
  }

  get o() {
    return this.otherForm
  }

  get sr() {
    return this.serviceRecordForm
  }

  get childrenList(): FormArray {
    return this.f.get('children') as FormArray
  }

  get others(): FormArray {
    return this.f.get('others') as FormArray
  }

  get serviceRecords(): FormArray {
    return this.f.get('serviceRecords') as FormArray
  }

  /**
   * Get Employees and get first data
   */
  getEmployees() {
    this.profileService.getEmployees().subscribe(
      (response: any) => {
        // Ensure that response and response.rows exist and that each row has a doc before filtering
        let list = response?.rows?.filter(item => item?.doc && !(item.doc._id.includes('_design')));
  
        // Handle department filtering
        if (this.currentUser?.department != null) {
          this.employees = list.filter(item => item?.doc?.serviceInformation?.department?.includes(this.currentUser?.department));
        } else {
          this.employees = list;
        }
  
        this.filteredOptions = this.employees.slice(); // copy for filtering
  
        // Handle cases where the employee is selected based on id
        let data: any;
        console.log('id', this.id);
  
        if (this.id !== 'false') {
          const empData = this.employees.find(d => d.id === this.id);
          data = empData?.doc;
          this.previousID = empData?.doc?.id_no ?? null;
          this.previousEmail = empData?.doc?.email ?? null;
        } else {
          const employeeId = localStorage.getItem('employeeId');
          if (employeeId) {
            const empData = this.employees.find(d => d.id === employeeId);
            data = empData?.doc;
            this.previousID = empData?.doc?.id_no ?? null;
            this.previousEmail = empData?.doc?.email ?? null;
          } else {
            data = response?.rows[0]?.doc;  // fallback to the first employee in the list
          }
        }
        this.setValues(data);  // Set form values or handle the selected employee data
        this.loading = false;
        // Trigger change detection to ensure view updates
        this.cdr.detectChanges();
      },
      (error) => {
        this.toastr.error(error.error.reason);
        this.loading = false;
      }
    );
  }

  setValues(data) {
    this.form.reset();
    if (data && data._attachments) {
      if ('profilePic' in data._attachments) {
        this.http
          .get(environment.globalUrl + `/employees/${data._id}/profilePic`, {
            responseType: 'blob',
            headers: {
              'Authorization': 'Basic ' + btoa('admin:h@n@')
            }
          })
          .toPromise()
          .then(response => {
            const blobUrl = URL.createObjectURL(response);
            this.imageUrl = blobUrl;  // Set the image URL to display the profile picture
            console.log("Profile picture loaded:", this.imageUrl);
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
  
    // Apply other data to form fields
    this.form.patchValue(data);
    this.cdr.detectChanges();
  }
  

  /**
   * Update Employee
   */
  updateEmployee(updateReason?: string): void {
    this.isUpdating = true;
  
    // Get the branch ID and service information details
    const branchID = this.getBranchId(this.form.get(['serviceInformation', 'branch']).value);
  
    if (!branchID) {
      this.toastr.error('Please update employee\'s Service Information.');
      this.isUpdating = false;
      return;
    }
  
    // If the form is valid, proceed with saving the data
    if (this.form.valid) {
      // Prepare the updated service information with branch ID
      this.form.patchValue({
        branchId: branchID,
      });
  
      // Create a copy of the form data to avoid modifying the original form
      const formData = { ...this.form.value };
  
      // Ensure `_id` and `_rev` are present
      if (!formData._id || !formData._rev) {
        this.toastr.error('Document is missing required fields (_id or _rev).');
        this.isUpdating = false;
        return;
      }
  
      // Handle `_attachments` field explicitly
      if (!formData._attachments || Object.keys(formData._attachments).length === 0) {
        delete formData._attachments; // Remove the key instead of setting it to null
      }    
  
      // Call the profileService to update the employee's record
      this.profileService.updateEmployee(formData).subscribe(
        (response: any) => {
          if (response.ok) {
            // Update the revision (_rev) of the document
            this.form.patchValue({ _rev: response.rev });
  
            // Display success message
            this.toastr.success('Employee service information updated successfully.');
  
            // Optionally, reload employees or perform other post-update actions
            this.getEmployees();
          }
          this.isUpdating = false;
        },
        (error) => {
          // Log and display the error
          console.error('Update Error:', error);
          this.toastr.error(`Failed to update employee: ${error.error.reason}`);
          this.isUpdating = false;
        }
      );
    } else {
      // If form is invalid, display error and mark all fields as touched
      this.toastr.error('Check if the required fields have values.');
      this.form.markAllAsTouched();
      this.isUpdating = false;
    }
  }  

  /**
   * Change Employee
   * @param payload
   */
  changeEmployee(event) {
    console.log(event)
    const data = this.employees.find(data => data.doc.id_no == event.target.value)
    if (data?.doc) {
      this.form.reset()
      this.others.clear()
      this.serviceRecords.clear()
      this.form.patchValue(data?.doc)
      this.othersList = []
      this.othersList = data?.doc.others
      data?.doc.others?.forEach(data => {
        this.others.at(this.others.length - 1).patchValue(data)
      });
      data?.doc.serviceRecords?.forEach(data => {
        this.serviceRecords.push(this.addServiceRecordTemplate())
        this.serviceRecords.at(this.serviceRecords.length - 1).patchValue(data)
      });

      // localStorage.setItem('employeeId', event.target.value)
      localStorage.setItem('employeeId', data.id)
      this.setValues(data.doc)
    }
  }

  /**
   * Change Active Status
   */
  changeActiveStatus() {
    this.form.patchValue({isActive: !this.f.get('isActive').value})
    this.updateEmployee()
  }
  
  refresh(){
    this.loading = true;
    this.getEmployees()
  }

  salaryGradeValidator(control) {
    const value = Number(control.value);
    if (isNaN(value) || value < 1 || value > 33) {
      return { invalidSalaryGrade: true };
    }
    return null;
  }

  onDoubleClick() {
    // Get the native input element and trigger a click event
    if(this.employees.find((e) => e.id == this.f.get('_id').value)){
      this.inputElement.nativeElement.click();
    }
    else{
      console.log(this.f.get('_id').value)
    }
  }
}
