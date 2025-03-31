import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { The201FileRoutingModule } from './the201-file-routing.module';
import { EmployeeListComponent } from './employee-list/employee-list.component';
import { EmployeeProfileComponent } from './employee-profile/employee-profile.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProfabricComponentsModule } from '@profabric/angular-components';
import { ToastrModule } from 'ngx-toastr';
import { DataTablesModule } from 'angular-datatables';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ClinicComponent } from './clinic/clinic.component';
import { SafePipe2 } from './employee-profile/safe.pipe';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import { NgxLoadingModule } from 'ngx-loading';

@NgModule({
  declarations: [
    EmployeeListComponent,
    EmployeeProfileComponent,
    ClinicComponent,
    SafePipe2
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    The201FileRoutingModule,
    ProfabricComponentsModule,
    DataTablesModule,
    NgbModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true
  }),
  NgxLoadingModule.forRoot({}),
  ]
})
export class The201FileModule { }
