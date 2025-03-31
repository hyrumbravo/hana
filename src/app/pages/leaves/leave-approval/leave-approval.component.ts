import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbDateStruct, NgbCalendar, NgbModalRef, NgbDate, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { LeaveService } from '@services/leave/leave.service';
import { ProfileService } from '@services/profile/profile.service';
import { BakcEndService } from '@/bakc-end.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { ObjService } from '@services/obj-pass/obj.service';
import { SmsNotificationService } from '@services/profile/sms-notification.service';
import { environment } from 'environments/environment';


@Component({
  selector: 'app-leave-approval',
  templateUrl: './leave-approval.component.html',
  styleUrls: ['./leave-approval.component.scss']
})
export class LeaveApprovalComponent implements OnInit {
  @ViewChild('pdfIframe') pdfIframe: ElementRef;
  @ViewChild(DataTableDirective, { static: false })
  dtElement: DataTableDirective;
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject();
  dateFilter: NgbDateStruct;

  loading = false;
  filterbyDay:boolean = true;
  // For Date Range
	hoveredDate: NgbDate | null = null;
	fromDate: NgbDate | null;
	toDate: NgbDate | null;

  today: NgbDateStruct;
  toApproveChecks: number[] = [];
  allChecked:boolean = false;
  approveMode:boolean = true; //use when user selects Approve/Deny Selected

  statusFilters = ['All', 'Pending', 'Processing', 'Approved', 'Denied'];
  currentStatusFilter = 'All';
  currentLeaveFilter = 'All';
  currentDeptFilter:string = 'All';

  // dtOptions: DataTables.Settings = {};
  form: FormGroup
  leaveForm: FormGroup
  leaves = []
  filteredLeaves:any[] = []
  branches:any[] = []
  departments:any[] = []
  leaveTypes: any = []
  approvers: any = []
  employees: any = []
  dateToday = getDateString()
  currentLeaveCardData:any = null;
  leaveCardData = []
  currentUser:any = null;
  currentGroup:any = null;

  deptHeadKeywords = ["city government department head i", "department head", 'dept head', "cgdh", "cgdh-i"]
  divChiefKeywords = ["division chief", 'div chief']
  mayorChiefKeywords = ["mayor", 'city mayor']
  approvalRequirement = {
    certification: true,
    divchief: false,
    depthead: false,
    mayor: false
  }

  isCertified: boolean = false;
  isApproved: boolean = false;
  isFinalApproved: boolean = false;
  
  approverId = null
  approverName = null
  approverPosition = null
  denyReason:string = '';
  signatureImg: string;
  formWarning: string;

  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
  base64Image: string | null = null;
  userSignature:string | null = null;
  useUserSignaturePreset:boolean = false;
  modalCreateRef: NgbModalRef;

  constructor(
    private calendar: NgbCalendar,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private leaveService: LeaveService,
    private backendService: BakcEndService,
    private profileService: ProfileService,
    private modalService: NgbModal,
    private datePipe: DatePipe,
    private http: HttpClient,
    public formatter: NgbDateParserFormatter,
    private objService: ObjService,
    private smsNotifService: SmsNotificationService
  ) {
    this.dtOptions = {
      language: {
        search: '',
        searchPlaceholder: 'Search',
        lengthMenu: 'Show _MENU_ entries'
      },
      pageLength: 7,
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
      approverC: [null], //final signatory officer
      approverCPosition: [null],
      
      status: ['pending'], //approved or not
      dateOfApproval: [null],
      recommendation:[null],
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

    const today = new Date();
    this.dateFilter = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
    this.today = this.calendar.getToday();

    this.fromDate = calendar.getToday();
		this.toDate = calendar.getNext(calendar.getToday(), 'd', 30);
  }

  ngOnInit(): void {
    this.loading = true;
    if(this.objService.sharedData){
      this.currentStatusFilter = this.objService.sharedData.status ? this.objService.sharedData.status : 'All'
      this.dateFilter = this.objService.sharedData.date === null ? this.objService.sharedData.date : { year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() };
    }
    this.getCurrentUser();
    this.getLeaveCard();
    this.getBranchAndDepartment();
    this.getLeaveTypes()
    this.getLeaveApprovers()
    this.getEmployees()
    console.log(this.objService.sharedData)
  }

  setFilterMode(mode: boolean) {
     this.filterbyDay = mode;
      this.resetHiddenFilter()
  }

  resetHiddenFilter(){
    if(this.filterbyDay){
      this.fromDate = this.calendar.getToday();
      this.toDate = this.calendar.getNext(this.calendar.getToday(), 'd', 30);
    } else {
      const today = new Date();
      this.dateFilter = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
      this.today = this.calendar.getToday();
    }
    this.filterLeaveApprovals()
  }

  getCurrentUser(){
    this.backendService.getSystemUser().subscribe(
      (response: any) => {
        this.currentUser = response?.rows[0].doc
        if(this.currentUser){
          this.backendService.getUserGroupbyId(this.currentUser.setting_id).subscribe(
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

  dismissSignForm() {
    this.useUserSignaturePreset = false;
    this.approverName = null; this.approverPosition = null, this.approverId = null;
    this.denyReason = ''; this.formWarning = '';
    this.modalService.dismissAll()
  }

  selectApprover(row){
    if(row == 'null'){
      this.approverId = null
      this.approverName = null
      this.approverPosition = null
      this.formWarning = "Approver Required!";
    } else {
      const apv = this.approvers.find(x=>x.id == row)
      this.approverId= apv.doc._id
      this.approverName= apv.doc.approverName
      this.approverPosition= apv.doc.position
      this.formWarning = "";
    }
  }

  get f() { return this.leaveForm}

  isReasonTextAreaEmpty(){ (this.denyReason!='')?this.formWarning='' :this.formWarning = 'Reason for disapproval is Required!';}

  appendImageBase64(img){ return `data:image/png;base64,${img}`; }

  toCertifyLeave(d){ return (d.approverC != null) } //check if leave is ready to certify

  hideLeaveActions(){ return !(this.isUserDivisionChief() || this.isUserFinalApprove()) }   //hide certify options for approvers

  showLeaveActions(d) {
    if (this.isUserDivisionChief()) {
      if(this.deptHeadKeywords.includes(d.position_title?.toLowerCase()) || this.divChiefKeywords.includes(d.position_title?.toLowerCase())) return false; //user is dept head (doesnt require div chief)
      return d.approverB === null;
    }
    if (this.isUserCanFinalApprove(d)) return d.approverC === null;

    return false;
  }

  isUserCanFinalApprove(d){
    let reqs  = {
      certification: true,
      divchief: false,
      depthead: false,
      mayor: false
    }

    if(this.deptHeadKeywords.includes(d.position_title?.toLowerCase())){ reqs.mayor = true
    } else if(this.divChiefKeywords.includes(d.position_title?.toLowerCase())){ reqs.depthead = true
    } else {
      reqs.depthead = true;
      reqs.divchief = true;
    }

    let user = this.currentUser?.designation?.toLowerCase()
    let valReturn = false;
    if(reqs.depthead){
      if(reqs.divchief && d.approverB == null) return false; //no yet approved by div chief
      if(this.deptHeadKeywords.includes(user)) valReturn = true;
    } else if(reqs.mayor){
      if(this.mayorChiefKeywords.includes(user)) valReturn = true;
    }
    return valReturn
  }

  getBranchAndDepartment(){
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

  getLeaveTypeName(id) {
    for (let index = 0; index < this.leaveTypes?.length; index++) {
      if (this.leaveTypes[index].doc.code == id) {
        return this.leaveTypes[index].doc.leave_name
      }
    }
    return null;
  }

  /**
   * Get Diff Days
   * @param startDate
   * @param endDate
   * @returns
   */
  getDiffDays(startDate, endDate) {
    if (startDate && endDate) {
      startDate = startDate.split('T')[0]
      endDate = endDate.split('T')[0]
      startDate = new Date(startDate)
      endDate = new Date(endDate)
      endDate.setDate(endDate.getDate() + 1)
      return Math.ceil(Math.abs(startDate - endDate) / (1000 * 60 * 60 * 24));
    }
  }

  /**
   * Get Employee Name
   * @param id
   * @returns
   */
  getEmployeeName(doc) {
    for (let index = 0; index < this.employees?.length; index++) {
      if (this.employees[index].doc.id_no == doc.id_no) {
        return this.employees[index].doc.firstName + ' ' + this.employees[index].doc.middleName + ' ' + this.employees[index].doc.lastName + ' ' + ((this.employees[index].doc.ext)?this.employees[index].doc.ext:'')
      } else {
        return doc.empFirstName +' '+ doc.empMiddleName+' '+ doc.empLastName
      }
    }
  }

  /**
   * Get Employee Branch
   * @param id
   * @returns
   */
  getEmployeeBranch(id) {
    for (let index = 0; index < this.employees?.length; index++) {
      if (this.employees[index].doc.id_no == id) {
        return this.employees[index].doc.serviceInformation?.branch
      }
    }
  }

  /**
   * Get Leave Approvals
   */
  getLeaveApprovals() {
    this.loading = true;
    this.leaves = []
    this.filteredLeaves = []
    this.leaveService.getLeaveApprovals().subscribe(
      (response: any) => {
        let list = response?.rows.filter(item => !(item.id.includes('_design')));
        if(this.currentUser?.department != null){
          this.leaves = list.filter(item => (item.doc?.department?.includes(this.currentUser?.department)));
          this.filteredLeaves = this.leaves
        } else {
          this.leaves = list
          this.filteredLeaves = list
        }
        this.leaves.sort((a, b) => -1)
        this.leaves.forEach(data => {
          const emp = this.employees.find(x=> x.doc.id_no == data.doc.id_no);
          if(emp){
            data.doc.branch = this.getEmployeeBranch(data.doc.id_no)
            data.doc.leaveName = this.getLeaveTypeName(data.doc.leaveType)
          }
          
        });
        this.filterLeaveApprovals()
        this.loading = false; //endpoint
      },
      (error) => {
        this.toastr.error(error.error.reason)
        this.loading = false; //endpoint
      }
    )
  }

  /**
   * Get Leave Types
   */
  getLeaveTypes() {
    this.leaveService.getLeaveTypes().subscribe(
      (response: any) => {
        this.leaveTypes = response?.rows
      }, (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Leave Approvers
   */
  getLeaveApprovers() {
    this.leaveService.getLeaveApprovers().subscribe(
      (response: any) => {
        this.approvers = response?.rows
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Employees
   */
  getEmployees() {
    this.employees = []
    this.profileService.getEmployees().subscribe(
      (response: any) => {
        let list = response?.rows.filter(item => !(item.doc._id.includes('_design')));
        if(this.currentUser?.department != null){
          this.employees = list.filter(item => (item.doc.serviceInformation?.department?.includes(this.currentUser?.department)));
        } else {
          this.employees = list
        }
        this.getLeaveApprovals()
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Leave Cards
   */
  getLeaveCard(){
    this.leaveCardData = []
    this.leaveService.getLeaveCard().subscribe((response:any)=>{
      this.leaveCardData = response?.rows
      this.leaveCardData.forEach(data => {
        data.doc.card.forEach(el => {
          el.leaveName = this.getLeaveTypeName(el.leaveType)
        });
      })
    
    })
  }

  updateEmployeeLeaveCard(leaveId){
    let leaveEntry = newCredit()
    const fValues = this.f.value
    leaveEntry.particulars = this.getLeaveTypeName(fValues.leaveType);
    leaveEntry.leaveId = leaveId;

    let employeeCard = this.leaveCardData.find(x=> x.doc.id_no == fValues.id_no)
    const updatedCard = computeDeductions(leaveEntry, fValues, employeeCard.doc)
    this.leaveService.updateLeaveCard(updatedCard).subscribe((response:any)=>{
      if(response.ok){
        this.toastr.success('Leave Card updated.')
        this.f.reset()
        this.dismiss()
        this.getLeaveApprovals()
        this.getLeaveCard()
      }
    },
    (error) => {
      this.toastr.error(error.error.reason)
    })
  }

  /**
   * Submit Leave Approval
   */
  submitLeaveApproval() {
    this.appendData()
    if(this.f.get('status').value == 'approved') this.appendCreditRecord();
    this.leaveService.updateLeaveApproval(this.f.value).subscribe(
      (response: any) => {
        if(response.ok){ //make sure it updated first
          // check if it's approved
          this.smsNotifService.notify(this.f.value); //SMS SERVICE
          if(this.f.get('status').value == 'approved'){
            this.updateEmployeeLeaveCard(response.id)
          } else {
            this.f.reset()
            this.dismiss()
            this.getLeaveApprovals()
            this.getLeaveCard()
          }
          this.toastr.success('Leave updated successfully.')
        }
      },
      (error) => {
        this.f.disable()
        this.toastr.error(error.error.reason)
      }
    )
  }

  updateApproval(){
    if(this.f.get('status').value === 'pending') this.f.get('status').patchValue('processing');
    this.submitLeaveApproval()
  }

  approveLeaveApproval() { //certify
    this.f.get('status').patchValue('approved')
    this.submitLeaveApproval()
  }

  rejectLeaveApproval() {
    this.f.get('status').patchValue('denied')
    this.submitLeaveApproval()
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

  appendCreditRecord(){
    const empCard = this.leaveCardData.find(x=> x.doc.id_no == this.f.get('id_no').value)
    let wop = false;


    if(empCard){
    let vl:any = "-", sl:any = "-", newvlBal = empCard.doc.vlBalance, newslBal = empCard.doc.slBalance;

    if(this.f.get('leaveType').value === '001' || this.f.get('leaveType').value === '002'){
      vl = this.f.get('totalDays').value
      if ((empCard.doc.vlBalance - vl) < 0) wop = true;

      if(!wop) newvlBal =  Number((empCard.doc.vlBalance - vl).toFixed(3))
      
    } else if(this.f.get('leaveType').value === '003'){
      sl = this.f.get('totalDays').value
      if ((empCard.doc.slBalance - sl) < 0) wop = true;

      if(!wop) newslBal = Number((empCard.doc.slBalance - sl).toFixed(3))
    }   

    let creditCert = {
      'as_of': this.datePipe.transform(this.dateToday,"MM-dd-yyyy"),
      'earnedVlBalance':empCard.doc.vlBalance,
      'earnedSlBalance':empCard.doc.slBalance,
      'toDeductVl':vl,
      'toDeductSl':sl,
      'newVlBalance':newvlBal,
      'newSlBalance':newslBal
    }

    this.f.addControl('credit', new FormControl())
    this.f.get('credit').patchValue(creditCert)
    this.f.get('wop').patchValue(wop)
    }
  }

  resetApproverRequirement(){
    this.approvalRequirement = {
      certification: true,
      divchief: false,
      depthead: false,
      mayor: false
    }
  }

  /**
   * Edit Leave Approval
   * @param data
   * @param content
   */
  editLeaveApproval(data, content) {
    this.resetApproverRequirement();
    (data.approverA)? this.isCertified = true: this.isCertified = false;
    (data.approverB)? this.isApproved = true: this.isApproved = false;
    (data.approverC)? this.isFinalApproved = true: this.isFinalApproved = false;
    
    this.leaveForm.patchValue(data)
    this.currentLeaveCardData = null
    this.currentLeaveCardData = this.leaveCardData.find(x=>x.doc.id_no == data.id_no)
    this.checkApprovers()
    this.modalService.open(content, { backdrop: false, centered: true, size: 'lg' });

  }

  /**
   * Delete Leave
   * @param index
   */
  deleteLeaveApproval(data) {
    let empCard = this.leaveCardData.find(x=>x.doc.id_no == data.id_no);
    let index = (data.status == 'approved')? empCard.doc.card.findIndex(x=>x.leaveId == data._id): null;

    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      text: "Note: Deleting an approved record will remove its data in the Employee's Leave Card",
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        
        // if leave is an approved leave, update employee card
        // search for leaveId in card = leaveId
        // recompute 
        
        this.leaveService.deleteLeaveApproval(data).subscribe(
          (response: any) => {
            if(index != null){
             let newCard = updateComputedChanges(empCard,index);
              this.leaveService.updateLeaveCard(newCard.doc).subscribe(
                (response: any) => {
                  if(response.ok){
                    Swal.fire('Deleted!', '', 'success').then(() => {
                      this.getLeaveApprovals()
                      this.getLeaveCard()
                    })
                  }
                },
                (error) => {
                  this.toastr.error(error.error.reason)
                })
           } else {
            Swal.fire('Deleted!', '', 'success').then(() => {
              this.getLeaveApprovals()
              this.getLeaveCard()
            })
           }
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    });
  }

  checkApprovers(){
    if(this.deptHeadKeywords.includes(this.f.get('position_title').value?.toLowerCase())){ //if employee is dept head
      this.approvalRequirement.mayor = true
    } else if(this.divChiefKeywords.includes(this.f.get('position_title').value?.toLowerCase())){ //if employee is div chief
      this.approvalRequirement.depthead = true
    } else { //if employee other
      this.approvalRequirement.depthead = true
      this.approvalRequirement.divchief = true
    }
  }

  dismiss() { this.modalService.dismissAll() }

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

  leaveDetails(leave) {
    const { leaveType } = leave;
  
    switch (leaveType) {
      case '001':
      case '006': return `${leave.leaveLocation}, ${leave.leaveLocationDetail}`;
      case '003': return `${leave.sickLeaveLocation}, ${leave.sickLeaveDetail}`;
      case '011': return `${leave.splBenefitsForWomenDetail}`;
      case '008': return leave.studyLeaveDetail === 'completion'
          ? "Completion of Master's Degree"
          : "BAR/Board Examination Review";
      case 'others': return `${leave.otherPurpose}, ${leave.others}`;
      default: return 'N/A';
    }
  }

  /**
  * Filters Leave Approval list by status and department
  */
  filterLeaveApprovals() {
    this.leaves = []
    setTimeout(() => {
      const statusFilter = this.currentStatusFilter.toLowerCase();
      const leaveFilter = this.currentLeaveFilter.toLowerCase();
      const deptFilter = this.currentDeptFilter.toLowerCase();

      const dateFormat = this.formatDateToString(this.dateFilter)
      const fromDateFormat = this.formatDateToString(this.fromDate)
      const toDateFormat = this.formatDateToString(this.toDate)

      if (statusFilter === "all" && leaveFilter == null && deptFilter === "all" && this.dateFilter === null) {
        this.leaves = this.filteredLeaves; // No filters applied, show all leaves
      } else {
        if(this.filterbyDay){
          const filteredList = this.filteredLeaves.filter(x =>
            (statusFilter === "all" || x.doc.status?.toLowerCase() === statusFilter) &&
            (leaveFilter === "all" || x.doc.leaveName?.toLowerCase() === leaveFilter) &&
            (dateFormat === null || getDateString(x.doc.dateFiled) === dateFormat)
            );
            this.leaves = filteredList;
          } else {
          const filteredList = this.filteredLeaves.filter(x =>
            (statusFilter === "all" || x.doc.status?.toLowerCase() === statusFilter) &&
            (leaveFilter === "all" || x.doc.leaveName?.toLowerCase() === leaveFilter) &&
            ((fromDateFormat === null && toDateFormat == null )|| isDateWithinRange(getDateString(x.doc.dateFiled), fromDateFormat, toDateFormat))
            );
            this.leaves = filteredList;            
          }
      }
    }, 100);

    // Optionally, you can also update the DataTable options (dtOptions) with the filtered data
    // this.dtOptions.data = this.leaves;
    // Trigger the table to re-render with the updated data
    // this.dtTrigger.next('');
    // this.leaves.map((l) => {
    //   console.log(dateFormat)
    //   console.log(l.doc.dateFiled)
    // })
  }

  // Convert the NgbDateStruct object to a custom object representation
  ngbDateStructToCustomObject(ngbDate: NgbDateStruct) {
    if (!ngbDate) return null;
    return { year: ngbDate.year, month: ngbDate.month, day: ngbDate.day };
  }

  // Convert the custom object back to an NgbDateStruct object
  customObjectToNgbDateStruct(customObject: any) {
    if (!customObject) return null;
    return { year: customObject.year, month: customObject.month, day: customObject.day };
  }

  clearDateFilter() {
    this.currentLeaveFilter = 'All'
    this.currentLeaveFilter = 'All';

    if(this.filterbyDay){
      this.dateFilter = null;
    } else {
      this.fromDate = null;
      this.toDate = null;
    }
    // Optionally, call the filterLeaveApprovals() method after clearing the filter to update the results immediately.
    this.filterLeaveApprovals();
  }
  // Convert the NgbDateStruct object to the desired format "yyyy-mm-dd"
  formatDateToString(ngbDate: NgbDateStruct): string {
    if (!ngbDate) return null;
    
    const year = ngbDate.year.toString().padStart(4, '0');
    const month = ngbDate.month.toString().padStart(2, '0');
    const day = ngbDate.day.toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  isUserDivisionChief() {
    return this.divChiefKeywords.includes(this.currentUser?.designation?.toLowerCase());
  }
  
  isUserFinalApprove() {
    const user = this.currentUser?.designation?.toLowerCase();

    return (this.deptHeadKeywords.includes(user) || this.mayorChiefKeywords.includes(user));
  }
  
  isUserMayor(test) {
    const user = this.currentUser.designation.toLowerCase();
    const testLower = test.toLowerCase();
  
    const isUserMayorOrChief = this.mayorChiefKeywords.includes(user);
  
    return isUserMayorOrChief ? testLower === user : !this.mayorChiefKeywords.includes(testLower);
  }
  
  // toggleAllCheckboxes() {
  //   if (this.allChecked) {
  //     this.toApproveChecks = [];
  //   } else this.toApproveChecks = this.leaves.map((_, index) => index);
  //   this.allChecked = !this.allChecked;
  // }

  onCheckboxChange(index: number) {
    this.toApproveChecks = this.toApproveChecks.includes(index)
      ? this.toApproveChecks.filter(i => i !== index)
      : [...this.toApproveChecks, index];
  }  

  multiSign(type, content){
    this.approveMode = (type === 'approve');
    this.setUserApprover()
    this.modalService.open(content, { backdrop: false, centered: true, size: 'lg' })  
  }

  /**
   * Approve All Llaves selected by user
   * @param type -if for approval/deny
   * @param signature -base64 string from app-signing-pad
   */
  saveSignatureMultiple(type:string, signature:string): void {
    if(this.approverName != null && this.approverPosition!=null){
      this.signatureImg = signature.replace("data:image/png;base64,", "");

      if(type === 'approve'){
        const leavesToUpdate = this.getLeaveApplicationsToApprove(type);
        this.updateLeaveApprovalsInSync(leavesToUpdate)
      } else { //deny
        if(this.denyReason != ''){
          const leavesToUpdate = this.getLeaveApplicationsToApprove(type); 
          this.updateLeaveApprovalsInSync(leavesToUpdate)
        } else this.formWarning = 'Reason for Disapproval is Required!';
      }
    } else this.formWarning = 'Approver Required!';
  }

  /**
   * Fetches and appends data from the toApproveChecks array
   * @param type -if the action is to approve or deny
   * @returns newArr - array of leaves
   */
  getLeaveApplicationsToApprove(type){
    let newArr:any = []
    this.toApproveChecks.forEach(element => {  //loop to get needed data
      let check = this.leaves[element]
      if(check.doc.status === 'pending') check.doc.status = 'processing';

      if(this.isUserDivisionChief()){
        if(type === 'deny') check.doc.recommendationDisapprovalReason = this.denyReason
        check.doc.recommendation = (type === 'approve');
        check.doc.approverBSignature = this.signatureImg;
        check.doc.approverB = this.approverName;
        check.doc.approverBPosition = this.approverPosition;
      } else {
        if(type === 'deny') {
          check.doc.disapprovalReason = this.denyReason
          check.doc.status = 'denied';
        }
        check.doc.approverCSignature = this.signatureImg;
        check.doc.approverC = this.approverName;
        check.doc.approverCPosition = this.approverPosition;
        check.doc.dateOfApproval = (type === 'deny')?null : this.dateToday;
      }

      newArr.push(check.doc)
    });

    return newArr
  }

  async updateLeaveApprovalsInSync (leavesToUpdate: any[]) {
    const successMessages = [];
    const errorMessages = [];
  
    for (let el of leavesToUpdate) {
      try {
        await this.leaveService.updateLeaveApproval(el).toPromise().then((response:any)=>{
          if(response.ok){
            if(el.status != 'denied') this.smsNotifService.notify(el); // Inserted here
          }
        });
        successMessages.push(`Leave updated successfully for ID: ${el.id}`);
      } catch (error) {
        errorMessages.push(`Failed to update leave for ID: ${el.id} - ${error.error.reason}`);
      }
    }
  
    this.dismiss();
    this.getLeaveApprovals();
  
    if (successMessages.length > 0) {
      this.toastr.success(`Leaves updated successfully`);
    }
  
    if (errorMessages.length > 0) {
      this.toastr.error(`Leaves failed to update, something went wrong.`);
      console.log(errorMessages)
    }
  
    this.toApproveChecks = []; // clear queue
  }
  
  /**
   * Approval Per leave(check button)
   * @param signature 
   */
  saveSignature(signature: string): void {
    if(this.approverName != null && this.approverPosition!=null){
      this.signatureImg = signature.replace("data:image/png;base64,", "");
      if(!this.isFinalApproved){
        (this.isUserDivisionChief())? this.saveUpdate('B'): this.saveUpdate('C'); //APPROVER B // APPROVER C
      } else this.saveUpdate('A') //Certification

      this.formWarning = "";
    } else {
      this.formWarning = 'Approver Required!'
    }

  }

  /**
   * Reject/Deny per leave (cross button)
   * @param signature 
   */
  saveSignatureReject(signature: string): void {
    if(this.approverName != null && this.approverPosition!=null && this.denyReason != ''){
      this.signatureImg = signature.replace("data:image/png;base64,", "");
      const lFrm = this.leaveForm;
      this.formWarning = "";
      if(this.isUserDivisionChief()){
        lFrm.patchValue({
          recommendation: false, recommendationDisapprovalReason: this.denyReason,
          approverBSignature: this.signatureImg,
          approverB: this.approverName, approverBPosition: this.approverPosition,
        });
        this.updateApproval();
      } else {
        lFrm.patchValue({
          disapprovalReason: this.denyReason,
          approverCSignature: this.signatureImg,
          approverC: this.approverName, approverCPosition: this.approverPosition,
        });
        this.rejectLeaveApproval()
      }
    } else {
      this.formWarning = 'Officer & Reason for disapproval is Required!'
    }
  }

  //final action of user approving
  saveUpdate(signatory) {
    const lFrm = this.leaveForm;
    if (signatory === 'A') {
      lFrm.patchValue({
        approverASignature: this.signatureImg, approverA: this.approverName,
        approverAPosition: this.approverPosition
      });

      this.approveLeaveApproval()
    } else if (signatory === 'B') {
      lFrm.patchValue({
        recommendation: true, approverBSignature: this.signatureImg,
        approverB: this.approverName, approverBPosition: this.approverPosition,
      });
      this.updateApproval();
    } else if (signatory === 'C') {
      lFrm.patchValue({
        approverCSignature: this.signatureImg, approverC: this.approverName,
        approverCPosition: this.approverPosition, dateOfApproval: this.dateToday,
      });
      this.updateApproval();
    }

    this.dismissSignForm();
  }
  
  openApproval(data, content) {
    this.resetApproverRequirement();
    (data.doc.approverA)? this.isCertified = true: this.isCertified = false;
    (data.doc.approverB)? this.isApproved = true: this.isApproved = false;
    (data.doc.approverC)? this.isFinalApproved = true: this.isFinalApproved = false;

    this.currentLeaveCardData = null
    this.leaveForm.addControl('_id', new FormControl(null, Validators.required))
    this.leaveForm.addControl('_rev', new FormControl(null))
    this.leaveForm.patchValue(data.doc)
    this.currentLeaveCardData = this.leaveCardData.find(x=>x.doc.id_no == data.doc.id_no)

    this.setUserApprover()
    this.modalService.open(content, { backdrop: false, centered: true, size: 'lg' })
  }
  
/**
 * checks if user is an approver (looking up approver.userId) 
 * automatically patches their name and position when approving
 */
  setUserApprover(){
    const userId = this.currentUser._id

    let approverInfo = this.approvers.find(x=>x.doc.userId == userId && x.doc.formApproval === this.determineSignatory())
    if(approverInfo){
      this.approverId = approverInfo.doc._id;
      this.approverName = approverInfo.doc.approverName;
      this.approverPosition = approverInfo.doc.position;
    }
  }

  determineSignatory(){
    if(this.isUserDivisionChief()) return '7B';
    if(this.isUserFinalApprove()) return '7C';
    return '7A'
  }

	onDateSelection(date: NgbDate) {
		if (!this.fromDate && !this.toDate) {
			this.fromDate = date;
		} else if (this.fromDate && !this.toDate && date && date.after(this.fromDate)) {
			this.toDate = date;
		} else {
			this.toDate = null;
			this.fromDate = date;
		}

    if(this.fromDate && this.toDate){
      this.filterLeaveApprovals()
    }
	}

	isHovered(date: NgbDate) {
		return (
			this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate)
		);
	}

	isInside(date: NgbDate) {
		return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
	}

	isRange(date: NgbDate) {
		return (
			date.equals(this.fromDate) ||
			(this.toDate && date.equals(this.toDate)) ||
			this.isInside(date) ||
			this.isHovered(date)
		);
	}
	validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
		const parsed = this.formatter.parse(input);
		return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
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
}

// Helper method to get today's date or a parameter date as a string in "yyyy-MM-dd" format
function getDateString(dateStr = null) {
  let date = (dateStr === null)?new Date():new Date(dateStr);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string.');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

//function that computes changes of approved leave
function computeDeductions(credit, data, card){
  let prevVL = card.vlBalance, prevSL = card.slBalance
  let prevFL = card.flBalance, prevSPL = card.splBalance
  
  credit = fillDetails(credit, data) //fills other details not computed below

  credit.previousBalance = card.vlBalance
  credit.currentBalance = card.vlBalance
  credit.previousSickLeaveBalance = card.slBalance
  credit.currentSickLEaveBalance = card.slBalance
  credit.forcedLeaveBalance = card.flBalance
  credit.specialLeaveBalance = card.splBalance

  if(data.leaveType == '001' || data.leaveType == '002'){ //vl
    credit.vlslMonet = Number(data.totalDays.toFixed(3));

    if(prevVL == 0 || (prevSL - credit.vlslMonet < 0)){
      credit.wop = true
      credit.particulars = `${credit.particulars} (W/O pay)`;
    } else {
      credit.previousBalance = prevVL
      credit.currentBalance = Number((prevVL - data.totalDays).toFixed(3));
      card.vlBalance = credit.currentBalance;
    }

    if(data.leaveType == '002'){ //mandatory/forced leave
      if(prevVL != 0 || (prevSL - credit.vlslMonet < 0)){
        credit.forcedLeaveBalance = Number((prevFL - data.totalDays).toFixed(3));
        card.flBalance = credit.forcedLeaveBalance;
      }
    }

  } else if(data.leaveType == '003'){// sl
    credit.sl_deduction = data.totalDays
    if(prevSL == 0 || (prevSL - credit.sl_deduction < 0)){
      credit.particulars = `${credit.particulars} (W/O pay)`;
      credit.wop = true
    } else {
      credit.previousSickLeaveBalance = prevSL
      credit.currentSickLEaveBalance = Number((prevSL - credit.sl_deduction).toFixed(3));
      card.slBalance = credit.currentSickLEaveBalance;
    }
  } else if(data.leaveType == '006'){// spl
    if(prevSPL == 0 || (prevSL - credit.totalDays < 0)){
      credit.wop = true
      credit.particulars = `${credit.particulars} (W/O pay)`;
    } else {
      credit.specialLeaveBalance = Number((prevSPL - data.totalDays).toFixed(3));
      card.splBalance = credit.specialLeaveBalance;
    }

  } else if(data.leaveType == 'others'){ //monetization
    if(data.otherPurpose.toLowerCase() == 'monetization'){
      credit.vlslMonet = Number(data.totalDays.toFixed(3));

      credit.previousBalance = prevVL
      credit.currentBalance = Number((prevVL - credit.vlslMonet).toFixed(3));
      
      card.vlBalance = credit.currentBalance
    }
  } //else no deductions

  card.card.push(credit)
  return card;
}

//helper function to fill in data that is not for computation
function fillDetails(credit, data){
  const dateToday = new Date()

  credit.particulars = `${credit.particulars}(${data.totalDays})`
  credit.dataType = (data.leaveType != 'others')?'leave': ((data.otherPurpose.toLowerCase() == 'monetization')? 'monetization': 'leave');
  credit.leavetype = (data.leaveType != 'others')?data.leaveType: null;
  credit.as_of_start = (data.dateOfApproval == null)? getDateString(dateToday): data.dateOfApproval;
  credit.as_of_end = (data.dateOfApproval == null)?getDateString(this.dateToday): data.dateOfApproval;
  credit.leaveTotalDays = data.totalDays

  if(data.leaveType == 'others'){
    credit.particulars = data.otherPurpose
    if(data.otherPurpose.toLowerCase()=='monetization') credit.particulars = credit.particulars + "("+ data.totalDays +")";
  }

  if(data.leaveType == '003'){
    credit.sl_start = formatDate(data.startDateTime, 'sl')
    credit.sl_end = formatDate(data.finishDateTime, 'sl')
  } else {
   credit.vacationLeaveDates = `${formatDate(data.startDateTime, 'vl')} - ${formatDate(data.finishDateTime, 'vl')}` 
  }

  return credit;
}

function newCredit(){
  return {
    "dataType": "",
    "leavetype": null,
    "leaveId": null,
    "as_of_start": null,
    "as_of_end": null,
    "particulars": null,
    "earnedVacationCredits": 0,
    "daysTU": 0,
    "hoursTU": 0,
    "hoursEQUIV": 0,
    "minsTU": 0,
    "minsEQUIV": 0,
    "totEQUIV": 0,
    "vlslMonet": 0,
    "previousBalance": 0,
    "currentBalance": 0,
    "vacationLeaveDates": null,
    "ctoDates": null,
    "abs_und_wop": null,
    "addedForcedLeave": 0,
    "addedSpecialLeave": 0,
    "forcedLeaveBalance": 0,
    "specialLeaveBalance": 0,
    "earnedSickLeaveCredits": 0,
    "previousSickLeaveBalance": 0,
    "currentSickLEaveBalance": 0,
    "wop": false,
    "sl_deduction": 0,
    "sl_start": null,
    "sl_end": null,
    "leaveTotalDays": 0
  }
}

// Define a helper function to format the date
function formatDate(dateString: string, type): string {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString();

  return `${month}/${day}/${year}`;
}

//function that recomputes employee card after a leave is deleted
function updateComputedChanges(employeeCard, index){
  let newEmployeeCard = employeeCard
  let credit = employeeCard.doc.card[index]

  let newPrevBalance = credit.previousBalance
  let newPrevSBalance = credit.previousSickLeaveBalance
  let newFlSBalance = credit.forcedLeaveBalance
  let newSplBalance = credit.specialLeaveBalance
  //recompute the other entries to update balances
  if(index < (newEmployeeCard.doc.card.length-1)){
    for (let idx = index+1; idx < newEmployeeCard.doc.card.length; idx++) {
      let element = newEmployeeCard.doc.card[idx];

      element.previousBalance = newPrevBalance //take last previous vacation balance
      element.currentBalance = Number((element.previousBalance + element.earnedVacationCredits).toFixed(3));
      element.currentBalance = Number((element.currentBalance - element.totEQUIV).toFixed(3));//deduct monet/TU
      
      if(!element.wop){
        element.currentBalance = Number((element.currentBalance - element.vlslMonet).toFixed(3));//deduct leave only if !wop
      }

      element.previousSickLeaveBalance = newPrevSBalance //take last previous sick leave balance        
      element.currentSickLEaveBalance = Number((element.previousSickLeaveBalance + element.earnedSickLeaveCredits).toFixed(3));

      if(!element.wop){
        element.currentSickLEaveBalance = Number((element.currentSickLEaveBalance - (element.sl_deduction)).toFixed(3));//sl deductions
      }
      
      element.forcedLeaveBalance = newFlSBalance + element.addedForcedLeave
      element.specialLeaveBalance = newSplBalance + element.addedSpecialLeave

      //other leaves deduction
      if(element.leavetype == '002') element.forcedLeaveBalance =  Number(element.forcedLeaveBalance - element.vlslMonet);

      if(element.leavetype == '006') element.specialLeaveBalance = Number(element.specialLeaveBalance - element.leaveTotalDays);

      
      newPrevBalance = element.currentBalance
      newPrevSBalance = element.currentSickLEaveBalance
      newFlSBalance = element.forcedLeaveBalance
      newSplBalance = element.specialLeaveBalance
      
      newEmployeeCard.doc.card[idx] = element;
    }
  }
  
  //re-add deleted leave credits
  if(credit.dataType == 'monetization'){ //others
    newEmployeeCard.doc.vlBalance = Number((newEmployeeCard.doc.vlBalance + credit.vlslMonet).toFixed(3))
  } else if(credit.leavetype == '001' || credit.leavetype == '002'){ //vacation/fl
    if(!credit.wop){
      newEmployeeCard.doc.vlBalance = Number((newEmployeeCard.doc.vlBalance + credit.vlslMonet).toFixed(3))
    
      if(credit.leavetype == '002') newEmployeeCard.doc.flBalance = Number((newEmployeeCard.doc.flBalance + credit.vlslMonet).toFixed(3))
    }
  } else if(credit.leavetype == '003'){ //sick leave
    if(!credit.wop) newEmployeeCard.doc.slBalance = Number((newEmployeeCard.doc.slBalance + credit.sl_deduction).toFixed(3))
  } else if(credit.leavetype == '006'){ //
    if(!credit.wop) newEmployeeCard.doc.splBalance = Number((newEmployeeCard.doc.splBalance + credit.leaveTotalDays).toFixed(3))
  }

  newEmployeeCard.doc.card.splice(index, 1)
  return newEmployeeCard
}

  // Function to check if the dateFilter is within the range defined by fromDate and toDate.
function isDateWithinRange(dateFilter: string, fromDate: string, toDate: string): boolean {
    const dateFilterObj = new Date(dateFilter);
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);

    return dateFilterObj >= fromDateObj && dateFilterObj <= toDateObj;
}