import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecruitmentRoutingModule } from './recruitment-routing.module';
import { ApplicationsComponent } from './applications/applications.component';
// import { JobOpeningsComponent } from './job-openings/job-openings.component';
import { RequiredDocumentsComponent } from './required-documents/required-documents.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DataTablesModule } from 'angular-datatables';
import { ToastrModule } from 'ngx-toastr';


@NgModule({
  declarations: [
    ApplicationsComponent,
    // JobOpeningsComponent,
    RequiredDocumentsComponent
  ],
  imports: [
    CommonModule,
    RecruitmentRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DataTablesModule,
    NgbModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true
    }),
  ]
})
export class RecruitmentModule { }
