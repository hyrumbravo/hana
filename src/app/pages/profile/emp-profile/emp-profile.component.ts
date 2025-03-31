import { Component, ElementRef, Inject, OnChanges, OnDestroy, OnInit, SecurityContext } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
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
import { DatePipe, formatDate } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { environment } from 'environments/environment';
import { ObjService } from '@services/obj-pass/obj.service';


@Component({
  selector: 'app-emp-profile',
  templateUrl: './emp-profile.component.html',
  styleUrls: ['./emp-profile.component.scss']
})
export class EmpProfileComponent implements OnInit {
    @ViewChild('pdfIframe') pdfIframe: ElementRef;
    @ViewChild('myInput')
    myInputVariable: ElementRef;
    @ViewChild('inputElement') inputElement!: ElementRef;
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
    requestForm: FormGroup
    editRequestForm: FormGroup
    requests = [];
    employees = [];
    positions = [];
    branches = [];
    departments = [];
    salaryGradeMatrix = [];
    leaveCards = [];
    isEditId: boolean = false
    dtOptions: any
    initialfamilyBackgroundFormValue: any;
    dateToday = new Date()
    page: string = localStorage.getItem('pageState-profile')?localStorage.getItem('pageState-profile'):'201File'
    tab: string = localStorage.getItem('tabState-profile')?localStorage.getItem('tabState-profile'):'personalInfo'
    id: string = 'false'
    isEditForm: boolean = false
    currentUser:any = null;
    currentGroup:any = null;

    employeeData: any = null;
    userID: null;
  
    weekdaysData = [
      {day: 'Sunday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
      {day: 'Monday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
      {day: 'Tuesday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
      {day: 'Wednesday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
      {day: 'Thursday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
      {day: 'Friday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
      {day: 'Saturday', timeIn: '', timeOut: '', breakHours: 1, totalHours: 8, noWork: 'No'},
    ]
    editIndex: any;
    tempClinicAttachments = [];
    isEditFamilyForm: boolean;
    editFamilyFormIndex: number;
    imageUrl: string;
    allRequests: any;
  
    constructor(
      @Inject(LOCALE_ID) private locale: string,
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
      private objService: ObjService
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
        gender: ['', Validators.pattern('[a-zA-Z ]*')],
        birthDate: ['', Validators.required],
        placeOfBirth: [''],
        title: ['', Validators.pattern('[a-zA-Z.]*')],
        suffix: ['', Validators.pattern('[a-zA-Z.]*')],
        telephone: ['', [Validators.pattern('[0-9 ]*')]],
        mobileNumber: ['', [Validators.pattern('[0-9 ]*')]],
        email: ['', Validators.email],
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
          branch: [null],
          department: [null],
          position: [null],
          status: [null],
          dateHired: [null],
          type: [null],
          // branch: [null],
          // department: [null],
          // position: [null],
          // status: [null],
          // dateHired: [null],
          // type: [null],
          division: [null],
          appointedDate: [null],
          separationDate: [null],
          payrollType: [null],
          costCenter: [null],
          monthlyRate: [null],
          dailyRate: [null],
          hourlyRate: [null],
          ecola: [null],
          allowance: [null],
          deminimis: [null],
          basicPayBankAccountNumber: [null],
          others: [null],
          exemptionCode: [null],
          tin: [null],
          hdmf: [null],
          sss: [null],
          phic: [null],
          rcbcBankAccountNumber: [null],
          rcbcMonthlyRate: [null],
          rcbcDailyRate: [null],
          rcbcHourlyRate: [null],
          clothingAllowance: [null],
          cashGift: [null],
          performanceEhcIncentive: [null],
          cnaIncentive: [null],
          subsistence: [null],
          laundryAllowance: [null],
          salaryGrade: [null],
          salaryStep: [null],
          rata: [null]
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
        middleName: ['',[Validators.required, Validators.pattern('[a-zA-Z ]*')]],
        id_no: ['', Validators.required],
        position_title: [''],
        branchId:[null],
        leaveBalance: [null],
        serviceInformation: fb.group({
          branch: [null, Validators.required],
          department: [null, Validators.required],
          position: [null, Validators.required],
          status: [null, Validators.required],
          dateHired: [null, Validators.required],
          type: [null, Validators.required],
          division: [null],
          appointedDate: [null],
          separationDate: [null],
          payrollRate: [null],
          payrollType: [null],
          costCenter: [null],
          monthlyRate: [null],
          dailyRate: [null],
          hourlyRate: [null],
          ecola: [null],
          allowance: [null],
          deminimis: [null],
          basicPayBankAccountNumber: [null],
          others: [null],
          exemptionCode: [null],
          tin: [null],
          hdmf: [null],
          sss: [null],
          phic: [null],
          rcbcBankAccountNumber: [null],
          rcbcMonthlyRate: [null],
          rcbcDailyRate: [null],
          rcbcHourlyRate: [null],
          salaryGrade:[null, this.salaryGradeValidator],
          salaryStep:[null, Validators.required],
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
        particular: [null],
        file: [null],
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

      this.requestForm = fb.group({
        date: [{value: formatDate(this.dateToday, 'yyyy-MM-dd', this.locale), disabled: true}],
        firstName: [{value: null, disabled: true}],
        lastName: [{value: null, disabled: true}],
        middleName: [{value: null, disabled: true}],
        id_no: [{value: null, disabled: true}],
        userID: [{value: null, disabled: true}],
        request: [null, Validators.required],
        status: ['Pending'],
        purpose:['', Validators.required]
      })

      this.editRequestForm = fb.group({
        _id: [null],
        _rev: [null],
        date: [{value: null, disabled: true}],
        firstName: [{value: null, disabled: true}],
        lastName: [{value: null, disabled: true}],
        middleName: [{value: null, disabled: true}],
        id_no: [{value: null, disabled: true}],
        userID: [{value: null, disabled: true}],
        request: [null, Validators.required],
        status: [null],
        purpose:['', Validators.required]
      })
  
      this.disciplineManagementForm = fb.group({
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
        salaryType: [null],
        branch: [null],
        vlWithoutPay: [null],
        separationDate: [null],
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
    }
  
    ngOnInit(): void {
      this.getRequests()
      this.getCurrentUser()
      this.imageUrl = '/assets/img/default-profile.png';
      this.getEmployees()
      this.getLeaveCards()
      this.pageState()
      this.getPositions()
      this.getBranchDepartment();
      this.getSalaryGradeMatrix();
      this.initialfamilyBackgroundFormValue = this.familyBackgroundForm.value
    }

    getRequests(){
      this.profileService.getRequests().subscribe((response: any) => {
        console.log(response.rows)
        this.allRequests = response.rows
        if(this.id){
          this.requests = this.allRequests.filter((r) => r.doc.userID == this.id)
        }
      })
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
      return newValue.doc._id
    }
  
    ngOnDestroy(): void {
      // localStorage.removeItem('pageState')
      localStorage.removeItem('tabState')
      localStorage.removeItem('employeeId')
    }
  
    handleUpload(event, module) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (module == 'clinicAttachments') {
          this.submitClinicAttachment({name: file.name, data: reader.result, date: this.dateToday})
        }
        if (module == 'createClinicAttachments') {
          this.submitCreateClinicAttachment({name: file.name, data: reader.result})
        }
        if (module == 'documents') {
          this.documentForm.get('name').patchValue(file.name)
          this.documentForm.get('data').patchValue(reader.result)
        }
      };
    }
  
    /**
     * Setting Page State when reloaded
     */
    pageState() {
      localStorage.setItem('pageState-profile', this.page)
      if (localStorage.getItem('pageState-profile') != this.page) {
        localStorage.setItem('tabState-profile', 'personalInfo')
      } else {
        localStorage.setItem('tabState-profile', this.tab)
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
        birthDate: ['', [Validators.required]],
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
          let list = response?.rows.filter(item => !(item.doc._id.includes('_design')));
          // if(this.currentUser?.department != null){
          //   this.employees = list.filter(item => (item.doc.serviceInformation?.department?.includes(this.currentUser?.department)));
          // } else {
          //   this.employees = list
          // }
          
          this.employees = list
          // this.employees = response?.rows.filter(item => !(item.id.includes('_design')));
          let data: any
          console.log('id', this.id);
          var employeeData = this.employees.find((e) => e.doc.id_no == this.currentUser.id_no && e.doc.creationDate == this.currentUser.creationDate)
          console.log(this.currentUser.creationDate)
          console.log(employeeData)
          this.id = employeeData ? employeeData.id : 'false';
          if (this.id != 'false') {
            data = this.employees.find(data => data.id == this.id)
            data = data?.doc?data.doc:response?.rows[0]?.doc
            this.requests = this.allRequests.filter((r) => r.doc.userID == this.id)
          } else {
            // if (localStorage.getItem('employeeId') != null || undefined) {
            //   const id = localStorage.getItem('employeeId')
            //   for (let index = 0; index < response?.rows?.length; index++) {
            //     if (response?.rows[index].doc.id_no == id) {
            //       data = response?.rows[index].doc
            //     }
            //   }
            // } else {
            //   data = response?.rows[0]?.doc
            // }
          }
          console.log('data?',data)
          if(data?._attachments != undefined){
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
          this.form.patchValue(data)
          this.requestForm.reset()
          this.employeeData = data
          this.requestForm.patchValue(data)
          this.requestForm.patchValue({
            date: formatDate(this.dateToday, 'yyyy-MM-dd', this.locale),
            status: 'Pending'
          })
          this.form.controls.attendanceSettings.patchValue({attendanceId: data?.id_no})
          if (this.f.get('attendanceSettings.scheduleTemplate').value) {
            this.setSchedule(this.f.get('attendanceSettings.scheduleTemplate').value)
          }
          // console.log(data.familyBackground)
          this.familyBackgroundForm.patchValue(data?.familyBackground)
          if(data?.familyBackground){
            data.familyBackground.children?.map((data) => {
              this.children.push(this.addChildTemplate());
              this.children.at(this.children.length -1).patchValue(data)
            });
          }
          // console.log(this.familyBackgroundForm.value)
          // data.familyBackground?.forEach(data => {
          //   this.familyBackground.push(this.addFamilyTemplate())
          // });
          data?.educationalAttainments?.forEach(data => {
            this.educationalAttainments.push(this.addEducationalAttainmentTemplate())
            this.educationalAttainments.at(this.educationalAttainments.length - 1).patchValue(data)
          });
          data?.jobExperiences?.forEach(data => {
            this.jobExperiences.push(this.addJobExperienceTemplate())
            this.jobExperiences.at(this.jobExperiences.length - 1).patchValue(data)
          });
          data?.eligibilityExaminations?.forEach(data => {
            this.eligibilityExaminations.push(this.addEligibilityExaminationTemplate())
            this.eligibilityExaminations.at(this.eligibilityExaminations.length - 1).patchValue(data)
          });
          data?.workInvolvements?.forEach(data => {
            this.workInvolvements.push(this.addWorkInvolvementTemplate())
            this.workInvolvements.at(this.workInvolvements.length - 1).patchValue(data)
          });
          data?.trainings?.forEach(data => {
            this.trainings.push(this.addTrainingTemplate())
            this.trainings.at(this.trainings.length - 1).patchValue(data)
          });
          data?.others?.forEach(data => {
            this.others.push(this.addOtherTemplate())
            this.others.at(this.others.length - 1).patchValue(data)
          });
          data?.documents?.forEach(data => {
            this.documents.push(this.addDocumentTemplate())
            this.documents.at(this.documents.length - 1).patchValue(data)
          });
          data?.healthRecords?.forEach(data => {
            this.healthRecords.push(this.addHealthRecordTemplate())
            this.healthRecords.at(this.healthRecords.length - 1).patchValue(data)
          });
          data?.disciplineManagements?.forEach(data => {
            this.disciplineManagements.push(this.addDisciplineManagementTemplate())
            this.disciplineManagements.at(this.disciplineManagements.length - 1).patchValue(data)
          });
          data?.serviceRecords?.forEach(data => {
            this.serviceRecords.push(this.addServiceRecordTemplate())
            this.serviceRecords.at(this.serviceRecords.length - 1).patchValue(data)
          });
          data?.clinics?.forEach(data => {
            this.clinics.push(this.addClinicTemplate())
            this.clinics.at(this.clinics.length - 1).patchValue(data)
            this.form.controls.clinics.value[this.clinics.length - 1].clinicAttachments = data.clinicAttachments
          });
        },
        (error) => {
          this.toastr.error(error.error.reason)
        }
      )
    }
  
    /**
     * Update Employee
     */
    updateEmployee() {
      // var sgMatrix = this.salaryGradeMatrix.find(x=> x.doc.grade == this.form.get(['serviceInformation', 'salaryGrade']).value)
      // var branchID = this.getBranchId(this.form.get(['serviceInformation', 'branch']).value);
      // var posTitle = this.getPositionName(this.form.get(['serviceInformation', 'position']).value)
      
      // this.form.patchValue({
      //   position_title: posTitle, 
      //   branchId: branchID,
      //   salaryMatrix: sgMatrix?.doc
      // });
      console.log(this.form)
      if (this.form.valid) {
        this.profileService.updateEmployee(this.form.value).subscribe(
          (response: any) => {
            this.form.patchValue({_rev: response.rev})
            if(response.ok){
                this.updateEmployeeCard(this.form.value)
            }
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
        this.form.markAllAsTouched()
      }
    }
  
    /**
     * Change Employee
     * @param payload
     */
    changeEmployee(event) {
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
        data?.doc.educationalAttainments?.forEach(data => {
          this.educationalAttainments.push(this.addEducationalAttainmentTemplate())
          this.educationalAttainments.at(this.educationalAttainments.length - 1).patchValue(data)
        });
        data?.doc.jobExperiences?.forEach(data => {
          this.jobExperiences.push(this.addJobExperienceTemplate())
          this.jobExperiences.at(this.jobExperiences.length - 1).patchValue(data)
        });
        data?.doc.eligibilityExaminations?.forEach(data => {
          this.eligibilityExaminations.push(this.addEligibilityExaminationTemplate())
          this.eligibilityExaminations.at(this.eligibilityExaminations.length - 1).patchValue(data)
        });
        data?.doc.workInvolvements?.forEach(data => {
          this.workInvolvements.push(this.addWorkInvolvementTemplate())
          this.workInvolvements.at(this.workInvolvements.length - 1).patchValue(data)
        });
        data?.doc.trainings?.forEach(data => {
          this.trainings.push(this.addTrainingTemplate())
          this.trainings.at(this.trainings.length - 1).patchValue(data)
        });
        data?.doc.others?.forEach(data => {
          this.others.push(this.addOtherTemplate())
          this.others.at(this.others.length - 1).patchValue(data)
        });
        data?.doc.documents?.forEach(data => {
          this.documents.push(this.addDocumentTemplate())
          this.documents.at(this.documents.length - 1).patchValue(data)
        });
        data?.doc.healthRecords?.forEach(data => {
          this.healthRecords.push(this.addHealthRecordTemplate())
          this.healthRecords.at(this.healthRecords.length - 1).patchValue(data)
        });
        data?.doc.disciplineManagements?.forEach(data => {
          this.disciplineManagements.push(this.addDisciplineManagementTemplate())
          this.disciplineManagements.at(this.disciplineManagements.length - 1).patchValue(data)
        });
        data?.doc.serviceRecords?.forEach(data => {
          this.serviceRecords.push(this.addServiceRecordTemplate())
          this.serviceRecords.at(this.serviceRecords.length - 1).patchValue(data)
        });
        data?.doc.clinics?.forEach(data => {
          this.clinics.push(this.addClinicTemplate())
          this.clinics.at(this.clinics.length - 1).patchValue(data)
          this.form.controls.clinics.value[this.clinics.length - 1].clinicAttachments = data.clinicAttachments
        });
        localStorage.setItem('employeeId', event.target.value)
        this.reload()
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
              }
              this.getEmployees()
              this.toastr.success('Employee deleted successfully.')
            },
            (error) => {
              this.toastr.error(error.error.reason)
            }
          )
          Swal.fire('Deleted!', '', 'success')
        }
      });
    }
  
    /**
     * Change Active Status
     */
    changeActiveStatus() {
      this.form.patchValue({isActive: !this.f.get('isActive').value})
      this.updateEmployee()
    }
  
    /**
     * Add Family Member
     */
    addFamilyMember() {
      if (this.familyBackgroundForm.valid) {
        // this.familyBackground.push(this.addFamilyTemplate())
        // this.familyBackground.at(this.familyBackground.length - 1).patchValue(this.familyBackgroundForm.value)
        this.updateEmployee()
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
        this.updateEmployee()
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
        this.updateEmployee()
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
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
      if (!this.disciplineManagementForm.get('referenceNumber').value) {
        this.disciplineManagementForm.get('referenceNumber').patchValue(Math.floor(Math.random() * 9999999999) + 1)
      }
      if (!this.disciplineManagementForm.get('date').value) {
        this.disciplineManagementForm.get('date').patchValue(this.dateToday)
      }
      // this.createClinicForm.reset()
      // this.createClinicAttachments.clear()
    }
  
    /**
     * Dismiss all modals
     */
    dismiss() {
      this.modalService.dismissAll()
      this.isEditForm = !this.isEditForm
      this.editIndex = null
      
      this.requestForm = this.fb.group({
        date: [{value: formatDate(this.dateToday, 'yyyy-MM-dd', this.locale), disabled: true}],
        firstName: [{value: null, disabled: true}],
        lastName: [{value: null, disabled: true}],
        middleName: [{value: null, disabled: true}],
        id_no: [{value: null, disabled: true}],
        userID: [{value: null, disabled: true}],
        request: [null, Validators.required],
        status: ['Pending'],
        purpose:['', Validators.required]
      })

      this.requestForm.patchValue(this.employeeData)
    }
  
    /**
     * Submit Create Employee
     */
    submitCreateEmployee() {
      var sgMatrix = this.salaryGradeMatrix.find(x=> x.doc.grade == this.createEmployeeForm.get(['serviceInformation', 'salaryGrade']).value)
      var branchID = this.getBranchId(this.createEmployeeForm.get(['serviceInformation', 'branch']).value);
      var posTitle = this.getPositionName(this.createEmployeeForm.get(['serviceInformation', 'position']).value)
      this.createEmployeeForm.patchValue({
        position_title: posTitle, 
        branchId: branchID,
        salaryMatrix: sgMatrix?.doc
      });
      console.log(this.createEmployeeForm.value)
      if (this.createEmployeeForm.valid) {
        this.profileService.createEmployee(this.createEmployeeForm.value).subscribe(
          (response: any) => {
            if(response.ok){
              let employeeCard = this.newEmployeeCard(this.createEmployeeForm.value, response.id)
              if(employeeCard){
                this.leaveService.addLeaveCard(employeeCard).subscribe((response:any)=>{
                    this.getLeaveCards()
                  }),
                  (error) => { console.log(error)}
               }
            }
            this.toastr.success('Employee created successfully.')
            this.dismiss()
            this.getEmployees()
          },
          (error) => {
            console.log(error)
            // this.toastr.error(error.error.reason)
          }
        )
      } else {
        this.createEmployeeForm.markAllAsTouched()
      }
    }
  
    /**
     * Submit Educational Attainment
     */
    submitEducationalAttainment() {
      if (this.educationalAttainmentForm.valid) {
        if (this.editIndex != null) {
          this.educationalAttainments.at(this.editIndex).patchValue(this.educationalAttainmentForm.value)
          this.updateEmployee()
          this.educationalAttainmentForm.reset()
          this.dismiss()
        } else {
          this.educationalAttainments.push(this.addEducationalAttainmentTemplate())
          this.educationalAttainments.at(this.educationalAttainments.length - 1).patchValue(this.educationalAttainmentForm.value)
          this.updateEmployee()
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
          this.educationalAttainments.removeAt(index)
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
        if (this.editIndex != null) {
          this.jobExperiences.at(this.editIndex).patchValue(this.jobExperienceForm.value)
          this.updateEmployee()
          this.jobExperienceForm.reset()
          this.dismiss()
        } else {
          this.jobExperiences.push(this.addJobExperienceTemplate())
          this.jobExperiences.at(this.jobExperiences.length - 1).patchValue(this.jobExperienceForm.value)
          this.updateEmployee()
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
          this.jobExperiences.removeAt(index)
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
        if (this.editIndex != null) {
          this.eligibilityExaminations.at(this.editIndex).patchValue(this.eligibilityExaminationForm.value)
          this.updateEmployee()
          this.eligibilityExaminationForm.reset()
          this.dismiss()
        } else {
          this.eligibilityExaminations.push(this.addEligibilityExaminationTemplate())
          this.eligibilityExaminations.at(this.eligibilityExaminations.length - 1).patchValue(this.eligibilityExaminationForm.value)
          this.updateEmployee()
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
          this.eligibilityExaminations.removeAt(index)
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
        if (this.editIndex) {
          this.workInvolvements.at(this.editIndex).patchValue(this.workInvolvementForm.value)
          this.updateEmployee()
          this.workInvolvementForm.reset()
          this.dismiss()
        } else {
          this.workInvolvements.push(this.addWorkInvolvementTemplate())
          this.workInvolvements.at(this.workInvolvements.length - 1).patchValue(this.workInvolvementForm.value)
          this.updateEmployee()
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
          this.workInvolvements.removeAt(index)
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
        if (this.editIndex != null) {
          this.trainings.at(this.editIndex).patchValue(this.trainingForm.value)
          this.updateEmployee()
          this.trainingForm.reset()
          this.dismiss()
        } else {
          this.trainings.push(this.addTrainingTemplate())
          this.trainings.at(this.trainings.length - 1).patchValue(this.trainingForm.value)
          this.updateEmployee()
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
          this.trainings.removeAt(index)
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
        if (this.editIndex != null) {
          this.others.at(this.editIndex).patchValue(this.otherForm.value)
          this.updateEmployee()
          this.otherForm.reset()
          this.dismiss()
        } else {
          this.others.push(this.addOtherTemplate())
          this.others.at(this.others.length - 1).patchValue(this.otherForm.value)
          this.updateEmployee()
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
          this.others.removeAt(index)
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
        if (this.editIndex != null) {
          this.documents.at(this.editIndex).patchValue(this.documentForm.value)
          this.updateEmployee()
          this.documentForm.reset()
          this.documentForm.get('date').patchValue(this.dateToday)
          this.dismiss()
        } else {
          this.documents.push(this.addDocumentTemplate())
          this.documents.at(this.documents.length - 1).patchValue(this.documentForm.value)
          this.updateEmployee()
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
          this.documents.removeAt(index)
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
        if (this.editIndex != null) {
          this.healthRecords.at(this.editIndex).patchValue(this.healthRecordForm.value)
          this.updateEmployee()
          this.healthRecordForm.reset()
          this.dismiss()
        } else {
          this.healthRecords.push(this.addHealthRecordTemplate())
          this.healthRecords.at(this.healthRecords.length - 1).patchValue(this.healthRecordForm.value)
          this.updateEmployee()
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
          this.healthRecords.removeAt(index)
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
     * Edit Health Record
     * @param data
     * @param content
     */
    editRequest(data, content, index) {
      this.editRequestForm.reset()
      this.editRequestForm.patchValue(data)
      this.open(content, index)
    }
  
    /**
     * Submit Discipline Management
     */
    submitDisciplineManagement() {
      if (this.disciplineManagementForm.valid) {
        if (this.editIndex != null) {
          this.disciplineManagements.at(this.editIndex).patchValue(this.disciplineManagementForm.value)
          this.updateEmployee()
          this.disciplineManagementForm.reset()
          this.disciplineManagementForm.get('referenceNumber').patchValue(Math.floor(Math.random() * 9999999999) + 1)
          this.disciplineManagementForm.get('date').patchValue(this.dateToday)
          this.dismiss()
        } else {
          this.disciplineManagements.push(this.addDisciplineManagementTemplate())
          this.disciplineManagements.at(this.disciplineManagements.length - 1).patchValue(this.disciplineManagementForm.value)
          this.updateEmployee()
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
          this.disciplineManagements.removeAt(index)
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
        if (this.editIndex != null) {
          this.serviceRecords.at(this.editIndex).patchValue(this.serviceRecordForm.value)
          this.updateEmployee()
          this.serviceRecordForm.reset()
          this.dismiss()
        } else {
          this.serviceRecords.push(this.addServiceRecordTemplate())
          this.serviceRecords.at(this.serviceRecords.length - 1).patchValue(this.serviceRecordForm.value)
          this.updateEmployee()
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
          this.serviceRecords.removeAt(index)
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
        if (this.editIndex != null) {
          this.clinics.at(this.editIndex).patchValue(this.clinicForm.value)
          this.clinics.value[this.editIndex].clinicAttachments = this.clinicAttachments.value
          this.updateEmployee()
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
          this.clinics.removeAt(index)
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
        this.clinics.push(this.addClinicTemplate())
        this.clinics.at(this.createClinics.length - 1).patchValue(this.createClinicForm.value)
        this.clinics.value[this.clinics.length - 1].clinicAttachments = this.createClinicAttachments.value
        this.updateEmployee()
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
          this.createClinics.removeAt(index)
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
          this.updateEmployee()
          Swal.fire('Deleted!', '', 'success')
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
              this.objService.updateMessage(base64);
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
  
    download(r) {
      if(this.f.get('_id').value != '_design/by_branch'){
        const titleMessage = (r === 'print')? 'Opening Print Preview...':'Downloading...'; 
        // Show the Swal dialog with custom progress bar template
        Swal.fire({
          title: titleMessage,
          // html: '<div class="progress-bar-container"><div class="progress-bar"></div></div>',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading(null);
            this.print(r);
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
            window.URL.revokeObjectURL(link.href); //revoke the object URL after the download
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
        }),
        (error) => { console.log(error)}
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

    
    submitRequest() {
      this.requestForm.patchValue({
        userID: this.id
      })
      console.log(this.requestForm.getRawValue())
      if (this.requestForm.valid) {
        this.profileService.createRequest(this.requestForm.getRawValue()).subscribe((r) =>{
          this.toastr.success('Request has been submitted.')
          this.getRequests()
          this.dismiss() 
        })
        console.log('valid')
      } else {
        console.log('invalid')
        this.requestForm.markAllAsTouched()
      }
    }
    
    updateRequest() {
      console.log(this.editRequestForm.getRawValue())
      if (this.editRequestForm.valid) {
        this.profileService.updateRequest(this.editRequestForm.getRawValue()).subscribe((r) =>{
          this.toastr.success('Request has been updated.')
          this.getRequests()
          this.dismiss() 
        })
        console.log('valid')
      } else {
        console.log('invalid')
        this.editRequestForm.markAllAsTouched()
      }
    }

    deleteRequest(data){
      Swal.fire({
        icon: 'warning',
        title: 'This action cannot be undone. Do you still want to continue?',
        showCancelButton: true,
        confirmButtonText: 'Save',
        confirmButtonColor: '#007bff',
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.profileService.deleteRequest(data).subscribe((r) =>{
            Swal.fire('Saved!', 'Request has been deleted.', 'success')
            .then(() => {
              this.getRequests()
              this.dismiss() 
            })
          })
        } else if (result.isDenied) {
        }
      })
    }

    
  downloadReport(id, report, type){
    var what = null;
    switch (report) {
      case "Certificate of Employment":
        what = 'Employee_Certificate_of_Employment'
      break;
      case "Service Record":
        what = 'Employee_Service_Record'
      break;
      case "Certification Record":
        what = 'Employee_Certification'
      break;
      case "Certification Medical":
        what = 'Employee_Certification_Medical'
      break;
      default:
        what = null
    }
    if(what != null){
      const titleMessage = (type === 'print')? 'Opening Print Preview...':'Downloading...';
      var url = '/jasperserver/rest_v2/reports/reports/Requests/' + what + '.pdf?_id="' + id + '"'
      console.log(url)
      Swal.fire({
        title: titleMessage,
        // html: '<div class="progress-bar-container"><div class="progress-bar"></div></div>',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(null);
          this.downloadR(report, url, type);
        }
      });
    }
  }

  private downloadR(filename: string, url: string, type: string) {
    this.http.get(url, {
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
          // On complete, trigger the file download
          const blob = new Blob([event.body], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(link.href); //revoke the object URL after the download
        }

        this.closeDialog();
      }
    }, error => {
      // Handle error (optional)
      this.closeDialog();
      Swal.fire('Error', 'Failed to download the file.', 'error');
    });
  }

}
