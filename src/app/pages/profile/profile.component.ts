import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService } from '@services/profile/profile.service';
import { ToastrService } from 'ngx-toastr';
import { EmpProfileComponent } from './emp-profile/emp-profile.component';
import { environment } from 'environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;

  public loading = false;
  form: FormGroup
  employeeFound: Boolean = false;
  canAccessSmsSetting: Boolean = false;
  withNewSignature: Boolean = false;

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
  page: string = localStorage.getItem('pageState')?localStorage.getItem('pageState'):'201File'
  tab: string = localStorage.getItem('tabState')?localStorage.getItem('tabState'):'personalInfo'
  id: string = 'false'
  isEditForm: boolean = false
  employeeData:any = null;
  currentUser:any = null;
  currentGroup:any = null;

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
  signatureFile: any;
  imageSrc: string | ArrayBuffer;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private http: HttpClient,
    ) {
    
    this.form = fb.group({
      _id: [null],
      _rev: [null],
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
      middleName: [null],
      email: [{value: null, disabled: true}, [Validators.required, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      contact: [null, [Validators.pattern('[0-9 ]*')]],
      isActive: [true],
      department: [null],
    })
  }

  ngOnInit(): void {
    this.loading = true;
    this.getUserById()
  }

  get f() {
    return this.form
  }

  /**
   * Get User By Id
   */
  getUserById() {
    this.profileService.getUser().subscribe(
      (response: any) => {
        var userData = response?.rows.find((r) => r.id == localStorage.getItem('userID'))
        // const data = response?.rows[0]?.doc
        // userData?.doc?.smsNotification ? this.canAccessSmsSetting = true: false;
        Object.keys(userData.doc).forEach(key => {
          if (!this.form.contains(key)) {
              this.form.addControl(key, this.fb.control(null));
            }
        });
        this.form.patchValue(userData.doc)
        this.getSignature(userData.doc)
        console.log(this.form.getRawValue())
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )

    this.profileService.getEmployees().subscribe(
      (response: any) => {
        var data = response?.rows
        .filter(item => !(item.doc._id.includes('_design')))
        .find((r: any) => r.doc.id_no == this.form.controls.id_no?.value && r.doc.creationDate == this.form.controls.creationDate.value);
        data ? this.employeeFound = true : false;
        data ? this.employeeData = data.doc : null;
        console.log(this.employeeData)
        this.loading = false; //fetching data endpoint
    })
  }

  updateUser() {
    if (this.form.valid) {
      var clone = this.form.getRawValue()
      clone._attachments = {}
      clone._attachments.signature = this.signatureFile;
      this.profileService.updateUser(clone).subscribe(
        (response: any) => {
          this.form.patchValue({_rev: response.rev})
          this.withNewSignature = false;
          if(this.employeeData){
            this.updateEmployee()
          }
          else{
            this.toastr.success('Profile update successfully.')
          }
        },
        (error) => {
          this.toastr.error(error.error.reason)
        }
      )
    } else {
      this.form.markAllAsTouched()
    }
  }

  updateEmployee(){
    this.employeeData.mobileNumber = this.form.get('contact').value
    this.profileService.updateEmployee(this.employeeData).subscribe(
      (response: any) => {
        this.toastr.success('Profile update successfully.')
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
    this.employeeData
  }

  openModal(id){
    this.modalService.open(id, { backdrop: true, keyboard: true, animation: true, centered: true, size: 'md' })
  }

  dismiss() {
    this.modalService.dismissAll()
  }

  openFileInput(): void {
    // Trigger a click event on the file input element
    this.fileInput.nativeElement.click();
  }

  
  saveSignature(e){
    const base64 = e.replace("data:image/png;base64,", "");
    const imageName = 'name.png';
    const imageBlob = this.dataURItoBlob(base64);
    const imageFile = new File([imageBlob], imageName, { type: 'image/png' });
    this.formatFile(imageFile)
    this.dismiss()

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
        this.imageSrc = dataUrl
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
            this.signatureFile = attachment
            this.withNewSignature = true;
            this.toastr.success('Signature successfully attached!');
            // return attachment
            // imgatth = attachment;
        }
    }
  }


  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
        const selectedFile = inputElement.files[0];
        // Now you can do something with the selected file, such as uploading it to a server or processing it.
        console.log('Selected File:', selectedFile);
        this.formatFile(selectedFile)
        console.log(this.signatureFile)

    }
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
        this.imageSrc = (xx).toString()
      })
    }
    else{
      this.imageSrc = undefined;
    }
  }

  formatAttachment(attachmentInfo) {
    const contentType = attachmentInfo.content_type;
    const dataUrl = ''; // Replace this with the actual data URL of the image, if available
    const data = ''; // Replace this with the base64-encoded image data
  
    const attachment = {
      content_type: contentType,
      data: data
    };
  
    const attachmentName = 'signature.png'; // You can set a default name or get it from somewhere else
  
    console.log(attachment);
    this.signatureFile = attachment;
    this.toastr.success('Signature successfully attached!');
    // You can return the attachment if needed
    // return attachment;
  }
}
