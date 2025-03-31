import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';
import { NgbModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxLoadingModule } from 'ngx-loading';
import { SafePipe2 } from './salary-computation/safe.pipe';
import {NgPipesModule} from 'ngx-pipes';
import { PaginationPipe } from './pagination.pipe';

import { SalaryComputationComponent } from './salary-computation/salary-computation.component';
import { EmployeePayslipComponent } from './employee-payslip/employee-payslip.component';
import { OvertimeRequestsComponent } from './overtime-requests/overtime-requests.component';
import { PayrollMasterlistComponent } from './payroll-masterlist/payroll-masterlist.component';

// Angular Material imports
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { CdkTableModule } from '@angular/cdk/table'

@NgModule({
  declarations: [
    SalaryComputationComponent,
    EmployeePayslipComponent,
    OvertimeRequestsComponent,
    PayrollMasterlistComponent,
    SafePipe2,
    PaginationPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DataTablesModule,
    NgbModule,
    NgbDatepickerModule,
    NgPipesModule,
    NgxLoadingModule.forRoot({}),
    // Angular Material imports
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CdkTableModule,
  ],
  exports: [
    SalaryComputationComponent,
    EmployeePayslipComponent,
    OvertimeRequestsComponent,
    PayrollMasterlistComponent,
    PaginationPipe
  ]
})
export class PayrollModule { }