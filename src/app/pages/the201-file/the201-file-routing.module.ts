import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClinicComponent } from './clinic/clinic.component';
import { EmployeeListComponent } from './employee-list/employee-list.component';
import { EmployeeProfileComponent } from './employee-profile/employee-profile.component';

const routes: Routes = [
  // {
  //   path: '',
  //   redirectTo: 'employee-profile',
  //   pathMatch: 'full'
  // },
  {
    path: 'employee-profile/:id',
    component: EmployeeProfileComponent,
    data: { requiredPermission: 'employeeProfile' }
  },
  {
    path: 'plantilla',
    component: EmployeeListComponent,
    data: { requiredPermission: 'plantilla' }
  },
  {
    path: 'medical',
    component: ClinicComponent,
    data: { requiredPermission: 'medical' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class The201FileRoutingModule { }
