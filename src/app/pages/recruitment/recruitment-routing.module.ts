import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApplicationsComponent } from './applications/applications.component';
// import { JobOpeningsComponent } from './job-openings/job-openings.component';
import { RequiredDocumentsComponent } from './required-documents/required-documents.component';

const routes: Routes = [
  {
    path: 'applications',
    component: ApplicationsComponent,
    data: { requiredPermission: 'application' }
  },
  // {
  //   path: 'job-openings',
  //   component: JobOpeningsComponent,
  //   data: { requiredPermission: 'jobOpenings' }
  // },
  {
    path: 'required-documents',
    component: RequiredDocumentsComponent,
    data: { requiredPermission: 'requiredDocs' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RecruitmentRoutingModule { }
