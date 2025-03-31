import { BakcEndService } from '@/bakc-end.service';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.scss']
})
export class DepartmentComponent implements OnInit {

  loading = false;
  leave: any = []
  branches: any = [];
  branches1: any = [];
  createForm: FormGroup;
  editForm: FormGroup;
  id: any;
  rev: any;
  dtOptions: any;
  currentBranch: any;
  
  constructor(
    private service: BakcEndService,
    private router: Router,
    private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loading = true;
    this.service.department().subscribe((data: any) => {
      this.leave = data.rows;
      this.getDepartments();
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
      console.log('Display', this.leave);
      this.loading = false; //fetching data endpoint
    });

    this.createForm = new FormGroup({
      branchLocation: new FormControl(null, [Validators.required]),
      departmentName: new FormControl('', [Validators.required]),
    });

    this.editForm = new FormGroup({
      branchLocation: new FormControl('', [Validators.required]),
      departmentName: new FormControl('', [Validators.required]),
    });
  
    this.service.branch().subscribe((data: any) => {
      this.branches = data.rows;
      console.log('Display', this.branches);
      this.loading = false;
    });
    
    // Find the selected branch after the branches are loaded
    this.service.branch().subscribe((data: any) => {
      this.branches1 = data.rows;
    
      // After loading branches, find the correct branch to set in the form
      if (this.currentBranch) {
        const selectedBranch = this.branches1.find((branch: any) => branch.doc.branchName === this.currentBranch);
        this.editForm.controls['branchLocation'].setValue(selectedBranch?.doc || null);
      }
      this.loading = false;
    });
    
  }

getDepartments(){
  this.leave = [];
  this.loading = true;
  this.service.department().subscribe((data: any) => {
    this.leave = data?.rows;
    this.leave.sort((a, b) => {
      const dateA = new Date(a.doc.createdAt).getTime();
      const dateB = new Date(b.doc.createdAt).getTime();
      return dateB - dateA;  // Sort in descending order
    });
      
    this.loading = false;
  },
  (error) => {
    this.toastr.error(error.error.reason)
  });
}

refresh() {
  window.location.reload();
  // this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
  //     this.router.navigate(['Positions']);
  // });
}

del(doc: any) {
  this.id = doc._id;
  this.rev = doc._rev;
}

deleteDepartment(id: any, rev: any, name: any) {
  console.log(id, rev)
      Swal.fire({
        icon: 'info',
        title: `Do you want to delete the department "${name}"?`,
        showCancelButton: true,
        confirmButtonText: 'Delete',
      }).then((result) => {
        if (result.isConfirmed) {
          this.service.deleteDepartment(id, rev).subscribe((data) => {
            console.log(data);
          })
          Swal.fire('Deleted!', '', 'success').then((result) => {
            this.loading = true;
            this.getDepartments();
            // this.router
            //     .navigateByUrl('/', {skipLocationChange: true})
            //     .then(() => {
            //         this.router.navigate(['Positions']);
            //     });
        });
          
        }
  });
}

open(data: any) {
  // Set the currentBranch to the department's branch
  this.currentBranch = data.branch;
  
   // Find the matching branch object from the branches array
  const selectedBranch = this.branches.find((branch: any) => branch.doc.branchName === this.currentBranch);

  // Set the form values, including the full branch object in branchLocation
  this.editForm.controls['branchLocation'].setValue(selectedBranch?.doc || null);
  this.editForm.controls['departmentName'].setValue(data.departmentName);

  this.id = data._id;
  this.rev = data._rev;
}

editDepartment() {
  const selectedBranch = this.editForm.value.branchLocation;
  const branchLocation = selectedBranch?.branchName || '';  // The selected branch name
  const branchId = selectedBranch?._id || '';              // The selected branch _id
  const departmentName = this.editForm.value.departmentName;
  const updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
  
  // Preserve the original createdAt value, if available
  const originalCreatedAt = this.leave.find((dept: any) => dept.doc._id === this.id)?.doc.createdAt;
  const postObject = {
      _id: this.id,
      _rev: this.rev,
      branch: branchLocation,
      branchId: branchId,
      departmentName: departmentName,
      createdAt: originalCreatedAt,
      updatedAt: updatedAt
  };
  this.service.editDepartment(postObject, this.id).subscribe((data) => {
      console.log('Warning', data);
      Swal.fire(
          'Success!',
          ' Successfully Updated!',
          'success'
      ).then((result) => {
        this.loading = true;
        this.getDepartments();
        // this.router
          //     .navigateByUrl('/', {skipLocationChange: true})
          //     .then(() => {
          //         this.router.navigate(['Positions']);
          //     });
      });
  });
}

saveLeave() {
  const selectedBranch = this.createForm.value.branchLocation;
  const branchLocation = selectedBranch.branchName; // The selected branch name
  const branchId = selectedBranch._id;              // The selected branch _id
  const departmentName = this.createForm.value.departmentName;

  // Add timestamps for createdAt and updatedAt
  const createdAt = new Date().toISOString();  // Set current timestamp
  const updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
  const postObject = {
      branch: branchLocation,
      branchId: branchId,
      departmentName: departmentName,
      createdAt: createdAt,
      updatedAt: updatedAt
  };
  this.service.createDepartment(postObject).subscribe((data) => {
      console.log('Warning', data);
      Swal.fire(
          'Success!',
          ' New Department has been Created!',
          'success'
      ).then((result) => {
        this.createForm.reset();
        this.loading = true;
        this.getDepartments();
          // this.router
          //     .navigateByUrl('/', {skipLocationChange: true})
          //     .then(() => {
          //         this.router.navigate(['Positions']);
          //     });
      });
  });
}

}
