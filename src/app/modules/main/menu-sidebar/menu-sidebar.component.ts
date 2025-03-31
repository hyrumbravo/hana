import { BakcEndService } from '@/bakc-end.service';
import {AppState} from '@/store/state';
import {UiState} from '@/store/ui/state';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import {Component, HostBinding, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppService} from '@services/app.service';
import {Observable, Subscription} from 'rxjs';
import {ToastrService} from 'ngx-toastr';
import { ObjService } from '@services/obj-pass/obj.service';

const BASE_CLASSES = 'main-sidebar elevation-4';
@Component({
    selector: 'app-menu-sidebar',
    templateUrl: './menu-sidebar.component.html',
    styleUrls: ['./menu-sidebar.component.scss']
})
export class MenuSidebarComponent implements OnInit {
    @HostBinding('class') classes: string = BASE_CLASSES;
    public ui: Observable<UiState>;
    public user;
    public display_user;
    public menu;
    public group_settings;
    profilePic: any;
    private subscription: Subscription;
    menuLoading = false;

    constructor(
        private service: BakcEndService,
        private http: HttpClient,
        public appService: AppService,
        private store: Store<AppState>,
        private toastr:ToastrService,
        private objService:ObjService,
    ) {
        this.subscription = this.objService.sharedMessage$.subscribe(
            (message) => {
              this.profilePic = message;
            }
        );

    }

    ngOnInit() {
        this.user = this.appService.user;
        this.menu = defaultUser
        this.menuLoading = true;

        this.ui = this.store.select('ui');
        this.ui.subscribe((state: UiState) => {
            this.classes = `${BASE_CLASSES} ${state.sidebarSkin}`;
        });

        this.service.getSystemUser().subscribe((data: any) => { 
            this.display_user = data['rows'][0].doc.email
        });
        
        this.service.group_settings().subscribe((data: any) => {
            this.group_settings = data.rows;
            this.getUserMenu();
        });
        
    }
    getUserMenu(){
        this.service.getSystemUser().subscribe((response: any) => { 
                if(response['rows'].length && this.group_settings){
                    // console.log(this.group_settings)
                    let group = this.group_settings.find(x=> x.doc['_id'] == response['rows'][0].doc?.setting_id)

                    if(group){
                        console.log('USER GROUP: ', group.doc.group_name)
                        if(group.doc.hasOwnProperty('permissions')){
                            let permissions = group.doc.permissions
    
                            
                            const filteredMenu = MENU.filter(item => {
                                // Check if the item's ref_id exists in the permissions object and its value is true
                                // console.log('Permissions for menu item', item.ref_id, permissions[item.ref_id]);// use for checking permission
                                return permissions[item.ref_id] === true;
                            });
        
        
                            const filterChildren = (parent) => {
                                if (parent.children) {
                                parent.children = parent.children.filter(child => {
                                    // Check if the child's ref_id exists in the permissions object and its value is true
                                    return permissions[child.ref_id] === true;
                                });
                            
                                // Recursively filter the children's children
                                parent.children.forEach(filterChildren);
                                }
                            };
        
                            filteredMenu.forEach(filterChildren);
                            this.menu = filteredMenu
                            this.menuLoading = false;
    
                        } else this.toastr.warning("Error fetching group role settings. User has limited access");
                    } else this.toastr.warning("No user group. User has limited access");
                } else {
                    this.appService.logout();
                }
            },
            (error) => {
              console.log(error.error.reason)
              this.toastr.error("Error fetching user and role settings.")
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

}

//automatically if user belongs to non-existenting or do not have a user group.
//only allows dashboard
export const defaultUser =  [
    {
      ref_id: "dashboard",
      name: "Dashboard",
      iconClasses: "fas fa-tachometer-alt",
      path: ["/"]
    }
  ]

  export const MENU = [
    {
        ref_id: "dashboard",
        name: 'Dashboard',
        iconClasses: 'fas fa-tachometer-alt',
        path: ['/']
    },
    {
        ref_id: "file_201",
        name: 'The 201 File',
        iconClasses: 'bi bi-file',
        children: [
            {
                ref_id: "employeeProfile",
                name: 'Employee Profile',
                iconClasses: 'bi bi-person',
                path: ['/the201File/employee-profile/false']
            },
            {
                ref_id: "plantilla",
                name: 'Plantilla',
                iconClasses: 'bi bi-list-columns',
                path: ['/the201File/plantilla']
            },
            {
                ref_id: "serviceRecords",
                name: 'Service Records',
                iconClasses: 'bi bi-card-list',
                path: ['/the201File/employee-profile/serviceRecords'],
            },
            {
                ref_id: "discipline",
                name: 'Discipline Management',
                iconClasses: 'bi bi-card-list',
                path: ['/the201File/employee-profile/disciplineManagement'],
            },
            {
                ref_id: "medical",
                name: 'Medical',
                iconClasses: 'bi bi-hospital',
                path: ['/the201File/medical'],
            },
            {
                ref_id: "appointments",
                name: 'Appointments',
                iconClasses: 'bi bi-calendar-fill',
                path: ['/HRAppointments']
            }
        ]
    },
    {
        ref_id: "humanResource",
        name: 'Human Resource',
        iconClasses: 'bi bi-person-square',
        children: [
            {
                ref_id: "requests",
                name: 'Requests',
                iconClasses: 'bi bi-printer-fill',
                path: ['/HRRequests']
            },
            {
                ref_id: "reports",
                name: 'Reports',
                iconClasses: 'bi bi-printer-fill',
                path: ['/HRReports']
            },
            {
                ref_id: "certifications",
                name: 'Certifications',
                iconClasses: 'bi bi-award-fill',
                path: ['/HRCertifications']
            },
            {
                ref_id: "templates",
                name: 'Templates',
                iconClasses: 'bi bi-diagram-3-fill',
                path: ['/HRTemplates']
            },
            {
                ref_id: "announcements",
                name: 'Announcements',
                iconClasses: 'bi bi-megaphone-fill',
                path: ['/HRAnnouncements']
            },
            {
                ref_id: "evaluations",
                name: 'Performance Evaluation',
                iconClasses: 'bi bi-list-check',
                path: ['/HRPerformanceEvaluation']
            },
            // {
            //     ref_id: "actions",
            //     name: 'Action/Movements',
            //     iconClasses: 'bi bi-activity',
            //     path: ['/HRActionMovements']
            // }
        ]
    },
    {
        ref_id: "leaves",
        name: 'Leaves',
        iconClasses: 'bi bi-box-arrow-left',
        children: [
            {
                ref_id: "leaveApplication",
                name: 'Leave Application',
                iconClasses: 'fas fa-file',
                path: ['/LeaveApplication']
            },
            {
                ref_id: "leaveApproval",
                name: 'Leave Approval',
                iconClasses: 'fas fa-file',
                path: ['/LeaveApproval']
            },
            {
                ref_id: "leaveCredits",
                name: 'Leave Credits',
                iconClasses: 'fas fa-file',
                path: ['/LeaveCredits']
            },
            {
                ref_id: "leaveSettings",
                name: 'Leave Settings',
                iconClasses: 'fas fa-cog',
                path: ['/LeaveSettings']
            }
        ]
    },
        
    // Payroll Module /suriWaahahha/update
    {
        ref_id: "payroll",
        name: 'Payroll',
        iconClasses: 'fas fa-money-check-alt', 
        children: [
            {
                ref_id: "salaryComputation",
                name: 'Payroll Information',
                iconClasses: 'fas fa-calculator',
                path: ['/SalaryComputation']
            },
            {
                ref_id: "employeePayslip",
                name: 'Payroll Employee',
                iconClasses: 'fas fa-receipt',
                path: ['/EmployeePayslip']
            },
            {
                ref_id: "overtimeRequests",
                name: 'Payroll Overtime',
                iconClasses: 'fas fa-user-clock',
                path: ['/OvertimeRequests']
            },
            {
                ref_id: "payrollMasterlist",
                name: 'Payroll Masterlist',
                iconClasses: 'fas fa-users',
                path: ['/PayrollMasterlist']
            }
            // {
            //     ref_id: "leaveRequests",
            //     name: 'Payroll Leave',
            //     iconClasses: 'fas fa-clipboard-user',
            //     path: ['/LeaveRequests']
            // },
        ]
    },
    
    // DTR Module
    {
        ref_id: "dtr",
        name: 'DTR',
        iconClasses: 'fas fa-clock', 
        children: [
            {
                ref_id: "attendance",
                name: 'Attendance',
                iconClasses: 'fas fa-calendar-check',
                path: ['/Attendance']
            },
            {
                ref_id: "calendar",
                name: 'Calendar',
                iconClasses: 'fas fa-calendar-alt',
                path: ['/Calendar']
            },
            {
                ref_id: "overtime",
                name: 'Overtime',
                iconClasses: 'fas fa-business-time',
                path: ['/Overtime']
            },
            {
                ref_id: "timelogs",
                name: 'Timelogs',
                iconClasses: 'fas fa-user-clock',
                path: ['/Timelogs']
            }
      ]
    },
    {
        ref_id: "dtr",
        name: 'Progress Billing',
        iconClasses: 'fas fa-clock', 
        children: [
            {
                ref_id: "projects",
                name: 'Projects',
                iconClasses: 'fas fa-calendar-check',
                path: ['/projects']
            },
            {
                ref_id: "timelogs",
                name: 'Projects',
                iconClasses: 'fas fa-user-clock',
                path: ['/projects']
            }
            
        ]
    },
    
    {
        ref_id: "settings",
        name: 'Settings',
        iconClasses: 'fas fa-cog',
        children: [
            {
                ref_id: "userRoles",
                name: 'User Roles',
                iconClasses: 'fas fa-users',
                path: ['/sub-menu-1']
            },
            {
                ref_id: "tlogs",
                name: 'User T-Logs',
                iconClasses: 'fas fa-regular fa-folder-open',
                path: ['/UserTLogs']
            },
            {
                ref_id: "acl",
                name: 'ACL',
                iconClasses: 'fas fa-solid fa-person-military-pointing',
                path: ['/ACL']
            },
            {
                ref_id: "positions",
                name: 'Positions',
                iconClasses: 'fas fa-solid fa-universal-access',
                path: ['/Positions']
            },
            {
                ref_id: "institutions",
                name: 'Institution',
                iconClasses: 'fas fa-solid fa-building-columns',
                path: ['/Institution']
            },
            {
                ref_id: "branches",
                name: 'Branch',
                iconClasses: 'fas fa-solid fa-code-branch',
                path: ['/Branch']
            },
            {
                ref_id: "divisions",
                name: 'Division',
                iconClasses: 'fas fa-solid fa-mountain-city',
                path: ['/Division']
            },
            {
                ref_id: "departments",
                name: 'Department',
                iconClasses: 'fas fa-solid fa-building-shield',
                path: ['/Department']
            },
        ]
    },
]