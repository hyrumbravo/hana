import {AppState} from '@/store/state';
import {ToggleControlSidebar, ToggleSidebarMenu} from '@/store/ui/actions';
import {UiState} from '@/store/ui/state';
import {Component, HostBinding, OnInit, ViewChild} from '@angular/core';
import {UntypedFormGroup, UntypedFormControl} from '@angular/forms';
import {Store} from '@ngrx/store';
import {AppService} from '@services/app.service';
import { LeaveService } from '@services/leave/leave.service';
import { ProfileService } from '@services/profile/profile.service';
import {Observable} from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { BakcEndService } from '@/bakc-end.service';
import { DatePipe } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ObjService } from '@services/obj-pass/obj.service';

const BASE_CLASSES = 'main-header navbar navbar-expand';
@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
    @ViewChild('notif') notif: any;
    @HostBinding('class') classes: string = BASE_CLASSES;
    public ui: Observable<UiState>;
    public searchForm: UntypedFormGroup;
    currentUser:any = null;
    filteredLeaves: any[];
    leaves: any = [];
    leavesToday: any = [];
    pendingLeaves: any = [];
    processingLeaves: any = [];
    employees: any;
    leaveTypes: any;
    currentGroup: any;
    hasDepartmentFilter: boolean;
    dateToday = new Date();
    leaveCardData: any;
    branches: any;
    departments: any;
    approvers: any;
    withNotif: boolean = false;

    constructor(
        private backendService: BakcEndService,
        private leaveService: LeaveService,
        private profileService: ProfileService,
        private toastr: ToastrService,
        private datePipe: DatePipe,
        private modalService: NgbModal,
        private appService: AppService,
        private router: Router,
        private store: Store<AppState>,
        private objSevice: ObjService
    ) {

    }

    ngOnInit() {
        this.ui = this.store.select('ui');
        this.ui.subscribe((state: UiState) => {
            this.classes = `${BASE_CLASSES} ${state.navbarVariant}`;
        });
        this.searchForm = new UntypedFormGroup({
            search: new UntypedFormControl(null)
        });

        this.getCurrentUser();
        this.getLeaveCard();
        this.getBranchAndDepartment();
        this.getLeaveTypes()
        this.getLeaveApprovers()
        this.getEmployees()
        this.datePipe.transform(this.dateToday,"yyyy-MM-dd")
        this.hasDepartmentFilter = (this.currentUser?.department != null)

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

    getCurrentUser(){
        this.backendService.getSystemUser().subscribe(
          (response: any) => {
            this.currentUser = response?.rows[0].doc
            // console.log(this.currentUser);
            if(this.currentUser){
                this.backendService.getUserGroupbyId(this.currentUser.setting_id).subscribe(
                (response: any) => {
                  this.currentGroup = response?.rows[0].doc
                })
            
                this.getLeaveApprovals()
            }
          })
    
    }

    getEmployees() {
        this.profileService.getEmployees().subscribe(
          (response: any) => {
            let list = response?.rows.filter(item => !(item.doc._id.includes('_design')));
            if(this.currentUser?.department != null){
              this.employees = list.filter(item => (item.doc.serviceInformation?.department?.includes(this.currentUser?.department)));
            } else {
              this.employees = list
            }
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
    }

    /**
     * Get Leave Approvals
     */
    getLeaveApprovals() {
        this.filteredLeaves = [];
        this.leaveService.getLeaveApprovals().subscribe(
        (response: any) => {
            let list = response?.rows.filter(item => !(item.doc._id.includes('_design')));
            if(this.currentUser?.department != null){
                this.leaves = list.filter(item => (item.doc.department.includes(this.currentUser?.department)));
            } 
            else if(this.currentUser.designation == 'City Mayor'){
                this.leaves = list
            }
            else {
                this.leaves = []
            }
            this.leaves.sort((a, b) => -1)
            this.leaves.forEach(data => {
            // const emp = this.employees.find(x=> x.doc.id_no == data.doc.id_no);
            // if(emp && !(data.doc.status == "approved" || data.doc.status == "denied")){
            //     if(data.doc.position_title == 'Division Chief' || (data.doc.position_title != 'Division Chief' && data.doc.approverCSignature == null)){
            //         data.doc.branch = this.getEmployeeBranch(data.doc.id_no)
            //         data.doc.leaveName = this.getLeaveTypeName(data.doc.leaveType)
            //         data.status = data.doc.status
            //         data.referenceNumber = data.doc.referenceNumber
            //         this.filteredLeaves.push(data)
            //     }
            // }
            
            if(this.currentUser && !(data.doc.status == "approved" || data.doc.status == "denied")){
                data.doc.branch = this.getEmployeeBranch(data.doc.id_no)
                data.doc.leaveName = this.getLeaveTypeName(data.doc.leaveType)
                data.status = data.doc.status
                data.referenceNumber = data.doc.referenceNumber
                console.log(data.doc);
                console.log(this.currentUser.designation);
                if(this.currentUser.designation == 'Division Chief'){
                    if(data.doc.position_title != 'Division Chief' && data.doc.position_title != 'Department Head' && data.doc.approverBSignature == null){
                        console.log('Designation: Division Chief');
                        this.filteredLeaves.push(data)
                    }
                }
                else if(this.currentUser.designation == 'Department Head'){
                    console.log('Designation: Department Head');
                    if(data.doc.position_title == 'Division Chief' && data.doc.approverCSignature == null){
                        console.log('Designation: Department Head 1');
                        this.filteredLeaves.push(data)
                    }
                    else if(data.doc.position_title != 'Division Chief' && data.doc.approverBSignature != null && data.doc.approverCSignature == null){
                        console.log('Designation: Department Head 2');
                        this.filteredLeaves.push(data)
                    }
                }
                else if(this.currentUser.designation == 'City Mayor'){
                    if(data.doc.position_title == 'Department Head' && data.doc.approverCSignature == null){
                        console.log('Designation: City Mayor');
                        this.filteredLeaves.push(data)
                    }
                }
            }
            });
            console.log(this.filteredLeaves)
            this.leaves = this.filteredLeaves
            this.leavesToday = this.filteredLeaves.filter((l) => this.datePipe.transform(l.doc.dateFiled, 'yyyy-MM-dd') == this.datePipe.transform(new Date(), 'yyyy-MM-dd'))
            this.processingLeaves = this.filteredLeaves.filter((l) => l.doc.status == 'processing')
            this.pendingLeaves = this.filteredLeaves.filter((l) => l.doc.status == 'pending')
            if(this.currentUser.designation == 'Division Chief' || this.currentUser.designation == 'Department Head' || this.currentUser.designation == 'City Mayor'){
                this.withNotif = true
                if((this.leaves.length) && this.router.url != '/LeaveApplication' && localStorage.getItem('isVisited') != 'true'){
                    console.log(this.router.url);
                    this.open(this.notif) 
                }
            }
            else{
                this.withNotif = false
            }
            // this.filterLeaveApprovals()
        },
        (error) => {
            this.toastr.error(error.error.reason)
        }
        )
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

    getLeaveTypeName(id) {
        for (let index = 0; index < this.leaveTypes?.length; index++) {
        if (this.leaveTypes[index].doc.code == id) {
            return this.leaveTypes[index].doc.leave_name
        }
        }
        return null;
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
   * Get Leave Cards
   */
    getLeaveCard(){
        this.leaveService.getLeaveCard().subscribe((response:any)=>{
        this.leaveCardData = response?.rows
        this.leaveCardData.forEach(data => {
            data.doc.card.forEach(el => {
            el.leaveName = this.getLeaveTypeName(el.leaveType)
            });
        })
        
        })
    }

    logout() {
        this.appService.logout();
    }

    onToggleMenuSidebar() {
        this.store.dispatch(new ToggleSidebarMenu());
    }

    onToggleControlSidebar() {
        this.store.dispatch(new ToggleControlSidebar());
    }

    dismiss() {
        this.modalService.dismissAll()
    }

    open(content) {
        const modalRef = this.modalService.open(content, { backdrop: false, centered: true, size: 'xl' })

        modalRef.result.then(
            (result) => {
              console.log('Modal closed with result:', result);
              localStorage.setItem('isVisited', 'true')
            },
            (reason) => {
              console.log('Modal dismissed with reason:', reason);
              localStorage.setItem('isVisited', 'true')
            }
        );
    }


    leaveDetails(l){
        if(l.leaveType == '001' || l.leaveType == '006') return `${l.leaveLocation}, ${l.leaveLocationDetail}`
        if(l.leaveType == '003') return `${l.sickLeaveLocation}, ${l.sickLeaveDetail}`
        if(l.leaveType == '011') return `${l.splBenefitsForWomenDetail}`
        if(l.leaveType == '008') return `${l.studyLeaveDetail == 'completion'? "Completion of Master's Degree":"BAR/Board Examination Review"}`
        if(l.leaveType == 'others') return `${l.otherPurpose}, ${l.others}`
    
        return ''
    }

    getEmployeeName(id) {
        for (let index = 0; index < this.employees?.length; index++) {
          if (this.employees[index].doc.id_no == id) {
            return this.employees[index].doc.firstName + ' ' + this.employees[index].doc.middleName + ' ' + this.employees[index].doc.lastName + ' ' + ((this.employees[index].doc.ext)?this.employees[index].doc.ext:'')
          }
        }
    }

    goTo(q){
        var obj = {}
        switch (q) {
            case "new":
                obj = {}
                break;
          
            case "processing":
                obj = {
                    status: 'Processing',
                    date: null
                }
                break;
          
            case "pending":
                obj = {
                    status: 'Pending',
                    date: null
                }
                break;
          
            case "all":
                obj = {
                    status: 'All',
                    date: null
                }
                break;
          
            default:
                obj = {}
                console.log("None of the specified conditions are met.");
        }
        this.objSevice.sharedData = obj
        this.router.navigate(['/LeaveApproval']);
    }

}

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
