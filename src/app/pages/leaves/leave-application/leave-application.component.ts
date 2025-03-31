import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { LeaveService } from '@services/leave/leave.service';
import { ProfileService } from '@services/profile/profile.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { BakcEndService } from '@/bakc-end.service';
import { SmsNotificationService } from '@services/profile/sms-notification.service';
import { environment } from 'environments/environment';


@Component({
  selector: 'app-leave-application',
  templateUrl: './leave-application.component.html',
  styleUrls: ['./leave-application.component.scss']
})
export class LeaveApplicationComponent implements OnInit {
  @ViewChild('pdfIframe') pdfIframe: ElementRef;
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;

  loading = false;
  signatureImg?: string;
  base64Image: string | null = null;
  userSignature:string | null = null;
  useUserSignaturePreset:boolean = false;
  imgData:string; //for displaying only

  viewOn:boolean = false;
  searchId:string =  '';
  searchString:string =  '';
  searchResults:any = [];
  showDropdown: boolean = false;
  userHasIdNo: boolean = true;
  id_no:string =  '';
  searchMessage = 'Loading...';
  dtOptions: any
  leaveForm: FormGroup
  currentEmployee:any = null;
  currentLeaveCardData:any = null;
  currentLeaves:any[] = [];
  leaves = [] 
  dateToday = new Date()
  leaveTypes: any = []
  employees: any[] = []
  filteredEmployees:any[] = []
  leaveCardData = []
  currentUser:any = null;
  currentGroup:any = null;
  modalCreateRef: NgbModalRef;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private leaveService: LeaveService,
    private profileService: ProfileService,
    private service: BakcEndService,
    private smsNotifService: SmsNotificationService,
    ) {
    this.dtOptions = {
      language: {
        search: '',
        searchPlaceholder: 'Search',
        lengthMenu: 'Show _MENU_ entries'
      },
      pageLength: 10,
      ordering: false,
      paging: true,
      dom: 'Bfrtip',
      buttons: [
        {extend: 'print', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'copyHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'csvHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'excelHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      ]
    }

    this.leaveForm = fb.group({
      referenceNumber: [null],
      id_no: [null, Validators.required],
      leaveType: [null, Validators.required],
      dateFiled: [null, Validators.required],
      totalDays: [null],
      others: [null], //if selected different leavetype beyond 013 or specified
      commutation:[false],

      startDateTime: [null, Validators.required],
      finishDateTime: [null, Validators.required],
      leaveLocation: [null], //if VL/SPL   "local" / "international"
      leaveLocationDetail: [null], //if VL/SPL specify details
      sickLeaveLocation: [null], //if sick leave "hospital" / "out patient"
      sickLeaveDetail: [null], // specify details
      splBenefitsForWomenDetail:[null], //if spl leave benefits for women specify details
      
      studyLeaveDetail: [null], //if study leave "master degree" / "BAR"
      otherPurpose: [null], //"monetization" / "terminal leave"
      
      approverA: [null], //person who certified the leave credit
      approverAPosition: [null],
      approverB: [null], //recommendation optional
      approverBPosition: [null],
      approverC: [null],
      approverCPosition: [null],
      
      status: ['pending'], //approved or not
      dateOfApproval: [null],
      recommendation: [null],
      recommendationDisapprovalReason:[null],
      disapprovalReason:[null],

      //signatures
      applicantSignature: [null],
      approverASignature: [null],
      approverBSignature: [null],
      approverCSignature: [null],

      department: [null],
      empFirstName: [null],
      empLastName: [null],
      empMiddleName: [null],
      position_title: [null],
      monthlyRate: [null],
      credit: [null],
      wop: [null],
    })
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.base64Image = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(inputElement: HTMLInputElement) {
    this.base64Image = null;
    inputElement.value = '';
  }

  saveSignature(signature: string): void {
    this.signatureImg = signature.replace("data:image/png;base64,", "");
    this.f.get('applicantSignature').patchValue(this.signatureImg)
    this.saveLeaveApplication();

    this.dismissSignForm()
  }
  
  ngOnInit(): void {
    this.loading = true;
    this.getLeaveTypes();
    this.getCurrentUser()
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

            if(this.currentUser._attachments?.signature){
              this.http.get(environment.globalUrl + `/users/${this.currentUser._id}/signature`, {
                responseType: 'arraybuffer',
                headers: { 'Authorization': 'Basic ' + btoa('admin:h@n@')}
              })
              .toPromise().then((data: ArrayBuffer) => { // Convert the binary data to base64
                this.convertTo64(data)
              }).catch(error => {
                console.error('Error retrieving attachment:', error);
              });
            }
        }
      })

  }

  convertTo64(data) {
    const binaryData = new Uint8Array(data);
    const chunkSize = 8192; //using chunks instead of a recursive approach
    let base64Data = '';
  
    for (let i = 0; i < binaryData.length; i += chunkSize) {
      const chunk = binaryData.slice(i, i + chunkSize);
      base64Data += String.fromCharCode.apply(null, chunk);
    }
  
    this.userSignature = `data:image/png;base64,${btoa(base64Data)}`;
  }
  

  /**
   * Get Employees
   */
  getEmployees() {
    this.profileService.getEmployees().subscribe(
      (response: any) => {
        let list = response?.rows.filter(item => !(item.doc._id.includes('_design')));
        if(this.currentUser?.department != null){
          this.employees = list.filter(item => (item.doc.serviceInformation?.department?.includes(this.currentUser?.department)));
          this.filteredEmployees = this.employees
        } else {
          this.employees = list
          this.filteredEmployees = list
        }

        if(this.currentUser?.id_no || this.currentGroup?.group_name === 'Employee'){
          console.log('user has employee record')
          this.userHasIdNo = true;
          this.searchId = this.currentUser?.id_no;
          console.log('ids', this.userHasIdNo, this.searchId)
          console.log('leaves', this.leaveCardData)
          this.searchEmployee()
        } else  {
          this.userHasIdNo = !this.userHasIdNo;
          this.searchMessage = "No Employee Selected"
        }

        this.loading = false; //endpoint
      },
      (error) => {
        this.toastr.error(error.error.reason)
        this.loading = false; //endpoint
      }
    )
  }

  /**
   * Get Leave Cards
   */
  getLeaveCard(){
    this.leaveCardData = []
    this.leaveService.getLeaveCard().subscribe((response:any)=>{
        if(this.currentUser?.department != null){
          this.leaveCardData = response?.rows.filter(item => (item.doc?.department?.includes(this.currentUser?.department)));
        } else {
          this.leaveCardData = response?.rows
        }
      this.leaveCardData.forEach(data => {
        data.doc.card.forEach(el => {
          el.leaveName = this.getLeaveTypeName(el.leaveType)
        });
      })
      this.getEmployees();
    })
  }

  /**
   * Get Leave Types
   */
  getLeaveTypes() {
    this.leaveTypes = []
    this.leaveService.getLeaveTypes().subscribe(
      (response: any) => {
        this.leaveTypes = response?.rows
        this.getLeaveApprovals()
        this.getLeaveCard();
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

    /**
   * Get Leave Type Name
   * @param id
   * @returns
   */
    getLeaveTypeName(id) {
      if(id == null){
        return null
      }
  
      for (let index = 0; index < this.leaveTypes?.length; index++) {
        if (this.leaveTypes[index].doc.code == id) {
          return this.leaveTypes[index].doc.leave_name
        }
      }
    }

  /**
   * Get Leave Approvals
   */
  getLeaveApprovals() {
    this.loading = true;
    this.leaves = []
    this.currentLeaves = []
    this.leaveService.getLeaveApprovals().subscribe(
      (response: any) => {
        let list = response?.rows.filter(item => !(item.doc._id.includes('_design')));
        if(this.currentUser?.department != null){
          // this.leaves = list.filter(item => (item?.doc?.department?.includes(this.currentUser?.department)));
          this.leaves = list.filter(item => 
            item?.doc?.department && this.currentUser?.department && item.doc.department.includes(this.currentUser.department)
          );
        } else {
          this.leaves = list
        }
        this.leaves.sort((a, b) => -1)
        this.leaves.forEach(data => {
          data.doc.leaveName = this.getLeaveTypeName(data.doc.leaveType)
        });

        if(this.id_no !=null){
          this.filterLeaveApprovals()
        }

        this.loading = false;
      },
      (error) => {
        this.toastr.error(error.error.reason)
        this.loading = false;
      }
    )
  }

  /**
   * Function that searches employee details and leave card, listing all leave approvals
   */
  searchEmployee(){
      if (this.searchId ==undefined) this.searchId = '';
        const employee = this.employees.find(x=> x.doc.id_no == this.searchId)
        if(employee != undefined){
          this.currentLeaveCardData = this.leaveCardData.find(x=>x.doc.employee_id == employee.id)
          if(this.currentLeaveCardData == undefined){
            this.searchMessage = `No Leave Card records for Employee No.${this.searchId}.`
          }
          this.currentEmployee = employee.doc
          this.id_no = employee.doc.id_no
          this.filterLeaveApprovals();
        } else {
          this.searchId = (this.searchId == undefined)? '': this.searchId;
          this.currentEmployee = null;
          this.currentLeaveCardData = null;
          this.id_no = null
          this.searchMessage = `Employee No.${this.searchId} not found.`
        }
  }

  onSearchInput() {
      if (this.searchString) {
          this.showDropdown = true;
          this.searchResults = this.employees.filter(x => (x.doc.id_no.toLowerCase().includes(this.searchString.toLowerCase())) ||
           (x.doc.firstName.toLowerCase().includes(this.searchString.toLowerCase())) || (x.doc.lastName.toLowerCase().includes(this.searchString.toLowerCase())));
      } else {
          this.showDropdown = false;
          this.searchResults = [];
      }
  }
  
  selectResult(result: any) {
    this.showDropdown = false;
    this.searchString = result.doc.firstName +(result.doc.middleName? " "+ result.doc.middleName+" ": " ")+ result.doc.lastName +" ("+result.doc.id_no+")"; // You can use any field you want here

    this.searchId = result.doc.id_no;
    this.currentLeaveCardData = this.leaveCardData.find(x=>x.doc.employee_id == result.id)

    if(this.currentLeaveCardData == undefined){
      this.searchMessage = `No Leave Card records for Employee No.${this.searchId}.`
    }

    this.currentEmployee = result.doc
    this.id_no = result.doc.id_no
    this.filterLeaveApprovals();
  }

  /**
   * Filters Leave Approval list by id_no
   */
  filterLeaveApprovals(){
    this.currentLeaves = []
    const leaves = this.leaves.filter(x=>x.doc.id_no === this.id_no)
    this.currentLeaves = leaves;

    // Sort the leaves by dateFiled in descending order (latest date first)
    this.currentLeaves.sort((a, b) => {
      const dateA:any = new Date(a.doc.dateFiled);
      const dateB:any = new Date(b.doc.dateFiled);
      return dateB - dateA;
    });
  }

  clear(){
    this.currentEmployee = null;
    this.currentLeaveCardData = null;
    this.id_no = null
    this.searchMessage = 'No Employee Selected';
  }

  openCard(content){
    this.modalService.open(content, { backdrop: false, centered: true, size: 'xl' })
  }

  openLeaveForm(content){
    this.viewOn = false;
    this.f.enable()
    this.f.patchValue({
      id_no: this.id_no,
      status: 'pending',
      commutation: false,
      recommendation: null,
      dateFiled: getTodayDateString(),
    });
    this.modalService.open(content, { backdrop: false, centered: true, size: 'lg' })
  }

  openEditFileLeave(doc, content){
    this.f.enable()
    this.viewOn = false;
    this.f.addControl('_id', new FormControl(null, Validators.required))
    this.f.addControl('_rev', new FormControl(null))
    this.f.patchValue(doc)

    this.modalService.open(content, { backdrop: false, centered: true, size: 'lg' })
  }


  dismiss() {
    this.f.removeControl('_id')
    this.f.removeControl('_rev')
    this.modalService.dismissAll()
  }

  dismissSignForm() {
    this.modalCreateRef.dismiss()
  }
  
  get f(){
    return this.leaveForm
  }

  submitFileLeave(content){
    if(this.f.get('applicantSignature').value == null){
      this.modalCreateRef = this.modalService.open(content, { backdrop: false, centered: true, size: 'md' })
    } else this.saveLeaveApplication();
  }

  saveLeaveApplication(){
    this.f.get('totalDays').patchValue(this.getDiffDays(this.f.get('startDateTime').value, this.f.get('finishDateTime').value))
    this.appendData()

      if (this.f.get('_id')?.value) {
        this.leaveService.updateLeaveApproval(this.leaveForm.value).subscribe(
          (response: any) => {
            this.toastr.success('Leave updated successfully.')
            this.leaveForm.reset()
            this.dismiss()
            this.getLeaveApprovals()
          },
          (error) => {
            this.f.disable()
            this.toastr.error(error.error.reason)
          }
        )
      } else {
        this.f.get('referenceNumber').patchValue(Math.floor(Math.random() * 9999999999) + 1)
        this.leaveService.createLeaveApproval(this.leaveForm.value).subscribe(
          async (response: any) => {
            this.toastr.success('Leave created successfully.')
            this.smsNotifService.notify(this.leaveForm.value); //SMS SERVICE
            this.leaveForm.reset()
            this.dismiss()
            this.getLeaveApprovals()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
        }
  }

  /**
   * Append data needed for Report
   */
    appendData(){
      const emp = this.employees.find(x=> x.doc.id_no == this.f.get('id_no').value)
      this.leaveForm.patchValue({
        empFirstName: emp.doc.firstName,
        empLastName: emp.doc.lastName,
        empMiddleName: emp.doc.middleName,
        position_title: emp.doc.position_title,
        department: emp.doc.serviceInformation.department,
        monthlyRate: emp.doc.serviceInformation.monthlyRate,
      });
    }
  


  deleteFileLeave(data){
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.leaveService.deleteLeaveApproval(data).subscribe(
          (response: any) => {
            Swal.fire('Deleted!', '', 'success').then(() => { 
              this.getLeaveApprovals()
            })
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }

    })
  }
  
  hideOthers(){
    if(this.leaveForm.get('leaveType').value === 'others'){
      return true
    } else {
      this.leaveForm.get('others').setValue('');
      return false
    }
  }

  
/**
 * Get Diff Days excluding weekends
 * @param startDate
 * @param endDate
 * @returns
 */
getDiffDays(startDate, endDate) {
  if (startDate && endDate) {
    startDate = startDate.split('T')[0];
    endDate = endDate.split('T')[0];
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    let count = 0;

    // Iterate from startDate to endDate
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Check if the day is not a weekend
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        count++;
      }
    }
    return count;
  }
}

  hideDetails(type){
    if(type == 'vl'){
      return (this.leaveForm.get('leaveType').value === '001' || this.leaveForm.get('leaveType').value === '006');
    } else if(type == 'sl'){
      return (this.leaveForm.get('leaveType').value === '003');
    } else if(type == 'splw'){ //special benefits for women
      return (this.leaveForm.get('leaveType').value === '011');
    } else if(type == 'std'){ //study leave
      return (this.leaveForm.get('leaveType').value === '008');
    } else if(type == 'others'){ //Other purposes
      return (this.leaveForm.get('leaveType').value === 'others');
    }
  }

  checkFormValidity(){
    const leaveFrm = this.leaveForm.controls
    const leaveType = leaveFrm.leaveType.value;
     if (leaveType == '001' || leaveType == '006'){
      return (leaveFrm.leaveLocation.value != null && (leaveFrm.leaveLocationDetail.value != null && leaveFrm.leaveLocationDetail.value != ''))? true: false;
    } else if(leaveType == '003'){
      return (leaveFrm.sickLeaveLocation.value != null && (leaveFrm.sickLeaveDetail.value != null && leaveFrm.sickLeaveDetail.value != ''))? true: false;
    } else if(leaveType == '011'){
      return (leaveFrm.splBenefitsForWomenDetail.value != null)? true: false;
    } else if(leaveType == '008'){
      return (leaveFrm.studyLeaveDetail.value != null)? true: false;
    } else if(leaveType == 'others'){
      return (leaveFrm.others.value != null && leaveFrm.otherPurpose.value != null)? true: false;
    } 
    
    return (leaveType == null)? false: true;
  }

  formResets(){
    const leaveFrm = this.leaveForm.controls;

    leaveFrm.leaveLocation.reset()
    leaveFrm.leaveLocationDetail.reset()
    leaveFrm.sickLeaveLocation.reset()
    leaveFrm.sickLeaveDetail.reset()
    leaveFrm.splBenefitsForWomenDetail.reset()
    leaveFrm.studyLeaveDetail.reset()
    leaveFrm.others.reset()
    leaveFrm.otherPurpose.reset()
  }

  leaveDetails(l){
    if(l.leaveType == '001' || l.leaveType == '006') return `${l.leaveLocation}, ${l.leaveLocationDetail}`
    if(l.leaveType == '003') return `${l.sickLeaveLocation}, ${l.sickLeaveDetail}`
    if(l.leaveType == '011') return `${l.splBenefitsForWomenDetail}`
    if(l.leaveType == '008') return `${l.studyLeaveDetail == 'completion'? "Completion of Master's Degree":"BAR/Board Examination Review"}`
    if(l.leaveType == 'others') return `${l.otherPurpose}, ${l.others}`

    return ''
  }

    /**
   * Viewing Leave Approval 
   * @param data
   * @param content
   */
    viewLeaveApproval(data, content) {
      this.viewOn = true;
      this.f.patchValue(data)

      this.imgData = (data.applicantSignature !=null)?this.appendImageBase64(data.applicantSignature):null
      this.modalService.open(content, { backdrop: false, centered: true, size: 'lg' })
      this.f.disable()
    }

    appendImageBase64(img){
      return `data:image/png;base64,${img}`;
    }

    // print(id){
    //   window.open('/jasperserver/rest_v2/reports/reports/Application_For_Leave.pdf?_id="'+ id +'"', "_blank");
    // }

    download(id, type:string, refNo:string) {
      const titleMessage = (type === 'print')? 'Opening Print Preview...':'Downloading...';
      // Show the Swal dialog with custom progress bar template
      Swal.fire({
        title: titleMessage,
        // html: '<div class="progress-bar-container"><div class="progress-bar"></div></div>',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(null);
          this.print(id, type, refNo);
        }
      });
    }

    print(id, type, refNo){
      this.http.get('/jasperserver/rest_v2/reports/reports/Application_For_Leave.pdf?_id="'+ id +'"', {
        responseType: 'blob',
        headers: {
          'Authorization': 'Basic ' + btoa('jasperadmin:jasperadmin')
        }
      }).subscribe((response: any) => {
        if(type === 'print'){
          const blob = new Blob([response], { type: 'application/pdf' });
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
          const filename = 'Application_For_Leave_'+ refNo +'.pdf'; // Set the desired filename here
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(response);
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(link.href); //revoke the object URL after the download
        }
        this.closeDialog();
      },(error: any) => {
        // Handle errors here
        console.error('Error occurred:', error);
        this.closeDialog();
        Swal.fire({
          title: 'Error occured. Please Try Again or contact Administrators.',
          icon: 'error',
          showCloseButton: true,
          allowOutsideClick: true,
  
        });
      });
    }

    private closeDialog() {
      Swal.close();
    }


    transform(value: string): string {
      if (value) {
        // Use the `replace` method with a regular expression to remove the word "null"
        return value.replace(/\bnull\b/g, '');
      }
      return value;
    }
}

// Helper method to get today's date as a string in "yyyy-MM-dd" format
function getTodayDateString(): string {
  const currentDate = new Date();

  // Format the date in 'YYYY-MM-DD' format
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const day = currentDate.getDate().toString().padStart(2, '0');
  
  // Format the time in 'HH:mm' format
  const hours = currentDate.getHours().toString().padStart(2, '0');
  const minutes = currentDate.getMinutes().toString().padStart(2, '0');
  
  // Combine date and time in the format 'YYYY-MM-DDTHH:mm'
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
