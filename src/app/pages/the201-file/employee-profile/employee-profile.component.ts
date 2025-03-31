import { Component, ElementRef, OnChanges, OnDestroy, OnInit, SecurityContext, TemplateRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, ValidatorFn, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService } from '@services/profile/profile.service';
import { LeaveService } from '@services/leave/leave.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { HttpClient, HttpEventType, HttpHeaders, HttpResponse } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { ViewChild } from '@angular/core';
import { BakcEndService } from '@/bakc-end.service';
import { environment } from 'environments/environment';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { ChangeDetectorRef } from '@angular/core';
import { takeUntil } from 'rxjs';

var getImageHeader = {
  responseType: 'arraybuffer',
  headers: new HttpHeaders()
  .set('Authorization',  `Basic ${btoa('admin:h@n@')}`)
}

type AdditionalField = {
  name: string;
  amount: number;
};

@Component({
  selector: 'app-employee-profile',
  templateUrl: './employee-profile.component.html',
  styleUrls: ['./employee-profile.component.scss'],
})


export class EmployeeProfileComponent implements OnInit, OnDestroy {
  @ViewChild('pdfIframe') pdfIframe: ElementRef;
  @ViewChild('input') input: ElementRef<HTMLInputElement>;
  @ViewChild('addFieldModal') addFieldModal!: TemplateRef<any>;
  @ViewChild('myInput')
  myInputVariable: ElementRef;
  @ViewChild('inputElement') inputElement!: ElementRef;
  loading = false;
  sgNum = [...Array.from(Array(33)).map((e,i)=>i+1)]
  form: FormGroup
  familyBackgroundForm: FormGroup
  createEmployeeForm: FormGroup
  educationalAttainmentForm: FormGroup
  jobExperienceForm: FormGroup
  eligibilityExaminationForm: FormGroup
  workInvolvementForm: FormGroup
  trainingForm: FormGroup
  otherForm: FormGroup
  documentForm: FormGroup
  healthRecordForm: FormGroup
  disciplineManagementForm: FormGroup
  serviceRecordForm: FormGroup
  clinicForm: FormGroup
  createClinicForm: FormGroup
  filteredOptions = [];
  employees = [];
  positions = [];
  branches = [];
  divisions: any[] = [];
  departments = [];
  salaryGradeMatrix = [];
  uploadError:any;
  isFileValid: boolean = true;
  leaveCards = [];
  isEditId: boolean = false
  dtOptions: any
  dtOptions2: any
  initialfamilyBackgroundFormValue: any;
  dateToday = new Date()
  page: string = localStorage.getItem('pageState')?localStorage.getItem('pageState'):'201File'
  tab: string = localStorage.getItem('tabState')?localStorage.getItem('tabState'):'personalInfo'
  id: string = 'false'
  isEditForm: boolean = false
  currentUser:any = null;
  currentGroup:any = null;
  previousID: string;
  previousEmail: string;
  isUpdating:boolean = false;

  weekdaysData = [
    {day: 'Sunday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
    {day: 'Monday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
    {day: 'Tuesday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
    {day: 'Wednesday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
    {day: 'Thursday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
    {day: 'Friday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
    {day: 'Saturday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
  ]

  additionalFields: AdditionalField[] = [];
  addFieldForm: FormGroup;

  editIndex: any;
  tempClinicAttachments = [];
  isEditFamilyForm: boolean;
  editFamilyFormIndex: number;
  imageUrl: string;
  allUsers: any;

  educBackgroundList: any[] = [];
  jobExpList: any[] = [];
  eligibilityExamList :any[] = [];
  workInvList: any[] = [];
  trainingsList: any[] = [];
  othersList: any[] = [];
  documentsList: any[] = [];
  healthRecordsList: any[] = [];
  dispManagementList: any[] = [];
  serviceRecordList: any[] = [];
  medicalList: any[] = [];
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private profileService: ProfileService,
    private leaveService: LeaveService,
    private service: BakcEndService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
    ) {
    this.route.params.subscribe(params => {
      if (params['id'] != 'false') {
        this.id = params['id'];
      }
      if (
        params['id'] == '201File' ||
        params['id'] == 'serviceInformation' ||
        params['id'] == 'attendance' ||
        params['id'] == 'documents' ||
        params['id'] == 'healthRecords' ||
        params['id'] == 'disciplineManagement' ||
        params['id'] == 'serviceRecords' ||
        params['id'] == 'clinics'
      ){
        this.page = params['id']
      }
    });
    this.route.queryParams.subscribe(params => {
      if (params.id == 'clinics') {
        this.page = 'clinics'
      }
    });
    this.dtOptions = {
      language: {
        search: '',
        searchPlaceholder: 'Search',
        lengthMenu: 'Show _MENU_ entries'
      },
      pageLength: 10,
      ordering: false,
      // paging: true,
      dom: 'Bfrtip',
      buttons: [
        {extend: 'print', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'copyHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'csvHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'excelHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      ],
    }
    this.dtOptions2 = {
      language: {
        search: '',
        searchPlaceholder: 'Search',
        lengthMenu: 'Show _MENU_ entries'
      },
      pageLength: 10,
      ordering: false,
      // paging: true,
      dom: 'Bfrtip',
      buttons: [
        {extend: 'print', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'copyHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'csvHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'excelHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      ],
    }
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
        tin: [''],
        bank: [null],
        basicPayBankAccountNumber: [null],
        exemptionCode: [null],
        costCenter: [null],
        sssNumber: [null],
        phicNumber: [null],
        hdmfNumber: [null],

        // earnings
        monthlyRate: [null],
        dailyRate: [null],
        hourlyRate: [null],
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

        // deductions
        incomeTax: [null],
        sss: [null],
        phic: [null],
        hdmf: [null],
        gsis: [null],
        loan: [null],

        rcbcBankAccountNumber: [null],
        rcbcMonthlyRate: [null],
        rcbcDailyRate: [null],
        rcbcHourlyRate: [null],

        payrollRate: [null],
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

    this.familyBackgroundForm = fb.group({
      spouse: fb.group({
        firstName: ['', [Validators.required, Validators.pattern('[a-zA-Z ]*')]],
        lastName: ['', [Validators.required, Validators.pattern('[a-zA-Z ]*')]],
        middleName: ['', Validators.pattern('[a-zA-Z ]*')],
        ext: ['', Validators.pattern('[a-zA-Z ]*')],
        occupation: [''],
        businessName: [''],
        businessAddress: [''],
        telephone: ['', [Validators.pattern('[0-9 ]*')]],
      }),
      father: fb.group({
        lastName: ['', Validators.required],
        firstName: ['', Validators.required],
        middleName: ['', Validators.pattern('[a-zA-Z ]*')],
        ext: [''],
      }),
      mother: fb.group({
        lastName: ['', Validators.required],
        firstName: ['', Validators.required],
        middleName: ['', Validators.pattern('[a-zA-Z ]*')],
        ext: [''],
      }),
      children: fb.array([]),
    })

    this.createEmployeeForm = fb.group({
      firstName: ['', [Validators.required, Validators.pattern('[a-zA-Z ]*')]],
      lastName: ['', [Validators.required, Validators.pattern('[a-zA-Z ]*')]],
      middleName: ['',[Validators.pattern('[a-zA-Z ]*')]],
      birthDate: [null, Validators.required],
      id_no: ['', Validators.required],
      position_title: [''],
      branchId:[null],
      leaveBalance: [null],
      creationDate: [null],
      email: [null, [Validators.required, Validators.email, this.emailExistsCreate()]],
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
        tin: [''],
        bank: [null],
        basicPayBankAccountNumber: [null],
        exemptionCode: [null],
        costCenter: [null],
        sssNumber: [null],
        phicNumber: [null],
        hdmfNumber: [null],

        // earnings
        monthlyRate: [null],
        dailyRate: [null],
        hourlyRate: [null],
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

        // deductions
        incomeTax: [null],
        sss: [null],
        phic: [null],
        hdmf: [null],
        gsis: [null],
        loan: [null],

        rcbcBankAccountNumber: [null],
        rcbcMonthlyRate: [null],
        rcbcDailyRate: [null],
        rcbcHourlyRate: [null],

        payrollRate: [null],
      }),
      salaryMatrix: {},
      familyBackground: fb.group({
        spouse: fb.group({
          firstName: [''],
          lastName: [''],
          middleName: [''],
          ext: [''],
          occupation: [''],
          businessName: [''],
          businessAddress: [''],
          telephone: [''],
        }),
        father: fb.group({
          lastName: [''],
          firstName: [''],
          middleName: [''],
          ext: [''],
        }),
        mother: fb.group({
          lastName: [''],
          firstName: [''],
          middleName: [''],
          ext: [''],
        }),
        children: fb.array([]),
      })
    })

    this.educationalAttainmentForm = fb.group({
      level: [null, [Validators.required]],
      schoolName: [null, [Validators.required]],
      inclusiveDateOfAttendance: [null, [Validators.required]],
      schoolAddress: [null],
      course: [null],
      yearGraduated: [null],
      highestGrade: [null],
      awards: [null],
    })

    this.jobExperienceForm = fb.group({
      dateStart: [null, [Validators.required]],
      dateEnd: [null, [Validators.required]],
      placeOfAssignment: [null, [Validators.required]],
      positionTitle: [null, [Validators.required]],
      present: [false],
      isGovernmentOffice: [false],
      salaryGrade: [null],
      basicPay: [null],
      salaryType: [null],
      status: [null],
    })

    this.eligibilityExaminationForm = fb.group({
      dateOfExamination: [null, [Validators.required]],
      placeOfExamination: [null, [Validators.required]],
      careerService: [null, [Validators.required]],
      rating: [null, [Validators.required]],
      licenseNumber: [null],
      releaseDate: [null],
      status: ['Saved'],
    })

    this.workInvolvementForm = fb.group({
      nameOfOrganization: [null, [Validators.required]],
      inclusiveDateFrom: [null, [Validators.required]],
      inclusiveDateTo: [null, [Validators.required]],
      positionTitle: [null, [Validators.required]],
      totalHours: [null, [Validators.required]],
      status: ['Saved'],
    })

    this.trainingForm = fb.group({
      titleOfSeminar: [null, [Validators.required]],
      inclusiveDateFrom: [null, [Validators.required]],
      inclusiveDateTo: [null, [Validators.required]],
      numberOfHours: [null, [Validators.required]],
      conductedBy: [null, [Validators.required]],
      withCertificate: [null],
      status: ['Saved'],
    })

    this.otherForm = fb.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.required]],
      type: [null, [Validators.required]],
      status: ['Saved'],
    })

    this.documentForm = fb.group({
      particular: [null, Validators.required],
      file: [null, Validators.required],
      name: [null],
      data: [null],
      date: [this.dateToday],
      remarks: ['-'],
      hasAttachment: ['No'],
    })

    this.healthRecordForm = fb.group({
      date: [this.dateToday],
      complaint: [null, Validators.required],
      diagnosis: [null],
      treatment: [null],
      laboratory: [null],
      physician: [null],
      status: ['Saved'],
    })

    this.disciplineManagementForm = fb.group({
      referenceNumber: [Math.floor(Math.random() * 9999999999) + 1],
      dateOfOffense: [null, Validators.required],
      degree: [null, Validators.required],
      actionPeriodFrom: [null, Validators.required],
      actionPeriodTo: [null, Validators.required],
      offense: [null, Validators.required],
      action: [null, Validators.required],
      employeeExplanation: [null, Validators.required],
      date: [this.dateToday],
      remarks: [null],
    })

    this.serviceRecordForm = fb.group({
      placeOfAssignment: [null, Validators.required],
      from: [null, Validators.required],
      to: [null, Validators.required],
      type: [null, Validators.required],
      present: [null],
      designation: [null, Validators.required],
      isGovernmentOffice: [null],
      status: [null, Validators.required],
      salary: [null, Validators.required],
      salaryType: [null, Validators.required],
      branch: [null, Validators.required],
      vlWithoutPay: [null],
      separationDate: [null, Validators.required],
      separationCause: [null],
    })

    this.clinicForm = fb.group({
      date: [this.dateToday],
      complaint: [null, Validators.required],
      diagnosis: [null],
      treatment: [null],
      laboratory: [null],
      physician: [null],
      clinicAttachments: [[]]
    })

    this.createClinicForm = fb.group({
      date: [this.dateToday],
      complaint: [null, Validators.required],
      diagnosis: [null],
      treatment: [null],
      laboratory: [null],
      physician: [null],
      clinicAttachments: fb.array([])
    })

    this.addFieldForm = this.fb.group({
      name: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.getCurrentUser()
    this.imageUrl = '/assets/img/default-profile.png';
    this.getEmployees()
    this.getLeaveCards()
    this.pageState()
    this.getPositions()
    this.getBranchDepartment();
    this.getSalaryGradeMatrix();
    this.getDivisions();
    this.getAllUsers();
    this.initialfamilyBackgroundFormValue = this.familyBackgroundForm.value
    setTimeout(() => {
      this.loadFields();
    }, 3500); 
  }

  openAddFieldModal() {
    this.modalService.open(this.addFieldModal, { centered: true, backdrop: false, keyboard: false });
  }

  closeModal(modal: any) {
    this.addFieldForm.reset();
    modal.dismiss();
  }

  loadFields() {
    const employeeId = this.form.get('id_no')?.value;
  
    if (!employeeId) {
      console.error('Employee ID is required to load fields.');
      return;
    }
  
    // Use the employeeId (`id_no`) to fetch employee data using `getEmployeeById()`
    this.service.getEmployeeById(employeeId).subscribe(
      response => {
        if (response?.docs && response.docs.length > 0) {
          const employeeDoc = response.docs[0]; // Retrieve the employee document
  
          if (employeeDoc?.serviceInformation?.newfield) {
            // Extract new fields from `serviceInformation.newfield`
            this.additionalFields = Object.entries(employeeDoc.serviceInformation.newfield).map(
              ([key, value]) => ({
                name: key,
                amount: value as number
              })
            );
          } else {
            this.additionalFields = []; // Set to empty if no new fields exist
          }
        } else {
          console.error('No employee document found.');
        }
      },
      error => {
        console.error('Error loading fields:', error);
      }
    );
  }  

  saveField(modal: any) {
    if (this.addFieldForm.valid) {
      const fieldName = this.addFieldForm.get('name')?.value;
      const fieldAmount = this.addFieldForm.get('amount')?.value;
  
      // Get current employee ID from the form
      const employeeId = this.form.get('id_no')?.value;
  
      if (!employeeId) {
        console.error('Employee ID is required to add a new field.');
        return;
      }
  
      // Merge the new field with the existing `newfield` data in the form
      const currentNewfield = this.form.get(['serviceInformation', 'newfield'])?.value || {};
      const updatedNewfield = { ...currentNewfield, [fieldName]: fieldAmount };
  
      // Update the form with the new `newfield` values
      this.form.patchValue({
        serviceInformation: {
          ...this.form.get('serviceInformation')?.value,
          newfield: updatedNewfield
        }
      });
  
      // Update the backend with the newly updated form data
      this.service.addFieldToUser(employeeId, updatedNewfield).subscribe(
        response => {
          console.log('Field successfully added:', response);
  
          // Update `additionalFields` to reflect the new field in the UI immediately
          this.additionalFields.push({
            name: fieldName,
            amount: fieldAmount
          });
  
          // Reset the form used for adding new fields
          this.addFieldForm.reset();
          modal.close();
        },
        error => {
          console.error('Error adding field:', error);
        }
      );
    } else {
      this.addFieldForm.markAllAsTouched();
    }
  }  

  filter(): void {
    const filterValue = this.input.nativeElement.value.toLowerCase();
    this.filteredOptions = this.employees.filter(employee => {
      const idMatch = employee.doc.id_no.includes(filterValue);
      const lastNameMatch = employee.doc.lastName.toLowerCase().includes(filterValue);
      const firstNameMatch = employee.doc.firstName.toLowerCase().includes(filterValue);
      const middleNameMatch = employee.doc.middleName && employee.doc.middleName.toLowerCase().includes(filterValue);

      // Return true if any of the fields match the filterValue
      return idMatch || lastNameMatch || firstNameMatch || middleNameMatch;
    });
  }

  selectEmp(e){
    if (e.isUserInput) {
      console.log(e.source.value)
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

  getAllUsers(){
    this.profileService.getUser().subscribe((response: any) => {
      this.allUsers = response.rows
    })
  }
  /**
   * Get Positions
   */
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

  /**
   * Get Position Name
   */
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

  ngOnDestroy(): void {
    // localStorage.removeItem('pageState')
    localStorage.removeItem('tabState')
    localStorage.removeItem('employeeId')
  }

  handleUpload(event, module) {
    
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files ? inputElement.files[0] : null;
    const reader = new FileReader();
    const allowedFileTypes = ['application/pdf'];

    // Reset error state before new validation
    this.uploadError = '';
    this.isFileValid = true; // Assume the file is valid initially

    if (file && !allowedFileTypes.includes(file.type)) {
        this.uploadError = 'Only PDF files are allowed.';
        
        // Mark the input as touched to indicate error visually
        // inputElement.classList.add('is-invalid');
        
        // Reset the input field to allow new selection
        inputElement.value = '';
        // Mark the file as invalid
        this.isFileValid = false;
        return;
    }

    // Remove error indication if the file is valid
    // inputElement.classList.remove('is-invalid');

    if (file) {
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (module === 'clinicAttachments') {
                this.submitClinicAttachment({ name: file.name, data: reader.result, date: this.dateToday });
            }
            if (module === 'createClinicAttachments') {
                this.submitCreateClinicAttachment({ name: file.name, data: reader.result });
            }
            if (module === 'documents') {
                this.documentForm.get('name').patchValue(file.name);
                this.documentForm.get('data').patchValue(reader.result);
            }
        };
    }
}

  /**
   * Setting Page State when reloaded
   */
  pageState() {
    localStorage.setItem('pageState', this.page)
    if (localStorage.getItem('pageState') != this.page) {
      localStorage.setItem('tabState', 'personalInfo')
    } else {
      localStorage.setItem('tabState', this.tab)
    }
  }

  /**
   * Reloads Page
   */
  reload() {
    // save current route first
    const currentRoute = this.router.url;
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.navigate(['the201File/employee-profile/' + this.f.get('_id').value]);
  }

  /**
   * Add Family Template
   * @returns
   */
  addFamilyTemplate() {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.pattern('[a-zA-Z ]*')]],
      lastName: ['', [Validators.required, Validators.pattern('[a-zA-Z ]*')]],
      middleName: ['', Validators.pattern('[a-zA-Z ]*')],
      relationship: ['Spouse', Validators.pattern('[a-zA-Z ]*')],
      mobileNumber: ['', [Validators.pattern('[0-9 ]*')]],
      telephone: ['', [Validators.pattern('[0-9 ]*')]],
      email: ['', Validators.email],
      completeAddress: [''],
      occupation: [''],
      companyName: [''],
      companyAddress: [''],
    })
  }

  /**
   * Add Child Template
   * @returns
   */
  addChildTemplate() {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.pattern('[a-zA-Z. ]*')]],
      birthDate: [null, [Validators.required]],
    })
  }

  /**
   * Add Educational Attainment Template
   * @returns
   */
  addEducationalAttainmentTemplate() {
    return this.fb.group({
      level: [null, [Validators.required]],
      schoolName: [null, [Validators.required]],
      inclusiveDateOfAttendance: [null, [Validators.required]],
      schoolAddress: [null],
      course: [null],
      yearGraduated: [null],
      highestGrade: [null],
      awards: [null],
    })
  }

  /**
   * Add Work Experience Template
   * @returns
   */
  addJobExperienceTemplate() {
    return this.fb.group({
      dateStart: [null, [Validators.required]],
      dateEnd: [null, [Validators.required]],
      placeOfAssignment: [null, [Validators.required]],
      positionTitle: [null, [Validators.required]],
      present: [false],
      isGovernmentOffice: [false],
      salaryGrade: [false],
      basicPay: [null],
      salaryType: [null],
      status: [null],
    })
  }

  /**
   * Add Eligibility Examination Template
   * @returns
   */
  addEligibilityExaminationTemplate() {
    return this.fb.group({
      dateOfExamination: [null, [Validators.required]],
      placeOfExamination: [null, [Validators.required]],
      careerService: [null, [Validators.required]],
      rating: [null, [Validators.required]],
      licenseNumber: [null],
      releaseDate: [null],
      status: ['saved'],
    })
  }

  /**
   * Add Work Involvement Template
   * @returns
   */
  addWorkInvolvementTemplate() {
    return this.fb.group({
      nameOfOrganization: [null, [Validators.required]],
      inclusiveDateFrom: [null, [Validators.required]],
      inclusiveDateTo: [null, [Validators.required]],
      positionTitle: [null, [Validators.required]],
      totalHours: [null, [Validators.required]],
      status: ['saved'],
    })
  }

  /**
   * Add Training Template
   * @returns
   */
  addTrainingTemplate() {
    return this.fb.group({
      titleOfSeminar: [null, [Validators.required]],
      inclusiveDateFrom: [null, [Validators.required]],
      inclusiveDateTo: [null, [Validators.required]],
      numberOfHours: [null, [Validators.required]],
      conductedBy: [null, [Validators.required]],
      withCertificate: [null],
      status: ['Saved'],
    })
  }

  /**
   * Add Other Template
   * @returns
   */
  addOtherTemplate() {
    return this.fb.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.required]],
      type: [null, [Validators.required]],
      status: ['Saved'],
    })
  }

  /**
   * Add Document Template
   * @returns
   */
  addDocumentTemplate() {
    return this.fb.group({
      particular: [null],
      file: [null],
      name: [null],
      data: [null],
      date: [this.dateToday],
      remarks: ['-'],
      hasAttachment: ['No'],
    })
  }

  /**
   * Add Health Record Template
   * @returns
   */
  addHealthRecordTemplate() {
    return this.fb.group({
      date: [this.dateToday],
      complaint: [null, Validators.required],
      diagnosis: [null],
      treatment: [null],
      laboratory: [null],
      physician: [null],
      status: ['Saved'],
    })
  }

  /**
   * Add Discipline Management Template
   * @returns
   */
  addDisciplineManagementTemplate() {
    return this.fb.group({
      referenceNumber: [Math.floor(Math.random() * 9999999999) + 1],
      dateOfOffense: [null, Validators.required],
      degree: [null],
      actionPeriodFrom: [null],
      actionPeriodTo: [null],
      offense: [null, Validators.required],
      action: [null, Validators.required],
      employeeExplanation: [null, Validators.required],
      date: [this.dateToday],
      remarks: [null],
    })
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

  /**
   * Add Clinic Template
   * @returns
   */
  addClinicTemplate() {
    return this.fb.group({
      date: [this.dateToday],
      complaint: [null, Validators.required],
      diagnosis: [null],
      treatment: [null],
      laboratory: [null],
      physician: [null],
      clinicAttachments: [[]]
    })
  }

  /**
   * Add Clinic Attachment Template
   * @returns
   */
  addClinicAttachmentTemplate() {
    return this.fb.group({
      name: [null],
      data: [null],
      date: [this.dateToday],
    })
  }

  get f() {
    return this.form
  }

  get children(): FormArray {
    return this.familyBackgroundForm.get('children') as FormArray;
  }

  get fm() {
    return this.familyBackgroundForm
  }

  get ce() {
    return this.createEmployeeForm
  }

  get eaf() {
    return this.educationalAttainmentForm
  }

  get je() {
    return this.jobExperienceForm
  }

  get ee() {
    return this.eligibilityExaminationForm
  }

  get wi() {
    return this.workInvolvementForm
  }

  get t() {
    return this.trainingForm
  }

  get o() {
    return this.otherForm
  }

  get d() {
    return this.documentForm
  }

  get hr() {
    return this.healthRecordForm
  }

  get dm() {
    return this.disciplineManagementForm
  }

  get sr() {
    return this.serviceRecordForm
  }

  get c() {
    return this.clinicForm
  }

  get cc() {
    return this.createClinicForm
  }

  get familyBackground(): FormGroup {
    return this.f.get('familyBackground') as FormGroup
  }

  get educationalAttainments(): FormArray {
    return this.f.get('educationalAttainments') as FormArray
  }

  get childrenList(): FormArray {
    return this.f.get('children') as FormArray
  }

  get jobExperiences(): FormArray {
    return this.f.get('jobExperiences') as FormArray
  }

  get eligibilityExaminations(): FormArray {
    return this.f.get('eligibilityExaminations') as FormArray
  }

  get workInvolvements(): FormArray {
    return this.f.get('workInvolvements') as FormArray
  }

  get trainings(): FormArray {
    return this.f.get('trainings') as FormArray
  }

  get others(): FormArray {
    return this.f.get('others') as FormArray
  }

  get documents(): FormArray {
    return this.f.get('documents') as FormArray
  }

  get healthRecords(): FormArray {
    return this.f.get('healthRecords') as FormArray
  }

  get disciplineManagements(): FormArray {
    return this.f.get('disciplineManagements') as FormArray
  }

  get serviceRecords(): FormArray {
    return this.f.get('serviceRecords') as FormArray
  }

  get clinics(): FormArray {
    return this.f.get('clinics') as FormArray
  }

  get createClinics(): FormArray {
    return this.f.get('clinics') as FormArray
  }

  get clinicAttachments(): FormArray {
    return this.clinicForm.get('clinicAttachments') as FormArray
  }

  get createClinicAttachments(): FormArray {
    return this.createClinicForm.get('clinicAttachments') as FormArray
  }

  /**
   * Set Schedule
   * @param value
   */
  setSchedule(value) {
    this.weekdaysData =  []
    setTimeout(() => {
      this.weekdaysData = [
        {day: 'Sunday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
        {day: 'Monday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
        {day: 'Tuesday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
        {day: 'Wednesday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
        {day: 'Thursday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
        {day: 'Friday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
        {day: 'Saturday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
      ]
      if (value == 'Regular 8:00 - 5:00') {
        this.weekdaysData.map(data => {
          data.timeIn = '8:00 AM'
          data.timeOut = '5:00 PM'
          data.breakHours = 1
          data.totalHours = 8
          if (data.day == 'Saturday' || data.day == 'Sunday') {
            data.noWork = 'Yes'
            data.timeIn = ''
            data.timeOut = ''
            data.breakHours = 0
            data.totalHours = 0
          }
        })
        this.weekdaysData[this.weekdaysData.length - 1].noWork = 'Yes'
      } else if (value == 'QC 7AM - 4 PM') {
        this.weekdaysData.map(data => {
          if (!(data.day == 'Sunday' || data.day == 'Saturday')) {
            data.timeIn = '7:00 AM'
            data.timeOut = '4:00 PM'
            data.breakHours = 1
            data.totalHours = 8
          } else {
            data.noWork = 'Yes'
            data.timeIn = ''
            data.timeOut = ''
            data.breakHours = 0
            data.totalHours = 0
          }
        })
      } else {
        this.weekdaysData.map(data => {
          data.timeIn = ''
          data.timeOut = ''
          data.breakHours = 0
          data.totalHours = 0
          data.noWork = 'No'
        })
      }
    }, 1000);
  }

  /**
   * Download File
   * @param data
   */
  downloadFile(data) {
    const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
      const byteCharacters = atob(b64Data);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, {type: contentType});
      return blob;
    }
    let contentType = 'text/csv';
    if (data.name.includes('png')) {
      contentType = 'image/png'
    } else if (data.name.includes('csv')) {
      contentType = 'text/csv'
    } else if (data.name.includes('xlxs')) {
      contentType = 'text/xlxs'
    } else if (data.name.includes('jpeg')) {
      contentType = 'image/jpeg'
    } else if (data.name.includes('pdf')) {
      contentType = 'application/pdf'
    } else if (data.name.includes('jpg')) {
      contentType = 'image/jpg'
    }

    const b64Data = data.data.split(',')[1];

    const blob = b64toBlob(b64Data, contentType);
    const blobUrl = URL.createObjectURL(blob);

    const img = document.createElement('img');
    img.src = blobUrl;
    document.body.appendChild(img);
    // window.open(blobUrl)
    let a = document.createElement('a');
    a.setAttribute('style', 'display: none');
    a.href = blobUrl;
    a.download = data.name;
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    a.remove();
    // var url = data
    // fetch(url)
    // .then(res => {
    //   res.blob()
    // })
    // .then(data => {
    //   const blob = new Blob([data]);
    //   const url= window.URL.createObjectURL(blob);
    //   window.open(url);
    // })
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
        // console.log('id', this.id);
  
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
  
        // console.log(data);
        this.setValues(data);  // Set form values or handle the selected employee data
        this.loading = false;
      },
      (error) => {
        this.toastr.error(error.error.reason);
        this.loading = false;
      }
    );
  }


  setValues(data){
    this.form.reset()
    console.log('Employee ID:', data?.id_no);
    this.form.patchValue({
      id_no: data?.id_no
    });
    if (data?.id_no) {
      this.loadFields();
    }

    if(data && data._attachments){
      if('profilePic' in data._attachments){
        console.log(data._attachments)
        var keys = Object.keys(data._attachments)
        var type = data._attachments[keys[0]].content_type
        this.http.get(environment.globalUrl + `/employees/${data._id}/profilePic`, {
          responseType: 'blob',
          headers: {
            'Authorization': 'Basic ' + btoa('admin:h@n@')
          }
        })
        .toPromise().then(response => {
          var xx = URL.createObjectURL(response);
          this.imageUrl = (xx).toString()
        })
      }
      else{
        this.imageUrl = '/assets/img/default-profile.png';
      }
    }
    else{
      this.form.removeControl('_attachments')
      this.imageUrl = '/assets/img/default-profile.png';
    }
    this.children.clear()
    this.educationalAttainments.clear()
    this.jobExperiences.clear()
    this.eligibilityExaminations.clear()
    this.workInvolvements.clear()
    this.trainings.clear()
    this.others.clear()
    this.documents.clear()
    this.healthRecords.clear()
    this.disciplineManagements.clear()
    this.serviceRecords.clear()
    this.clinics.clear()
    this.form.patchValue(data)
    // var userData = this.allUsers.find((u) => u.doc.id_no == this.previousID && u.doc.creationDate == this.f.get('creationDate').value)
    // console.log(userData)
    // console.log(this.form.value)
    this.form.controls.attendanceSettings.patchValue({attendanceId: data?.id_no})
    if (this.f.get('attendanceSettings.scheduleTemplate').value) {
      this.setSchedule(this.f.get('attendanceSettings.scheduleTemplate').value)
    }
    // console.log(data?.familyBackground)
    this.familyBackgroundForm.patchValue(data?.familyBackground)
    if(data && data.familyBackground){
      data.familyBackground.children?.map((data) => {
        this.children.push(this.addChildTemplate());
        this.children.at(this.children.length -1).patchValue(data)
      });
    }
    this.educBackgroundList = []
    this.educBackgroundList = data?.educationalAttainments
    data?.educationalAttainments?.forEach(data => {
      this.educationalAttainments.push(this.addEducationalAttainmentTemplate())
      this.educationalAttainments.at(this.educationalAttainments.length - 1).patchValue(data)
    });
    
    this.jobExpList = []
    this.jobExpList = data?.jobExperiences
    data?.jobExperiences?.forEach(data => {
      this.jobExperiences.push(this.addJobExperienceTemplate())
      this.jobExperiences.at(this.jobExperiences.length - 1).patchValue(data)
    });
    
    this.eligibilityExamList = []
    this.eligibilityExamList = data?.eligibilityExaminations
    data?.eligibilityExaminations?.forEach(data => {
      this.eligibilityExaminations.push(this.addEligibilityExaminationTemplate())
      this.eligibilityExaminations.at(this.eligibilityExaminations.length - 1).patchValue(data)
    });
    
    this.workInvList = []
    this.workInvList = data?.workInvolvements
    data?.workInvolvements?.forEach(data => {
      this.workInvolvements.push(this.addWorkInvolvementTemplate())
      this.workInvolvements.at(this.workInvolvements.length - 1).patchValue(data)
    });
    
    this.trainingsList = []
    this.trainingsList = data?.trainings
    data?.trainings?.forEach(data => {
      this.trainings.push(this.addTrainingTemplate())
      this.trainings.at(this.trainings.length - 1).patchValue(data)
    });
    
    this.othersList = []
    this.othersList = data?.others
    data?.others?.forEach(data => {
      this.others.push(this.addOtherTemplate())
      this.others.at(this.others.length - 1).patchValue(data)
    });

    this.documentsList = []
    this.documentsList = data?.documents
    data?.documents?.forEach(data => {
      this.documents.push(this.addDocumentTemplate())
      this.documents.at(this.documents.length - 1).patchValue(data)
    });

    this.healthRecordsList = [];
    this.healthRecordsList = data?.healthRecords;
    data?.healthRecords?.forEach(data => {
      this.healthRecords.push(this.addHealthRecordTemplate())
      this.healthRecords.at(this.healthRecords.length - 1).patchValue(data)
    });
    
    this.dispManagementList = [];
    this.dispManagementList = data?.disciplineManagements;
    data?.disciplineManagements?.forEach(data => {
      this.disciplineManagements.push(this.addDisciplineManagementTemplate())
      this.disciplineManagements.at(this.disciplineManagements.length - 1).patchValue(data)
    });

    this.serviceRecordList = [];
    this.serviceRecordList = data?.serviceRecords;
    data?.serviceRecords?.forEach(data => {
      this.serviceRecords.push(this.addServiceRecordTemplate())
      this.serviceRecords.at(this.serviceRecords.length - 1).patchValue(data)
    });

    this.medicalList = [];
    this.medicalList = data?.clinics
    data?.clinics?.forEach(data => {
      this.clinics.push(this.addClinicTemplate())
      this.clinics.at(this.clinics.length - 1).patchValue(data)
      this.form.controls.clinics.value[this.clinics.length - 1].clinicAttachments = data.clinicAttachments
    });

    this.cdr.detectChanges();
  }

  /**
   * Update Employee
   */
  updateEmployee(updateReason?: string, isEditting?: boolean, willBeDeleted?: boolean) {
    this.isUpdating = true;
    var sgMatrix = this.salaryGradeMatrix.find(x=> x.doc.grade == this.form.get(['serviceInformation', 'salaryGrade']).value)
    var branchID = this.getBranchId(this.form.get(['serviceInformation', 'branch']).value);
    var posTitle = this.getPositionName(this.form.get(['serviceInformation', 'position']).value)
    var isPositionChanged = (posTitle != this.form.get('position_title').value);
    var isEmailChanged = (this.previousEmail != this.form.get('email').value);
    if(branchID == false){
      this.toastr.error(`Please update employee's Service Information.`)
      this.isUpdating = false;
    } else if(this.emailExistsValidator()){
      this.toastr.error(`Email is already in use!`)
      this.isUpdating = false;
    } else if (this.form.valid) {
      this.form.patchValue({
        position_title: posTitle,
        branchId: branchID,
        salaryMatrix: sgMatrix?.doc
      });
      this.checkID()
      var duplicate = this.employees.find((e) => e.id != this.f.get('_id').value && this.f.get('id_no').value == e.doc.id_no)
      // if('profilePic' in data._attachments){
      if(duplicate){
        this.toastr.error(`Duplicate ID with employee "${duplicate.doc.lastName}, ${duplicate.doc.firstName} ${duplicate.doc.middleName}"`)
        this.isUpdating = false;
      }
      else{
        this.profileService.updateEmployee(this.form.value).subscribe(
          (response: any) => {
            this.form.patchValue({_rev: response.rev})
            this.changeID()
            if(response.ok){
                if(isPositionChanged || isEmailChanged) this.updateUser(this.form.value);
                this.updateUser(this.form.value);
                this.updateEmployeeCard(this.form.value)
                this.getEmployees()

                if (isEditting)
                {
                  // Use the updateReason if provided, otherwise use the default message
                  const successMessage = updateReason ? `Employee ${updateReason} record updated sucessfully.` : 'Employee data updated successfully.';
                  this.toastr.success(successMessage);
                }
                else if (willBeDeleted)
                {
                  // Use the updateReason if provided, otherwise use the default message
                  const successMessage = updateReason ? `Employee ${updateReason} record deleted sucessfully.` : 'Employee data updated successfully.';
                  this.toastr.success(successMessage);
                }
                else
                {
                  // Use the updateReason if provided, otherwise use the default message
                  const successMessage = updateReason ? `Employee ${updateReason} record created sucessfully.` : 'Employee data updated successfully.';
                  this.toastr.success(successMessage);
                }
            }
            this.isUpdating = false;
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    } else {
      this.toastr.error('Check if the required fields has value.')
      if (this.f.get('serviceInformation').invalid && (this.f.get('firstName').valid && this.f.get('lastName').valid && this.f.get('birthDate').valid)) {
        this.page = 'serviceInformation'
      }
      this.form.markAllAsTouched()
      this.isUpdating = false;
    }
  }

  /**
   *Update Employee Id
   */
  updateEmployeeId(id){
    console.log(id)
    console.log('id', this.checkID())

    var duplicate = this.employees.find((e) => e.id != this.f.get('_id').value && this.f.get('id_no').value == e.doc.id_no)
    if(this.checkID()){
        this.toastr.error(`Duplicate ID with employee "${duplicate.doc.lastName}, ${duplicate.doc.firstName} ${duplicate.doc.middleName}"`)
        // this.isUpdating = false;
    } else {
      this.profileService.updateEmployee(this.form.value).subscribe(
        (response: any) => {
          this.form.patchValue({_rev: response.rev})
          this.changeID()
          if(response.ok){
              this.updateUser(this.form.value);
              this.updateEmployeeCard(this.form.value)
              this.getEmployees()
          }
          this.toastr.success('Employee ID updated successfully.')
          this.isUpdating = false;
          this.isEditId = !this.isEditId
        },
        (error) => {
          this.toastr.error(error.error.reason)
        }
      )
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
      // this.familyBackground.clear()
      this.educationalAttainments.clear()
      this.jobExperiences.clear()
      this.eligibilityExaminations.clear()
      this.workInvolvements.clear()
      this.trainings.clear()
      this.others.clear()
      this.documents.clear()
      this.healthRecords.clear()
      this.disciplineManagements.clear()
      this.serviceRecords.clear()
      this.clinics.clear()
      this.form.patchValue(data?.doc)
      this.familyBackground.patchValue(data?.doc.familyBackground)

      // data?.doc.familyBackground?.forEach(data => {
      //   this.familyBackground.push(this.addFamilyTemplate())
      //   this.familyBackground.at(this.familyBackground.length - 1).patchValue(data)
      // });
      this.educBackgroundList = []
      this.educBackgroundList = data.doc.educationalAttainments
      data?.doc.educationalAttainments?.forEach(data => {
        this.educationalAttainments.push(this.addEducationalAttainmentTemplate())
        this.educationalAttainments.at(this.educationalAttainments.length - 1).patchValue(data)
      });
      
      this.jobExpList = []
      this.jobExpList = data.doc.jobExperiences
      data?.doc.jobExperiences?.forEach(data => {
        this.jobExperiences.push(this.addJobExperienceTemplate())
        this.jobExperiences.at(this.jobExperiences.length - 1).patchValue(data)
      });
      
      this.eligibilityExamList = []
      this.eligibilityExamList = data?.doc.eligibilityExaminations
      data?.doc.eligibilityExaminations?.forEach(data => {
        this.eligibilityExaminations.push(this.addEligibilityExaminationTemplate())
        this.eligibilityExaminations.at(this.eligibilityExaminations.length - 1).patchValue(data)
      });
      
      this.workInvList = []
      this.workInvList = data?.doc.workInvolvements
      data?.doc.workInvolvements?.forEach(data => {
        this.workInvolvements.push(this.addWorkInvolvementTemplate())
        this.workInvolvements.at(this.workInvolvements.length - 1).patchValue(data)
      });
      
      this.trainingsList = []
      this.trainingsList = data.doc.trainings
      data?.doc.trainings?.forEach(data => {
        this.trainings.push(this.addTrainingTemplate())
        this.trainings.at(this.trainings.length - 1).patchValue(data)
      });
      this.othersList = []
      this.othersList = data?.doc.others
      data?.doc.others?.forEach(data => {
        this.others.push(this.addOtherTemplate())
        this.others.at(this.others.length - 1).patchValue(data)
      });

      this.documentsList = []
      this.documentsList = data?.documents
      data?.doc.documents?.forEach(data => {
        this.documents.push(this.addDocumentTemplate())
        this.documents.at(this.documents.length - 1).patchValue(data)
      });

      this.healthRecordsList = [];
      this.healthRecordsList = data?.healthRecords;
      data?.doc.healthRecords?.forEach(data => {
        this.healthRecords.push(this.addHealthRecordTemplate())
        this.healthRecords.at(this.healthRecords.length - 1).patchValue(data)
      });

      this.dispManagementList = [];
      this.dispManagementList = data?.disciplineManagements;
      data?.doc.disciplineManagements?.forEach(data => {
        this.disciplineManagements.push(this.addDisciplineManagementTemplate())
        this.disciplineManagements.at(this.disciplineManagements.length - 1).patchValue(data)
      });

      this.serviceRecordList = [];
      this.serviceRecordList = data?.serviceRecords;
      data?.doc.serviceRecords?.forEach(data => {
        this.serviceRecords.push(this.addServiceRecordTemplate())
        this.serviceRecords.at(this.serviceRecords.length - 1).patchValue(data)
      });

      this.medicalList = [];
      this.medicalList = data?.clinics
      data?.doc.clinics?.forEach(data => {
        this.clinics.push(this.addClinicTemplate())
        this.clinics.at(this.clinics.length - 1).patchValue(data)
        this.form.controls.clinics.value[this.clinics.length - 1].clinicAttachments = data.clinicAttachments
      });
      // localStorage.setItem('employeeId', event.target.value)
      localStorage.setItem('employeeId', data.id)
      this.setValues(data.doc)
      // this.reload()
    }
  }

  /**
   * Delete Employees
   */
  deleteEmployee() {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.profileService.deleteEmployee(this.form.value).subscribe(
          (response: any) => {
            if(response.ok){
              this.deleteLeaveCard(this.form.get('_id').value)
              this.form.reset()
            }
            this.loading = true;
            this.getEmployees()
            this.toastr.success('Employee deleted successfully.')
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Change Active Status
   */
  changeActiveStatus() {
    this.form.patchValue({isActive: !this.f.get('isActive').value})
    this.updateEmployee('status', true)
  }

  /**
   * Add Family Member
   */
  addFamilyMember() {
    if (this.familyBackgroundForm.valid) {
      // this.familyBackground.push(this.addFamilyTemplate())
      // this.familyBackground.at(this.familyBackground.length - 1).patchValue(this.familyBackgroundForm.value)
      this.updateEmployee('family background', true)
      this.familyBackgroundForm.reset()
      this.familyBackgroundForm.patchValue(this.initialfamilyBackgroundFormValue)
    } else {
      this.familyBackgroundForm.markAllAsTouched()
    }
  }

  /**
   * Add Child
   */
  addChild() {
    (this.familyBackgroundForm.get('children') as FormArray).push(this.addChildTemplate());
  }

  saveChild(){
    if(this.familyBackgroundForm.invalid){
      this.familyBackgroundForm.markAllAsTouched()
    }
    else{
      this.familyBackground.patchValue(this.familyBackgroundForm.value)
      this.updateEmployee('family background', true)
    }
    console.log(this.form.value)

  }

  removeChild(i){
    (this.familyBackgroundForm.get('children') as FormArray).removeAt(i);
  }

  /**
   * Add Family Member
   */
  saveFamilyMember() {
    if (this.familyBackgroundForm.valid) {
      // this.familyBackground.push(this.addFamilyTemplate())
      // this.familyBackground.at(this.editFamilyFormIndex).patchValue(this.familyBackgroundForm.value)
      this.updateEmployee('family background', true)
      this.familyBackgroundForm.reset()
      this.familyBackgroundForm.patchValue(this.initialfamilyBackgroundFormValue)
      this.isEditFamilyForm = false
    } else {
      this.familyBackgroundForm.markAllAsTouched()
    }
  }

  /**
   * Patch Data
   * @param data
   */
  patchData(data, index: number) {
    this.familyBackgroundForm.setValue(data)
    this.isEditFamilyForm = true
    this.editFamilyFormIndex = index
  }

  /**
   * Delete Family
   */
  deleteFamily(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        // this.familyBackground.removeAt(index)
        this.loading = true;
        this.updateEmployee('family background', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Open Modal
   * @param content
   */
  open(content, index?) {
    this.modalService.open(content, { backdrop: false, centered: true, size: 'lg' })
    this.isEditForm = !this.isEditForm
    this.editIndex = index
    this.createClinicForm.reset()
    this.createClinicAttachments.clear()
    if (!this.disciplineManagementForm.get('referenceNumber').value) {
      this.disciplineManagementForm.get('referenceNumber').patchValue(Math.floor(Math.random() * 9999999999) + 1)
    }
    if (!this.disciplineManagementForm.get('date').value) {
      this.disciplineManagementForm.get('date').patchValue(this.dateToday)
    }
  }

  /**
   * Dismiss all modals
   */
  dismiss() {
    this.modalService.dismissAll()
    this.isEditForm = !this.isEditForm
    this.editIndex = null
    this.uploadError = '';
  }
  
  refresh(){
    this.loading = true;
    this.getEmployees()
  }

  /**
   * Submit Create Employee
   */
  submitCreateEmployee() {
    this.isUpdating = true;
    var sgMatrix = this.salaryGradeMatrix.find(x=> x.doc.grade == this.createEmployeeForm.get(['serviceInformation', 'salaryGrade']).value)
    var branchID = this.getBranchId(this.createEmployeeForm.get(['serviceInformation', 'branch']).value);
    var posTitle = this.getPositionName(this.createEmployeeForm.get(['serviceInformation', 'position']).value)
    this.createEmployeeForm.patchValue({
      position_title: posTitle,
      branchId: branchID,
      salaryMatrix: sgMatrix?.doc,
      creationDate: Date.now()
    });

    if (this.createEmployeeForm.valid) {
      var clone = cloneEmployeeUser(this.createEmployeeForm.value)
      // clone.creationDate = Date.now(), -moved to cloneEmployeeUser func
      // clone.setting_id = environment.defaultSetting
      var duplicateID = this.employees.find((e) => this.createEmployeeForm.get('id_no').value == e.doc.id_no)
      var duplicateEmail = this.employees.find((e) => this.createEmployeeForm.get('email').value == e.doc.email)
      if(duplicateID){
        this.toastr.error(`Has duplicate ID with employee "${duplicateID.doc.lastName}, ${duplicateID.doc.firstName} ${duplicateID.doc.middleName}".`)
        this.isUpdating = false;
      }
      else if(duplicateEmail){
        this.toastr.error(`Has duplicate email with employee "${duplicateID.doc.lastName}, ${duplicateID.doc.firstName} ${duplicateID.doc.middleName}".`)
        this.isUpdating = false;
      }
      else{
        this.profileService.createEmployee(this.createEmployeeForm.value).subscribe(
          (response: any) => {
            clone.user_id = response.id;
            if(response.ok){
              this.service.addUser(clone).subscribe((x) => {
                console.log('User saved.')
              })
              let employeeCard = this.newEmployeeCard(this.createEmployeeForm.value, response.id)
              if(employeeCard){
                this.leaveService.addLeaveCard(employeeCard).subscribe((response:any)=>{
                    this.getLeaveCards()
                  }),
                  (error) => { console.log(error)}
               }
            }
            this.toastr.success('New employee created successfully.')
            this.dismiss()
            this.getEmployees()
            this.createEmployeeForm.reset()
            this.isUpdating = false;
            this.loading = true;
          },
          (error) => {
            console.log(error)
            // this.toastr.error(error.error.reason)
          }
        )
      }
    } else {
      this.isUpdating = false;
      this.createEmployeeForm.markAllAsTouched()
    }
  }

  /**
   * Submit Educational Attainment
   */
  submitEducationalAttainment() {
    if (this.educationalAttainmentForm.valid) {
      this.loading = true;
      if (this.editIndex != null) {
        this.educationalAttainments.at(this.editIndex).patchValue(this.educationalAttainmentForm.value)
        this.educBackgroundList = []
        this.updateEmployee('educational background', true)
        this.educationalAttainmentForm.reset()
        this.dismiss()
      } else {
        this.educationalAttainments.push(this.addEducationalAttainmentTemplate())
        this.educationalAttainments.at(this.educationalAttainments.length - 1).patchValue(this.educationalAttainmentForm.value)
        this.educBackgroundList = []
        this.updateEmployee('educational background')
        this.educationalAttainmentForm.reset()
        this.dismiss()
      }
    } else {
      this.educationalAttainmentForm.markAllAsTouched()
    }
  }


  /**
   * Delete Educational Attainment
   */
  deleteEducationalAttainment(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.educationalAttainments.removeAt(index)
        this.educBackgroundList = []
        console.log('here')
        this.updateEmployee('educational background', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Edit Educational Attainment
   * @param data
   * @param content
   */
  editEducationalAttainment(data, content, index) {
    this.educationalAttainmentForm.reset()
    this.educationalAttainmentForm.patchValue(data)
    this.open(content, index)
  }

  /**
   * Submit Work Experience
   */
  submitJobExperience() {
    if (this.jobExperienceForm.valid) {
      this.loading = true;
      if (this.editIndex != null) {
        this.jobExperiences.at(this.editIndex).patchValue(this.jobExperienceForm.value)
        this.jobExpList=[]
        this.updateEmployee('work experience', true)
        this.jobExperienceForm.reset()
        this.dismiss()
      } else {
        this.jobExperiences.push(this.addJobExperienceTemplate())
        this.jobExperiences.at(this.jobExperiences.length - 1).patchValue(this.jobExperienceForm.value)
        this.jobExpList = []
        this.updateEmployee('work experience')
        this.jobExperienceForm.reset()
        this.dismiss()
      }
    } else {
      this.jobExperienceForm.markAllAsTouched()
    }
  }

  /**
   * Delete Work Experience
   * @param index
   */
  deleteJobExperience(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.jobExpList = []
        this.jobExperiences.removeAt(index)
        this.updateEmployee('work experience', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Edit Work Experience
   * @param data
   * @param content
   */
  editJobExperience(data, content, index) {
    this.jobExperienceForm.reset()
    this.jobExperienceForm.patchValue(data)
    this.open(content, index)
  }

  /**
   * Submit Eligibility Examination
   */
  submitEligibilityExamination() {
    if (this.eligibilityExaminationForm.valid) {
      this.loading = true;
      if (this.editIndex != null) {
        this.eligibilityExaminations.at(this.editIndex).patchValue(this.eligibilityExaminationForm.value)
        this.eligibilityExamList = []
        this.updateEmployee('civil service eligibility', true)
        this.eligibilityExaminationForm.reset()
        this.dismiss()
      } else {
        this.eligibilityExaminations.push(this.addEligibilityExaminationTemplate())
        this.eligibilityExaminations.at(this.eligibilityExaminations.length - 1).patchValue(this.eligibilityExaminationForm.value)
        this.eligibilityExamList = []
        this.updateEmployee('civil service eligibility')
        this.eligibilityExaminationForm.reset()
        this.dismiss()
      }
    } else {
      this.eligibilityExaminationForm.markAllAsTouched()
    }
  }

  /**
   * Delete Eligibility Examination
   * @param index
   */
  deleteEligibilityExamination(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.eligibilityExamList = []
        this.eligibilityExaminations.removeAt(index)
        this.updateEmployee('civil service eligibility', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Edit Eligibility Examination
   * @param data
   * @param content
   */
  editEligibilityExamination(data, content, index) {
    this.eligibilityExaminationForm.reset()
    this.eligibilityExaminationForm.patchValue(data)
    this.open(content, index)
  }

  /**
   * Submit Work Involvement
   */
  submitWorkInvolvement() {
    if (this.workInvolvementForm.valid) {
      this.loading = true;
      if (this.editIndex) {
        this.workInvolvements.at(this.editIndex).patchValue(this.workInvolvementForm.value)
        this.workInvList = []
        this.updateEmployee('work involvement', true)
        this.workInvolvementForm.reset()
        this.dismiss()
      } else {
        this.workInvolvements.push(this.addWorkInvolvementTemplate())
        this.workInvolvements.at(this.workInvolvements.length - 1).patchValue(this.workInvolvementForm.value)
        this.workInvList = []
        this.updateEmployee('work involvement')
        this.workInvolvementForm.reset()
        this.dismiss()
      }
    } else {
      this.workInvolvementForm.markAllAsTouched()
    }
  }

  /**
   * Delete Work Involvement
   * @param index
   */
  deleteWorkInvolvement(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.workInvList = []
        this.workInvolvements.removeAt(index)
        this.updateEmployee('work involvement', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Edit Work Involvement
   * @param data
   * @param content
   */
  editWorkInvolvement(data, content, index) {
    this.workInvolvementForm.reset()
    this.workInvolvementForm.patchValue(data)
    this.open(content, index)
  }

  /**
   * Submit Training
   */
  submitTraining() {
    if (this.trainingForm.valid) {
      this.loading = true;
      if (this.editIndex != null) {
        this.trainings.at(this.editIndex).patchValue(this.trainingForm.value)
        this.trainingsList = []
        this.updateEmployee('trainings attended', true)
        this.trainingForm.reset()
        this.dismiss()
      } else {
        this.trainings.push(this.addTrainingTemplate())
        this.trainings.at(this.trainings.length - 1).patchValue(this.trainingForm.value)
        this.trainingsList = []
        this.updateEmployee('trainings attended')
        this.trainingForm.reset()
        this.dismiss()
      }
    } else {
      this.trainingForm.markAllAsTouched()
    }
  }

  /**
   * Delete Training
   * @param index
   */
  deleteTraining(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.trainingsList = []
        this.trainings.removeAt(index)
        this.updateEmployee('trainings attended', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Edit Training
   * @param data
   * @param content
   */
  editTraining(data, content, index) {
    this.trainingForm.reset()
    this.trainingForm.patchValue(data)
    this.open(content, index)
  }

  /**
   * Submit Other
   */
  submitOther() {
    if (this.otherForm.valid) {
      this.loading = true;
      if (this.editIndex != null) {
        this.others.at(this.editIndex).patchValue(this.otherForm.value)
        this.othersList = []
        this.updateEmployee('additional information', true)
        this.otherForm.reset()
        this.dismiss()
      } else {
        this.others.push(this.addOtherTemplate())
        this.others.at(this.others.length - 1).patchValue(this.otherForm.value)
        this.othersList = []
        this.updateEmployee('additional information')
        this.otherForm.reset()
        this.dismiss()
      }
    } else {
      this.otherForm.markAllAsTouched()
    }
  }

  /**
   * Delete Other
   * @param index
   */
  deleteOther(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.othersList = []
        this.others.removeAt(index)
        this.updateEmployee('additional information', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Edit Other
   * @param data
   * @param content
   */
  editOther(data, content, index) {
    this.otherForm.reset()
    this.otherForm.patchValue(data)
    this.open(content, index)
  }

  /**
   * Submit Document
   */
  submitDocument() {
    if (this.documentForm.valid) {
      this.loading = true;
      if (this.editIndex != null) {
        this.documentsList = []
        this.uploadError = '';
        this.documents.at(this.editIndex).patchValue(this.documentForm.value)
        this.updateEmployee('document', true)
        this.documentForm.reset()
        this.documentForm.get('date').patchValue(this.dateToday)
        this.dismiss()
      } else {
        this.documentsList = []
        this.uploadError = '';
        this.documents.push(this.addDocumentTemplate())
        this.documents.at(this.documents.length - 1).patchValue(this.documentForm.value);
        this.updateEmployee('document')
        this.documentForm.reset()
        this.documentForm.get('date').patchValue(this.dateToday)
        this.dismiss()
      }
    } else {
      this.documentForm.markAllAsTouched()
    }
  }

  /**
   * Delete Document
   * @param index
   */
  deleteDocument(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.documents.removeAt(index)
        this.documentsList = []
        this.updateEmployee('document', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Edit Document
   * @param data
   * @param content
   */
  editDocument(data, content, index) {
    this.documentForm.reset()
    this.documentForm.patchValue(data)
    this.open(content, index)
  }

  /**
   * Submit Health Record
   */
  submitHealthRecord() {
    if (this.healthRecordForm.valid) {
      this.loading = true;
      if (this.editIndex != null) {
        this.healthRecords.at(this.editIndex).patchValue(this.healthRecordForm.value)
        this.healthRecordsList = [];
        this.updateEmployee('health', true)
        this.healthRecordForm.reset()
        this.dismiss()
      } else {
        this.healthRecords.push(this.addHealthRecordTemplate())
        this.healthRecords.at(this.healthRecords.length - 1).patchValue(this.healthRecordForm.value)
        this.healthRecordsList = [];
        this.updateEmployee('health')
        this.healthRecordForm.reset()
        this.dismiss()
      }
    } else {
      this.healthRecordForm.markAllAsTouched()
    }
  }

  /**
   * Delete Health Record
   * @param index
   */
  deleteHealthRecord(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.healthRecords.removeAt(index)
        this.healthRecordsList = [];
        this.updateEmployee('health', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Edit Health Record
   * @param data
   * @param content
   */
  editHealthRecord(data, content, index) {
    this.healthRecordForm.reset()
    this.healthRecordForm.patchValue(data)
    this.open(content, index)
  }

  /**
   * Submit Discipline Management
   */
  submitDisciplineManagement() {
    if (this.disciplineManagementForm.valid) {
      this.loading = true;
      if (this.editIndex != null) {
        this.disciplineManagements.at(this.editIndex).patchValue(this.disciplineManagementForm.value)
        this.dispManagementList = []
        this.updateEmployee('discipline', true)
        this.disciplineManagementForm.reset()
        this.disciplineManagementForm.get('referenceNumber').patchValue(Math.floor(Math.random() * 9999999999) + 1)
        this.disciplineManagementForm.get('date').patchValue(this.dateToday)
        this.dismiss()
      } else {
        this.disciplineManagements.push(this.addDisciplineManagementTemplate())
        this.disciplineManagements.at(this.disciplineManagements.length - 1).patchValue(this.disciplineManagementForm.value)
        this.dispManagementList = []
        this.updateEmployee('discipline')
        this.disciplineManagementForm.reset()
        this.disciplineManagementForm.get('referenceNumber').patchValue(Math.floor(Math.random() * 9999999999) + 1)
        this.disciplineManagementForm.get('date').patchValue(this.dateToday)
        this.dismiss()
      }
    } else {
      this.disciplineManagementForm.markAllAsTouched()
    }
  }

  /**
   * Delete Discipline Management
   * @param index
   */
  deleteDisciplineManagement(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.disciplineManagements.removeAt(index)
        this.dispManagementList = []
        this.updateEmployee('discipline', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Edit Discipline Management
   * @param data
   * @param content
   */
  editDisciplineManagement(data, content, index) {
    this.disciplineManagementForm.reset()
    this.disciplineManagementForm.patchValue(data)
    this.open(content, index)
  }

  /**
   * Submit Service Record
   */
  submitServiceRecord() {
    if (this.serviceRecordForm.valid) {
      this.loading = true;
      if (this.editIndex != null) {
        this.serviceRecords.at(this.editIndex).patchValue(this.serviceRecordForm.value)
        this.serviceRecordList = []
        this.updateEmployee('service', true)
        this.serviceRecordForm.reset()
        this.dismiss()
      } else {
        this.serviceRecords.push(this.addServiceRecordTemplate())
        this.serviceRecords.at(this.serviceRecords.length - 1).patchValue(this.serviceRecordForm.value)
        this.serviceRecordList = []
        this.updateEmployee('service')
        this.serviceRecordForm.reset()
        this.dismiss()
      }
    } else {
      this.serviceRecordForm.markAllAsTouched()
    }
  }

  /**
   * Delete Service Record
   * @param index
   */
  deleteServiceRecord(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.serviceRecords.removeAt(index)
        this.serviceRecordList = []
        this.updateEmployee('service', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Edit Service Record
   * @param data
   * @param content
   */
  editServiceRecord(data, content, index) {
    this.serviceRecordForm.reset()
    this.serviceRecordForm.patchValue(data)
    this.open(content, index)
  }

  /**
   * Submit Clinic
   */
  submitClinic() {
    if (this.clinicForm.valid) {
      this.loading = true;
      if (this.editIndex != null) {
        this.isFileValid = true;
        this.uploadError = '';
        this.clinics.at(this.editIndex).patchValue(this.clinicForm.value)
        this.clinics.value[this.editIndex].clinicAttachments = this.clinicAttachments.value
        this.medicalList = [];
        this.updateEmployee('medical', true)
        this.clinicForm.reset()
        this.clinicAttachments.reset()
        this.dismiss()
      }
    } else {
      this.clinicForm.markAllAsTouched()
    }
  }

  /**
   * Submit Clinic Attachment
   */
  submitClinicAttachment(data) {
    if (this.clinicForm.controls.clinicAttachments.value) {
      this.clinicForm.controls.clinicAttachments.value[this.clinicForm.controls.clinicAttachments.value.length] = data
    } else {
      this.clinicForm.controls.clinicAttachments.setValue([])
      this.clinicForm.controls.clinicAttachments.value[this.clinicForm.controls.clinicAttachments.value.length] = data
    }
    this.createClinicAttachments.push(this.addClinicAttachmentTemplate())
    this.createClinicAttachments.at(this.createClinicAttachments.length - 1).patchValue(data)

  }

  /**
   * Delete Clinic
   * @param index
   */
  deleteClinic(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.clinics.removeAt(index)
        this.medicalList = [];
        this.updateEmployee('medical', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Delete Clinic Attachment
   * @param index
   */
  deleteClinicAttachment(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.clinicForm.controls.clinicAttachments.value.splice(index, 1)
        this.clinicForm.controls.clinicAttachments.patchValue(this.clinicForm.controls.clinicAttachments.value)
        this.updateEmployee('medical attatchment', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Edit Clinic
   * @param data
   * @param content
   */
  editClinic(data, content, index) {
    this.clinicForm.patchValue(data)
    this.clinicForm.controls.clinicAttachments.patchValue(data.clinicAttachments)
    this.open(content, index)
  }

  /**
   * Submit Create Clinic
   */
  submitCreateClinic() {
    if (this.createClinicForm.valid) {
      this.loading = true;
      this.isFileValid = true;
      this.uploadError = '';
      this.clinics.push(this.addClinicTemplate())
      this.clinics.at(this.createClinics.length - 1).patchValue(this.createClinicForm.value)
      this.clinics.value[this.clinics.length - 1].clinicAttachments = this.createClinicAttachments.value
      this.medicalList = [];
      this.updateEmployee('medical')
      this.createClinicForm.reset()
      this.createClinicAttachments.reset()
      this.dismiss()
    } else {
      this.createClinicForm.markAllAsTouched()
    }
  }

  /**
   * Submit Create Clinic Attachment
   */
  submitCreateClinicAttachment(data) {
    this.createClinicAttachments.push(this.addClinicAttachmentTemplate())
    this.createClinicAttachments.at(this.createClinicAttachments.length - 1).patchValue(data)
  }

  /**
   * Delete Create Clinic
   * @param index
   */
  deleteCreateClinic(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.createClinics.removeAt(index)
        this.updateEmployee('medical', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Delete Create Clinic Attachment
   * @param index
   */
  deleteCreateClinicAttachment(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.createClinicAttachments.removeAt(index)
        this.updateEmployee('medical attatchment', false, true)
        // Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  /**
   * Edit Create Clinic
   * @param data
   * @param content
   */
  editCreateClinic(data, content, index) {
    this.open(content, index)
      data.clinicAttachments.forEach(data => {
        this.clinicAttachments.push(this.addClinicAttachmentTemplate())
        this.clinicAttachments.at(this.clinicAttachments.length - 1).patchValue(data)
      });
    this.clinicForm.patchValue(data)
  }

  onFileSelected(event) {
    const file = event.target.files[0];
    this.uploadFile(file);
  }

  uploadFile(file: File) {
    var base64 = ''
    console.log(this.form.value)
    this.form.removeControl('_attachments');
    console.log(this.form.value)

    var filereader = new FileReader();
    filereader.readAsDataURL(file);
    filereader.onload = function (evt) {
      base64 = (evt.target.result).toString()
    }

    if (this.form.valid) {
      this.profileService.updateEmployee(this.form.value).subscribe(
        (response: any) => {
          this.form.patchValue({_rev: response.rev})
          // Make an HTTP POST request to upload the file as an attachment
          this.http.put(environment.globalUrl + `/employees/${this.form.get('_id').value}/profilePic?rev=${response.rev}`, file, {
            headers: {
              'Content-Type': file.type,
              'Authorization':  `Basic ${btoa('admin:h@n@')}`
            }
          }).subscribe((response : any) => {
            console.log(response);
            this.form.patchValue({_rev: response.rev})
            // Update the image URL to display the new profile picture
            this.imageUrl = base64;
          });
          this.toastr.success('Employee updated successfully.')
        },
        (error) => {
          this.toastr.error(error.error.reason)
        }
      )
    } else {
      this.toastr.error('Check if the required fields has value.')
      if (this.f.get('serviceInformation').invalid && (this.f.get('firstName').valid && this.f.get('lastName').valid && this.f.get('birthDate').valid)) {
        this.page = 'serviceInformation'
      }
      this.myInputVariable.nativeElement.value = "";
      this.form.markAllAsTouched()
    }


  }

  // print(){
  //   this.http.get('/jasperserver/rest_v2/reports/reports/Personal_Data_Sheet_CSForm_No_212.html?_id="' + this.f.get('_id').value + '"', {
  //     responseType: 'text',
  //     headers: {
  //       'Authorization': 'Basic ' + btoa('jasperadmin:jasperadmin')
  //     }
  //   }).subscribe((response: any) => {
  //     // Handle the response
  //     let printWindow = window.open('', '_blank');
  //     printWindow.document.write(response);
  //     setTimeout(function(){
  //       printWindow.print();
  //     },1000)
  //   });
  // }

  download(type) {
    if(this.f.get('_id').value != '_design/by_branch'){
      const titleMessage = (type === 'print')? 'Opening Print Preview...':'Downloading...';

      // Show the Swal dialog with custom progress bar template
      Swal.fire({
        title: titleMessage,
        // html: '<div class="progress-bar-container"><div class="progress-bar"></div></div>',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(null);
          this.print(type);
        }
      });
    }
  }

  private print(type: string) {
    this.http.get('/jasperserver/rest_v2/reports/reports/Personal_Data_Sheet_CSForm_No_212.pdf?_id="' + this.f.get('_id').value + '"', {
      responseType: 'blob',
      headers: {
        'Authorization': 'Basic ' + btoa('jasperadmin:jasperadmin')
      },
      reportProgress: true, // Enable progress tracking
      observe: 'events' // Observe the HTTP events to track progress
    }).subscribe((event: any) => {
      if (event.type === HttpEventType.DownloadProgress) {
        // Calculate the progress percentage
        const progress = Math.round(100 * event.loaded / event.total);
        // this.updateProgress(progress);
      } else if (event.type === HttpEventType.Response) {
        if(type === 'print'){
          const blob = new Blob([event.body], { type: 'application/pdf' });
          // Create a blob URL and set it as the iframe source
          const blobUrl = window.URL.createObjectURL(blob);
          this.pdfIframe.nativeElement.src = blobUrl;

          setTimeout(() => {
            this.pdfIframe.nativeElement.contentWindow.print();
            //revoke the object URL after printing
            window.URL.revokeObjectURL(blobUrl);
          }, 1000); // Adjust the timeout as needed
        }

        if(type === 'download'){
          const filename = 'Personal_Data_Sheet_CSForm_No_212.pdf';
          // On complete, trigger the file download
          const blob = new Blob([event.body], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(link.href);
        }

        this.closeDialog();
      }
    }, error => {
      // Handle error (optional)
      this.closeDialog();
      Swal.fire('Error', 'Failed to download the file.', 'error');
    });
  }

  private closeDialog() {
    Swal.close();
  }

  isGovernmentOfficeChange(){
    let val = this.jobExperienceForm.get('isGovernmentOffice').value;
    if(val == true){
      this.jobExperienceForm.get('salaryGrade').setValidators([Validators.required])
      this.jobExperienceForm.get('salaryGrade').setValue(null)
      this.jobExperienceForm.get('salaryGrade').updateValueAndValidity()
    }
    else{
      this.jobExperienceForm.get('salaryGrade').clearValidators()
      this.jobExperienceForm.get('salaryGrade').setValue(null)
      this.jobExperienceForm.get('salaryGrade').updateValueAndValidity()
    }
  }

  salaryGradeValidator(control) {
    const value = Number(control.value);
    if (isNaN(value) || value < 1 || value > 33) {
      return { invalidSalaryGrade: true };
    }
    return null;
  }

  getLeaveCards(){
    this.leaveService.getLeaveCard().subscribe((response:any)=>{
      console.log(response)
      this.leaveCards = response.rows
    })
  }

  deleteLeaveCard(id){
    let card = this.leaveCards.find(x=> x.doc.employee_id == id)
    if(card){
      this.leaveService.deleteLeaveCardEntry(card.doc).subscribe((response:any)=>{
        console.log(response)
        this.getLeaveCards()
      }), (error) => { console.log(error)}
    }
  }

  updateEmployeeCard(row){
    let card = this.leaveCards.find(x=> x.doc.employee_id == row._id)

    if(card){
      card.doc.name = `${row.lastName}, ${row.firstName} ${row.middleName} ${row. ext}`;
      card.doc.position_title = row.position_title;
      card.doc.civilStatus = row.civilStatus;
      card.doc.birthDate = row.birthDate;
      card.doc.monthlyRate = row.serviceInformation.monthlyRate;
      card.doc.salaryGrade = row.serviceInformation.salaryGrade;
      card.doc.salaryStep = row.serviceInformation.salaryStep;
      card.doc.dateHired = row.serviceInformation.dateHired;
      card.doc.gsis = row.gsis;
      card.doc.tin = row.tin;
      card.doc.id_no = row.id_no;
      card.doc.department = row.serviceInformation.department;
      card.doc.status = row.serviceInformation.status;

      this.leaveService.addLeaveCard(card.doc).subscribe((response:any)=>{
        console.log(response)
        this.getLeaveCards()
      })
    } else {
      //if user doesn't have a card, create one instead
      let employeeCard = this.newEmployeeCard(row, row._id)
      if(employeeCard){
        this.leaveService.addLeaveCard(employeeCard).subscribe((response:any)=>{
            this.getLeaveCards()
          }),
          (error) => { console.log(error)}
       }
    }
  }

  updateUser(row){
    console.log(row)
    console.log(this.allUsers)
    let userFound = false;

    // if(row.user_id){
    let user = this.allUsers.find(x=> x.doc.user_id == row._id)
      if(!user){
        let id_no = this.allUsers.find(x=> x.doc.id_no == row.id_no) //checks for id_no matches instead
        if(id_no) {
          user = id_no; userFound = true;
        } else {
          let email = this.allUsers.find(x=> x.doc.email == row.email) //checks for email matches instead
          if(email) {user = email; userFound = true;}
        }
      } else userFound = true;

      if(userFound){
        user.doc.firstName = row.firstName
        user.doc.lastName = row.lastName
        user.doc.middleName = row.middleName
        user.doc.email = row.email
        user.doc.id_no = row.id_no
        user.doc.user_id = row._id
        user.doc.designation = row.position_title
        user.doc.contact = row.mobileNumber
        console.log(user)
        this.service.editUser(user.doc, user.id).subscribe((r) => {
          this.getAllUsers()
        }),
        (error) => { console.log(error)}
      } else ('No user found to update.')
    }

  newEmployeeCard(row, id){
    return {
      "name": `${row.lastName}, ${row.firstName} ${(row.middleName!= null && row.middleName!="")?row.middleName:""}`,
      "employee_id": id,
      "position_title": row.position_title,
      "birthDate": null,
      "civilStatus": null,
      "monthlyRate": row.serviceInformation.monthlyRate,
      "salaryGrade": row.serviceInformation.salaryGrade,
      "salaryStep": row.serviceInformation.salaryStep,
      "dateHired": row.serviceInformation.dateHired,
      "gsis": null,
      "tin": null,
      "vlBalance": 0,
      "slBalance": 0,
      "flBalance": 5,
      "totEQUIV": 0,
      "splBalance": 3,
      "card": [],
      "id_no": row.id_no,
      "department": row.serviceInformation.department,
      "status": row.serviceInformation.status
    }
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

  changeID(){
    // console.log(this.previousID, this.f.get('id_no').value)
    // u.doc.creationDate == this.f.get('creationDate').value
    var userData = this.allUsers.find((u) => u.doc.id_no == this.previousID && u.doc.email === this.previousEmail)

    if(this.previousID != this.f.get('id_no').value && userData && this.previousID){
      // console.log(userData)
      userData.doc.id_no = this.f.get('id_no').value
      this.service.editUser(userData.doc, userData.id).subscribe((r) => {
      })
      this.getAllUsers()
    }
  }

  checkID(){
    var duplicate = this.employees.find((e) => e.id != this.f.get('_id').value && this.f.get('id_no').value == e.doc.id_no)
    if(duplicate){
      return true
    }
    return false
  }

  emailExistsCreate():ValidatorFn {
    return (control: FormControl) => {
      const email = control.value;
      const emailExists = this.allUsers?.find(user => user.doc.email === email);
      return emailExists ? { emailExists: true } : null;
    };
  }

  emailExistsValidator() { //checks if email is already in use/exists
      const email = this.form.get('email').value;
      const id_no = this.form.get('id_no').value;

      const emailExists = this.allUsers.filter(user => user.doc.email === email);
      if(emailExists){
        let count = emailExists.filter(em => em.doc?.id_no != id_no)
        return (count.length >= 1)? true:false;
      } else return false
  }

  public truncateFileName(fileName: string, limit: number): string {
    // Get the extension from the file name
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
  
    // Calculate the limit for the truncated file name excluding the extension
    const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExtension.length > limit
      ? nameWithoutExtension.substring(0, limit) + '...'
      : nameWithoutExtension;
  
    // Concatenate the truncated name with the file extension
    return truncatedName + fileExtension;
  }


}

/**
 * user template for newly added employees
 * patches data needed in users
 * @param row employee form value
 */
function cloneEmployeeUser(row){
  var clonedEmployee = {
    'firstName': row.firstName,
    'lastName': row.lastName,
    'middleName': row.middleName,
    'email': row.email,
    'contact': null,
    'designation': row.position_title,
    "setting_id": environment.defaultSetting,
    "isActive": true,
    "department": null,
    "isEmployee": true,
    "creationDate": row.creationDate,
    "id_no": row.id_no,
    "smsNotification": false,
    "smsSetting": null,
    "user_id": null
  };

  // Check if position_title is 'department head' or 'division chief'
  if (row.position_title.toLowerCase() === 'department head' || row.position_title.toLowerCase() === 'division chief') {
    clonedEmployee.department = row.serviceInformation.department;
  }

  return clonedEmployee;
}