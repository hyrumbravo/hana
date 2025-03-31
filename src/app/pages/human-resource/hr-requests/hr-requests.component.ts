import { AfterViewInit, Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BakcEndService } from '@/bakc-end.service';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService } from '@services/profile/profile.service';
import { ToastrService } from 'ngx-toastr';
import { LeaveService } from '@services/leave/leave.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';


@Component({
  selector: 'app-hr-requests',
  templateUrl: './hr-requests.component.html',
  styleUrls: ['./hr-requests.component.scss']
})
export class HrRequestsComponent implements AfterViewInit {
  @ViewChild('previewSignature') previewSignature: TemplateRef<any>;
  @ViewChild('signaturePad') signaturePad: TemplateRef<any>;
  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;
  public loading = false;
	public reqFormisCollapsed = true;
	public formIsCollapsed = true;
  modalReference = null;
  signaturePadModalRef = null;
  previewSignatureModalRef = null;
  content: any;
  employee: any;
  posts: any;
  dtOptions: any;
  createForm: FormGroup;
  editForm: FormGroup;
  id: any;
  rev: any;
  leave: any;
  positionForm: any;
  app: any;
  viewForm: FormGroup;
  emp: any;
  rate: any;
  positions = []
  announcements: any = [];
  employeeList: any = [];
  currentUser:any = null;
  currentGroup:any = null;
  allRequests: any = [];
  editRequestForm: FormGroup;

  form: FormGroup;
  dateToday = new Date()
  branches = [];
  departments = [];
  salaryGradeMatrix = [];
  serviceRecordForm: FormGroup
  editIndex: any;
  
  leaveCards = []
  allUsers = []
  
  signatureImg: string | ArrayBuffer;
  signatureFile: any;
  base64: any;

  newSignatureImg: string | ArrayBuffer;
  newSignatureFile: any;
  newBase64: any;
  
  withNewSignature: boolean = false;
  
  constructor(private service: BakcEndService, 
    private fb: FormBuilder, 
    private router: Router, 
    private modalService: NgbModal, 
    private profileService: ProfileService, 
    private toastr: ToastrService, 
    private leaveService: LeaveService,
    private http: HttpClient) { 


    this.createForm = fb.group({
      purpose: [null, [Validators.required]],
      date: [null, [Validators.required]],
      place: [null, [Validators.required]],
      department: [null, [Validators.required]],
      description: [null, [Validators.required]],
    })

    this.editForm = fb.group({
      _id: [null],
      _rev: [null],
      purpose: [null, [Validators.required]],
      date: [null, [Validators.required]],
      place: [null, [Validators.required]],
      department: [null, [Validators.required]],
      description: [null, [Validators.required]],
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
      request: [{value: null, disabled: true}, Validators.required],
      status: [null],
      purpose:[{value: null, disabled: true}]
    })
    
    this.dtOptions = {
      language: {
        search: '',
        searchPlaceholder: 'Search',
        lengthMenu: 'Show _MENU_ entries'
      },
      pageLength: 6,
      ordering: false,
      paging: true,
      dom: 'frtip',
      // buttons: [
      //   {extend: 'print', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      //   {extend: 'copyHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      //   {extend: 'csvHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      //   {extend: 'excelHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      // ]
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
        branch: [null, Validators.required],
        department: [null, Validators.required],
        position: [null, Validators.required],
        status: [null, Validators.required],
        dateHired: [null, Validators.required],
        type: [null, Validators.required],
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
        monthlyRate: [null, Validators.required],
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
        salaryGrade: [null, this.salaryGradeValidator],
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

  }

  ngOnInit(): void {
    this.loading = true;
    // $('#summernote').summernote();
    this.getRequests()
    this.getEmployees()
    this.getCurrentUser()
    this.getAnnouncements()
    this.getPositions()
    this.getBranchDepartment();
    this.getSalaryGradeMatrix();
    this.getLeaveCard();
    this.getAllUsers();


  this.service.rating().subscribe((data: any) => {
    this.rate = data.rows;
  });

  }

  getEmployees(){
    this.service.employee().subscribe((data: any) => {
      // this.employee = data.rows;
      let list = data?.rows.filter(item => !(item.doc._id.includes('_design')));
      if(this.currentUser?.department != null){
        this.employee = list.filter(item => (item.doc.serviceInformation?.department?.includes(this.currentUser?.department)));
      } else {
        this.employee = list
      }

      this.employeeList = list;
      // this.employeeList = this.employee; //If filtered by department
      this.emp = this.employee;
      this.loading = false; //fetching data endpoint
    });
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

  getRequests(){
    this.allRequests = []
    this.profileService.getRequests().subscribe((response: any) => {
      console.log(response.rows)
      this.allRequests = response.rows
    })
  }

  getCurrentUser(){
    this.service.getSystemUser().subscribe(
      (response: any) => {
        this.currentUser = response?.rows[0].doc
        this.getSignature(response?.rows[0].doc)
        if(this.currentUser){
          this.service.getUserGroupbyId(this.currentUser.setting_id).subscribe(
            (response: any) => {
              this.currentGroup = response?.rows[0].doc
            })
        }
      })

  }

  ngAfterViewInit() {
    console.log(this.fileInput)
    // Access the ViewChild element here
    // You can now safely access this.fileInput.nativeElement
  }

  /**
   * Get Positions
   */
  getPositions() {
    this.profileService.getPositions().subscribe(
      (response: any) => {
        this.positions = response?.rows
        this.service.performance().subscribe((data: any) => {
          this.app = data.rows;
          this.posts = this.app;
          this.posts.forEach(data => {
            data.doc.position_title = this.getPositionName(data.doc.positionTitle)
          });
      });
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

  getBranchId(value){
    let newValue = this.branches.find(x=> x.doc.branchName === value)
    if(newValue){
      return newValue.doc._id
    }
    return false
  }

  /**
   * Get Announcements
   */
  getAnnouncements() {
    this.service.announcementsList().subscribe(
      (response: any) => {
        this.announcements = response?.rows
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


  /**
   * Dismiss all modals
   */
  dismiss() {
    this.modalService.dismissAll()
  }

  dismissSingle(){
    this.modalReference.close();
  }

  dismissModal(id){
    if(id == 'signaturePad'){
      this.signaturePadModalRef.close()
    }
    else{
      this.previewSignatureModalRef.close()
    }
    this.modalReference.close();
  }

  

  /**
   * Open Modal
   * @param content
   */
  open(content, index?) {
    this.editIndex = index
    this.modalReference = this.modalService.open(content, { backdrop: false, centered: true, size: 'xl' })
  }

  openMd(content, id){
    console.log(content)
    if(id == 'signaturePad'){
      this.signaturePadModalRef = this.modalService.open(content, { backdrop: false, centered: true, size: 'md' })
    }
    else{
      this.previewSignatureModalRef = this.modalService.open(content, { backdrop: false, centered: true, size: 'md' })
    }
  }

  addAnnouncement() {

    if (this.createForm.valid) {
      this.service.addAnnouncement(this.createForm.value).subscribe((data) => {
          console.log('Warning', data);
          Swal.fire(
            'Success!',
            'Announcement has been added.',
            'success'
          ).then((result) => {
            this.getAnnouncements()
            this.dismiss()
          });
      });
    } else {
      this.createForm.markAllAsTouched()
    }
}

editAnnouncement(content, data) {
  this.editForm.reset()
  this.editForm.patchValue(data)
  console.log(this.editForm)
  this.open(content)
}

updateAnnouncement(id){
  if(this.editForm.valid){
    this.service.editAnnouncement(this.editForm.value, id).subscribe(data => {
      console.log("Warning",data);
      Swal.fire('Success!', 'Announcement been updated', 'success')
      .then((result) => {
        this.getAnnouncements()
        this.dismiss()
      })
  
    });
  }
  else{
    this.editForm.markAllAsTouched()
  }
}

deleteAnnouncement(id, rev){
  Swal.fire({
    icon: 'info',
    title: 'Do you want to delete this announcement?',
    showCancelButton: true,
    confirmButtonText: 'Delete',
  }).then((result) => {
    if (result.isConfirmed) {
      this.service.deleteAnnouncement(id, rev).subscribe(
        (response: any) => {
          Swal.fire('Deleted!', '', 'success')
          this.getAnnouncements()
        },
        (error) => {
          this.toastr.error(error.error.reason)
        }
      )
    }
  });
}

editEval() {
  const id_no = this.editForm.value.id_no;
  const name = this.editForm.value.name;
  const assessment = this.editForm.value.assessment;
  const rating_new = this.editForm.value.rating_new;
  const remarks_new = this.editForm.value.remarks_new;
  const rating_old = this.editForm.value.rating_old;
  const remarks_old = this.editForm.value.remarks_old;
  const date_cover = this.editForm.value.date_cover;
  const absent = this.editForm.value.absent;
  const evaluator = this.editForm.value.evaluator;
  const comment = this.editForm.value.comment;
  const date_from = this.editForm.value.date_from;
  const date_to = this.editForm.value.date_to;
  const positionTitle = this.editForm.value.positionTitle;
  const postObject1 = {
      _id: this.id,
      _rev: this.rev,
      id_no: id_no,
      name: name,
      assessment: assessment,
      rating_new: rating_new,
      remarks_new: remarks_new,
      rating_old: rating_old,
      remarks_old: remarks_old,
      date_cover: date_cover,
      absent: absent,
      evaluator: evaluator,
      comment: comment,
      date_from: date_from,
      date_to: date_to,
      positionTitle: positionTitle,
  };
  this.service.editPerf(postObject1, this.id).subscribe((data) => {
      console.log('Warning', data);
      Swal.fire(
          'Success!',
          ' Successfully Updated!',
          'success'
      ).then((result) => {
        window.location.reload()
        this.dismiss()
      });
  });
}

edit(data: any, content){
  this.editForm.controls['name'].setValue(data.name);
  this.editForm.controls['id_no'].setValue(data.id_no);
  this.editForm.controls['positionTitle'].setValue(data.positionTitle);
  this.editForm.controls['assessment'].setValue(data.assessment);
  this.editForm.controls['date_cover'].setValue(data.date_cover);
  this.editForm.controls['absent'].setValue(data.absent);
  this.editForm.controls['evaluator'].setValue(data.evaluator);
  this.editForm.controls['comment'].setValue(data.comment);
  this.editForm.controls['date_from'].setValue(data.date_from);
  this.editForm.controls['date_to'].setValue(data.date_to);
  this.id = data._id;
  this.rev = data._rev;
  this.open(content)
}

deleteApp(id: any, rev: any) {
  console.log(id, rev)
      Swal.fire({
        icon: 'info',
        title: 'Do you want to delete this File?',
        showCancelButton: true,
        confirmButtonText: 'Delete',
      }).then((result) => {
        if (result.isConfirmed) {
          this.service.deleteEval(id, rev).subscribe((data) => {
            console.log(data);
          })
          Swal.fire('Deleted!', '', 'success').then((result) => {
            window.location.reload()
            this.dismiss()
        });

        }
  });
}

  getId(){
    var emp_name = this.employee.filter((x: any)=>
    x.doc.id_no == this.createForm.value.id_no
    )
    this.createForm.controls['name'].setValue(emp_name[0].doc.firstName + ' ' + emp_name[0].doc.middleName + ' ' + emp_name[0].doc.lastName)
    this.createForm.controls['positionTitle'].setValue(emp_name[0].doc.serviceInformation.position)
  }

  getIdOf(){
    var emp = this.employee.filter(
    (x: any)=>
    x.doc.id_no == this.editForm.value.id_no
    )
    this.editForm.controls['name'].setValue(emp[0].doc.firstName + ' ' + emp[0].doc.middleName + ' ' + emp[0].doc.lastName)
    this.editForm.controls['positionTitle'].setValue(emp[0].doc.serviceInformation.position)
  }

  refresh() {
    this.allRequests = []
    this.dismiss()
    this.getRequests()
    this.getEmployees()
    this.getAnnouncements()
  }

  acceptRequest(){

  }

  declineRequest(){

  }

  viewRequest(data, content) {
    var employeeData = this.employeeList.find((x) => x.id == data.userID)
    if(employeeData){
      console.log(employeeData.doc);
      this.form.reset()
      Object.keys(employeeData.doc).forEach(key => {
        if (!this.form.contains(key)) {
          this.form.addControl(key, this.fb.control(null));
        }
      });
      if(!employeeData._attachments) this.form.removeControl('_attachments')
      if(data.status != 'Pending'){
        this.form.reset()
        if(data.employeeData){
          this.form.patchValue(data.employeeData)
        }
        this.form.disable();
      }
      else this.form.enable()
      if(data.request == 'Service Record') {
        this.form.get('placeOfBirth').setValidators([Validators.required]); // 5.Set Required Validator
        this.form.get('placeOfBirth').updateValueAndValidity();
      } else {
        this.form.get('placeOfBirth').clearValidators(); // 6. Clear All Validators
        this.form.get('placeOfBirth').updateValueAndValidity();
      }
      this.form.patchValue(employeeData.doc)
      this.editRequestForm.reset()
      Object.keys(data).forEach(key => {
        if (!this.editRequestForm.contains(key)) {
          this.editRequestForm.addControl(key, this.fb.control(null));
        }
      });
      this.editRequestForm.patchValue(data)
      this.serviceRecords.clear()
      employeeData.doc?.serviceRecords?.forEach(data => {
        this.serviceRecords.push(this.addServiceRecordTemplate())
        this.serviceRecords.at(this.serviceRecords.length - 1).patchValue(data)
      });
      this.open(content)
    }
    else{
      this.toastr.error('Employee Not Found')
    }
  }

  updateRequest(action) {
    var txt = action == 'accept' ? 'accepted' : 'declined'
    console.log(this.editRequestForm.getRawValue())
    if(action == 'accept'){
      if(this.form.valid){
        var leaveBalance = this.getLeaveBalance()
        if(leaveBalance == null){
          this.toastr.error('Leave card not found.')
        }
        else{
          this.editRequestForm.patchValue({
            status: 'Accepted'
          })
          var clone = this.editRequestForm.getRawValue()
          clone.employeeData = this.form.getRawValue()
          console.log(clone);
          var sgMatrix = this.salaryGradeMatrix.find(x=> x.doc.grade == this.form.get(['serviceInformation', 'salaryGrade']).value)
          var branchID = this.getBranchId(this.form.get(['serviceInformation', 'branch']).value);
          var posTitle = this.getPositionName(this.form.get(['serviceInformation', 'position']).value)
          var isPositionChanged = (posTitle != this.form.get('position_title').value);
          this.form.patchValue({
            position_title: posTitle, 
            branchId: branchID,
            salaryMatrix: sgMatrix?.doc
          });
          if(isPositionChanged) this.updateUser(this.form.value); console.log('User Data Updated');
          this.profileService.updateEmployee(this.form.getRawValue()).subscribe(
            (response: any) => {
              if(response.ok){
                this.profileService.updateRequest(clone).subscribe((r) =>{
                  this.toastr.success('Request has been ' + txt)
                  this.getRequests()
                  this.getEmployees()
                  this.dismiss() 
                })
              }
          })
        }
      }
      else{
        this.toastr.error('Please fill in the required fields')
        this.form.markAllAsTouched()
      }
    }
    else{
      this.editRequestForm.patchValue({
        status: 'Declined'
      })
      var clone = this.editRequestForm.getRawValue()
      clone.employeeData = this.form.getRawValue()
      console.log(clone);
      this.profileService.updateRequest(clone).subscribe((r) =>{
        this.toastr.success('Request has been ' + txt)
        this.getRequests()
        this.getEmployees()
        this.dismiss() 
      })
    }
    console.log(this.form.valid)
  }

  checkSignature(){
    if(this.signatureImg){
      this.openMd(this.previewSignature, 'preview')
    }
    else{
      Swal.fire({
        icon: 'info',
        title: 'No saved signature.',
        showCancelButton: true,
        confirmButtonText: 'Draw',
        cancelButtonText: 'Attach',
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
          confirmButton: 'btn btn-outline-info',
          cancelButton: 'btn btn-info'
        },
      }).then((result) => {
        if (result.isConfirmed) {
          this.openMd(this.signaturePad, 'signaturePad')
        }
        else if(result.isDismissed){
          this.triggerFileInput()
        }
      });
    }
  }

  certifyRequest(){
    var clone = this.editRequestForm.getRawValue()
    clone.timestamp = Date.now()
    clone.signature = this.newBase64 ? this.newBase64 : this.base64
    clone.status = 'Certified'
    console.log(clone)
    this.profileService.updateRequest(clone).subscribe((r) =>{
      this.toastr.success('Request has been certified.')
      this.getRequests()
      this.getEmployees()
      this.dismiss() 
      if(!this.signatureFile || this.newSignatureFile){
        Swal.fire({
          icon: 'info',
          title: 'Do you want to save this signature to your account?',
          showCancelButton: true,
          confirmButtonText: 'Save',
          cancelButtonText: 'No',
          allowOutsideClick: false,
          allowEscapeKey: false,
          customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-default'
          },
        }).then((result) => {
          if (result.isConfirmed) {
            if(this.currentUser){
              this.currentUser._attachments = {
                signature : this.newSignatureFile
              }
              this.service.editUser(this.currentUser, this.currentUser._id).subscribe((r) => {
                this.toastr.success('Signature has been saved.')
                this.getAllUsers()
                this.getCurrentUser()
              }),
              (error) => { console.log(error)}
            }
            else[
              this.toastr.error('User data not found.')
            ]
          }
          else if(result.isDismissed){
            this.triggerFileInput()
          }
        });
      }
    })
  }

  get f() {
    return this.form
  }

  get serviceRecords(): FormArray {
    return this.f.get('serviceRecords') as FormArray
  }

  get sr() {
    return this.serviceRecordForm
  }

  salaryGradeValidator(control) {
    const value = Number(control.value);
    if (isNaN(value) || value < 1 || value > 33) {
      return { invalidSalaryGrade: true };
    }
    return null;
  }

  editServiceRecord(data, content, index) {
    this.serviceRecordForm.reset()
    this.serviceRecordForm.patchValue(data)
    if(this.editRequestForm.get('status').value != 'Pending') this.serviceRecordForm.disable()
    else this.serviceRecordForm.enable()
    this.open(content, index)
  }

  deleteServiceRecord(index) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.serviceRecords.removeAt(index)
        // this.updateEmployee() //ChangeTo
        Swal.fire('Deleted!', '', 'success')
      }
    });
  }

  submitServiceRecord() {
    if (this.serviceRecordForm.valid) {
      if (this.editIndex != null) {
        this.serviceRecords.at(this.editIndex).patchValue(this.serviceRecordForm.value)
        this.serviceRecordForm.reset()
        this.dismissSingle()
      } else {
        this.serviceRecords.push(this.addServiceRecordTemplate())
        this.serviceRecords.at(this.serviceRecords.length - 1).patchValue(this.serviceRecordForm.value)
        this.serviceRecordForm.reset()
        this.dismissSingle()
      }
    } else {
      this.serviceRecordForm.markAllAsTouched()
    }
  }

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

  getLeaveBalance(){ //update employee profile's leave credit before printing
    const leaveCardId = this.leaveCards.find(x=>x.doc.employee_id == this.form.controls['_id'].value)
    
    if(leaveCardId){
      return leaveCardId.doc.vlBalance
    }
    else{
      return null
    }

  }

  getLeaveCard(){
    this.leaveService.getLeaveCard().subscribe((response:any)=>{
      this.leaveCards = response.rows
    })
  }


  updateUser(row){
    let userFound = false;
    if(row.id_no){
      let user = this.allUsers.find(x=> x.doc.id_no == row.id_no) 
      if(!user){
        let email = this.allUsers.find(x=> x.doc.email == row.email) //checks for email matches instead
        if(email) {user = email; userFound = true;}
      } else userFound = true;

      if(userFound){
        user.doc.designation = row.position_title
        user.doc.contact = row.mobileNumber
        this.service.editUser(user.doc, user.id).subscribe((r) => {
          this.getAllUsers()
        }),
        (error) => { console.log(error)}
      }
    }
  }

  getAllUsers(){
    this.profileService.getUser().subscribe((response: any) => {
      this.allUsers = response.rows
    })
  }

  getSignature(data){
    if(data._attachments && 'signature' in data._attachments){
      console.log(data._attachments)
      this.signatureFile = data._attachments.signature
      var keys = Object.keys(data._attachments)
      var type = data._attachments[keys[0]].content_type
      this.http.get(environment.globalUrl + `/users/${data._id}/signature`, {
        responseType: 'blob',
        headers: {
          'Authorization': 'Basic ' + btoa('admin:h@n@')
        }
      })
      .toPromise().then(response => {
        var xx = URL.createObjectURL(response);
        this.signatureImg = (xx).toString()

        const reader = new FileReader();

        reader.onload = () => {
          // The result property contains the Base64-encoded string
          this.base64 = (reader.result as string).split(',')[1];
        };

        // Read the response blob as Data URL (Base64)
        reader.readAsDataURL(response);
      })
    }
    else{
      this.signatureImg = undefined;
    }
  }

  saveSignature(e){
    const base64 = e.replace("data:image/png;base64,", "");
    const imageName = 'name.png';
    const imageBlob = this.dataURItoBlob(base64);
    const imageFile = new File([imageBlob], imageName, { type: 'image/png' });
    this.formatFile(imageFile)
    this.dismissModal('signaturePad')
    if(!this.signatureImg){
      if(this.signaturePadModalRef) this.signaturePadModalRef.close()
      this.openMd(this.previewSignature, 'preview')
    }

    console.log(this.signatureFile)
  }

  dataURItoBlob(dataURI) {
    const byteString = window.atob(dataURI);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([int8Array], { type: 'image/png' });    
    return blob;
  }

  formatFile(file){
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
        var dataUrl = reader.result;
        var imageUrl = dataUrl;
        this.newSignatureImg = dataUrl
        var imageHtml = '<img src="' + imageUrl + '">';

        if (imageUrl) {
            // const dataUrl = reader.result;
            const data = (<string>dataUrl).split(',')[1]

            const attachment = {
                content_type: file.type,
                data: data
            };


            const attachmentName = file.name;

            console.log(attachment)
            this.newSignatureFile = attachment
            this.newBase64 = data
            // this.toastr.success('Signature successfully attached!');
            // return attachment
            // imgatth = attachment;
        }
    }
  }

  triggerFileInput(): void {
    console.log(this.fileInput)
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
        const selectedFile = inputElement.files[0];
        // Now you can do something with the selected file, such as uploading it to a server or processing it.
        console.log('Selected File:', selectedFile);
        this.formatFile(selectedFile)
        if(!this.signatureImg){
          if(this.previewSignatureModalRef) this.previewSignatureModalRef.close()
          this.openMd(this.previewSignature, 'preview')
        }
        console.log(this.signatureFile)

    }
  }

  clearSignature(){
    this.newSignatureFile = undefined;
    this.newSignatureImg = undefined;
    this.newBase64 = undefined;
    this.toastr.success('Successfully removed.')
  }
}

