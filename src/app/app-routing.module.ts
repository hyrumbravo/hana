import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {MainComponent} from '@modules/main/main.component';
import {BlankComponent} from '@pages/blank/blank.component';
import {LoginComponent} from '@modules/login/login.component';
import {ProfileComponent} from '@pages/profile/profile.component';
import {RegisterComponent} from '@modules/register/register.component';
import {DashboardComponent} from '@pages/dashboard/dashboard.component';
import {AuthGuard} from '@guards/auth.guard';
import {NonAuthGuard} from '@guards/non-auth.guard';
import {ForgotPasswordComponent} from '@modules/forgot-password/forgot-password.component';
import {RecoverPasswordComponent} from '@modules/recover-password/recover-password.component';
import {MainMenuComponent} from '@pages/main-menu/main-menu.component';
import {SubMenuComponent} from '@pages/main-menu/sub-menu/sub-menu.component';
import { HrReportsComponent } from '@pages/human-resource/hr-reports/hr-reports.component';
import { HrAnnouncementsComponent } from '@pages/human-resource/hr-announcements/hr-announcements.component';
import { HrCertificationsComponent } from '@pages/human-resource/hr-certifications/hr-certifications.component';
import { HrTemplatesComponent } from '@pages/human-resource/hr-templates/hr-templates.component';
import { HrPerformanceEvalComponent } from '@pages/human-resource/hr-performance-eval/hr-performance-eval.component';
import { HrActionMoveComponent } from '@pages/human-resource/hr-action-move/hr-action-move.component';
import { HrAppointmentsComponent } from '@pages/human-resource/hr-appointments/hr-appointments.component';
import { LeaveApprovalComponent } from '@pages/leaves/leave-approval/leave-approval.component';
import { LeaveCreditsComponent } from '@pages/leaves/leave-credits/leave-credits.component';
import { LeaveSettingsComponent } from '@pages/leaves/leave-settings/leave-settings.component';
import { UserTLogsComponent } from '@pages/main-menu/user-tlogs/user-tlogs.component';
import { ACLComponent } from '@pages/main-menu/acl/acl.component';
import { PositionComponent } from '@pages/main-menu/position/position.component';
import { LeaveHistoryComponent } from '@pages/leaves/leave-credits/leave-history/leave-history.component';
import { InstitutionComponent } from '@pages/main-menu/institution/institution.component';
import { BranchComponent } from '@pages/main-menu/branch/branch.component';
import { DivisionComponent } from '@pages/main-menu/division/division.component';
import { DepartmentComponent } from '@pages/main-menu/department/department.component';
import { LeaveApplicationComponent } from '@pages/leaves/leave-application/leave-application.component';
import { HrRequestsComponent } from '@pages/human-resource/hr-requests/hr-requests.component';
import { AttendanceComponent } from '@pages/dtr/attendance/attendance.component';
import { TimelogsComponent } from '@pages/dtr/timelogs/timelogs.component';
import { OvertimeComponent } from '@pages/dtr/overtime/overtime.component';
import { CalendarComponent } from '@pages/dtr/calendar/calendar.component';

import { SalaryComputationComponent } from '@pages/payroll/salary-computation/salary-computation.component';
import { EmployeePayslipComponent } from '@pages/payroll/employee-payslip/employee-payslip.component';
import { OvertimeRequestsComponent } from '@pages/payroll/overtime-requests/overtime-requests.component';
import { PayrollMasterlistComponent } from '@pages/payroll/payroll-masterlist/payroll-masterlist.component';
import { ProjectsComponent } from '@pages/progress-billing/projects/projects.component';


const routes: Routes = [
    {
        path: '',
        component: MainComponent,
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        children: [
            {
                path: 'profile',
                component: ProfileComponent,
                data: { requiredPermission: 'profile' }
            },
            {
                path: 'projects',
                component: ProjectsComponent,
                // data: { requiredPermission: 'projects' }
            },
            {
                path: 'blank',
                component: BlankComponent,
            },
            {
                path: 'sub-menu-1',
                component: SubMenuComponent,
                data: { requiredPermission: 'userRoles' }
            },
            // {
            //     path: 'sub-menu-2',
            //     component: BlankComponent
            // },
            {
                path: 'HRRequests',
                component: HrRequestsComponent,
                data: { requiredPermission: 'requests' }
            },
            {
                path: 'HRReports',
                component: HrReportsComponent,
                data: { requiredPermission: 'reports' }
            },
            {
                path: 'HRCertifications',
                component: HrCertificationsComponent,
                data: { requiredPermission: 'certifications' }
            },
            {
                path: 'HRAnnouncements',
                component: HrAnnouncementsComponent,
                data: { requiredPermission: 'announcements' }
            },
            {
                path: 'HRTemplates',
                component: HrTemplatesComponent,
                data: { requiredPermission: 'templates' }
            },
            {
                path: 'HRPerformanceEvaluation',
                component: HrPerformanceEvalComponent,
                data: { requiredPermission: 'evaluations' }
            },
            {
                path: 'HRActionMovements',
                component: HrActionMoveComponent,
                data: { requiredPermission: 'actions' }
            },
            {
                path: 'HRAppointments',
                component: HrAppointmentsComponent,
                data: { requiredPermission: 'appointments' }
            },
            {
                path: '',
                component: DashboardComponent,
                data: { requiredPermission: 'dashboard' }
            },
            {
                path: 'LeaveApplication',
                component: LeaveApplicationComponent,
                data: { requiredPermission: 'leaveApplication' }
            },
            {
                path: 'LeaveApproval',
                component: LeaveApprovalComponent,
                data: { requiredPermission: 'leaveApproval' }
            },
            {
                path: 'LeaveCredits',
                component: LeaveCreditsComponent,
                data: { requiredPermission: 'leaveCredits' }
            },
            {
                path: 'LeaveHistory/:id',
                component: LeaveHistoryComponent,
                data: { requiredPermission: 'leaveCredits' }
            },
            {
                path: 'LeaveSettings',
                component: LeaveSettingsComponent,
                data: { requiredPermission: 'leaveSettings' }
            },
            
            // DTR module route start
            {
                path: 'Attendance',
                component: AttendanceComponent,
                data: { requiredPermission: 'attendance' }
            },
            {
                path: 'Calendar',
                component: CalendarComponent,
                data: { requiredPermission: 'calendar' }
            },
            {
                path: 'Overtime',
                component: OvertimeComponent,
                data: { requiredPermission: 'overtime' }
            },
            {
                path: 'Timelogs',
                component: TimelogsComponent,
                data: { requiredPermission: 'timelogs' }
            },
            // DTR module route end
            
            // PROGRESSBILLING module route start

            
            // PROGRESSBILLING module route end

            // Payroll module route start
            {
                path: 'SalaryComputation',
                component: SalaryComputationComponent,
                data: { requiredPermission: 'salaryComputation' }
            },
            {
                path: 'EmployeePayslip',
                component: EmployeePayslipComponent,
                data: { requiredPermission: 'employeePayslip' }
            },
            {
                path: 'OvertimeRequests',
                component: OvertimeRequestsComponent,
                data: { requiredPermission: 'overtimeRequests' }
            },
            {
                path: 'PayrollMasterlist',
                component: PayrollMasterlistComponent,
                data: { requiredPermission: 'payrollMasterlist' }
            },
            // Payroll module route end
            
            {
                path: 'UserTLogs',
                component: UserTLogsComponent,
                data: { requiredPermission: 'tlogs' }
            },
            {
                path: 'ACL',
                component: ACLComponent,
                data: { requiredPermission: 'acl' }

            },
            {
                path: 'Positions',
                component: PositionComponent,
                data: { requiredPermission: 'positions' }
            },
            {
                path: 'Institution',
                component: InstitutionComponent,
                data: { requiredPermission: 'institutions' }

            },
            {
                path: 'Branch',
                component: BranchComponent,
                data: { requiredPermission: 'branches' }

            },
            {
                path: 'Division',
                component: DivisionComponent,
                data: { requiredPermission: 'divisions' }

            },
            {
                path: 'Department',
                component: DepartmentComponent,
                data: { requiredPermission: 'departments' }

            },
            {
              path: 'the201File',
              loadChildren: () => import('./pages/the201-file/the201-file.module').then(m => m.The201FileModule),
              data: { requiredPermission: 'file_201' }
            },
            // {
            //   path: 'recruitment',
            //   loadChildren: () => import('./pages/recruitment/recruitment.module').then(m => m.RecruitmentModule),
            //   data: { requiredPermission: 'recruitment' }
            // },
        ]
    },
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [NonAuthGuard]
    },
    {
        path: 'register',
        component: RegisterComponent,
        canActivate: [NonAuthGuard]
    },
    {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
        canActivate: [NonAuthGuard]
    },
    {
        path: 'recover-password',
        component: RecoverPasswordComponent,
        canActivate: [NonAuthGuard]
    },
    {path: '**', redirectTo: ''}
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {relativeLinkResolution: 'legacy'})],
    exports: [RouterModule]
})
export class AppRoutingModule {}
