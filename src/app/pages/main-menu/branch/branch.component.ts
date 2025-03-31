import { BakcEndService } from '@/bakc-end.service';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-branch',
  templateUrl: './branch.component.html',
  styleUrls: ['./branch.component.scss']
})
export class BranchComponent implements OnInit {

  loading = false;
  leave: any = []
  createForm: FormGroup;
  editForm: FormGroup;
  id: any;
  rev: any;
  dtOptions: any;

  constructor(private service: BakcEndService, private router: Router, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loading = true;
    this.service.branch().subscribe((data: any) => {
      this.leave = data.rows;
      this.getBranches();
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
      branchLocation: new FormControl('', [Validators.required]),
      branchName: new FormControl('', [Validators.required]),
  });

  this.editForm = new FormGroup({
    branchLocation: new FormControl('', [Validators.required]),
    branchName: new FormControl('', [Validators.required]),
});

  }

getBranches(){
  this.leave = [];
  this.loading = true;
  this.service.branch().subscribe((data: any) => {
    this.leave = data.rows;
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

deleteBranch(id: any, rev: any, name: any) {
  console.log(id, rev)
      Swal.fire({
        icon: 'info',
        title: `Do you want to delete the branch "${name}"?`,
        showCancelButton: true,
        confirmButtonText: 'Delete',
      }).then((result) => {
        if (result.isConfirmed) {
          this.service.deleteBranch(id, rev).subscribe((data) => {
            console.log(data);
          })
          Swal.fire('Deleted!', '', 'success').then((result) => {
            this.loading = true;
            this.getBranches();
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
  this.editForm.controls['branchLocation'].setValue(data.branchLocation);
  this.editForm.controls['branchName'].setValue(data.branchName);
  this.id = data._id;
  this.rev = data._rev;
}

editBranch() {
  const branchLocation = this.editForm.value.branchLocation;
  const branchName = this.editForm.value.branchName;
  const updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
  
  // Preserve the original createdAt value, if available
  const originalCreatedAt = this.leave.find((brch: any) => brch.doc._id === this.id)?.doc.createdAt;
  const postObject = {
      _id: this.id,
      _rev: this.rev,
      branchLocation: branchLocation,
      branchName: branchName,
      createdAt: originalCreatedAt,
      updatedAt: updatedAt
  };
  this.service.editBranch(postObject, this.id).subscribe((data) => {
      console.log('Warning', data);
      Swal.fire(
          'Success!',
          ' Successfully Updated!',
          'success'
      ).then((result) => {
        this.loading = true;
        this.getBranches();
        // this.router
          //     .navigateByUrl('/', {skipLocationChange: true})
          //     .then(() => {
          //         this.router.navigate(['Positions']);
          //     });
      });
  });
}

saveLeave() {
  const branchLocation = this.createForm.value.branchLocation;
  const branchName = this.createForm.value.branchName;
  
  // Add timestamps for createdAt and updatedAt
  const createdAt = new Date().toISOString();  // Set current timestamp
  const updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
  const postObject = {
      branchLocation: branchLocation,
      branchName: branchName,
      createdAt: createdAt,
      updatedAt: updatedAt
  };
  this.service.createBranch(postObject).subscribe((data) => {
      console.log('Warning', data);
      Swal.fire(
          'Success!',
          ' New Branch has been Created!',
          'success'
      ).then((result) => {
        this.createForm.reset();
        this.loading = true;
        this.getBranches();
          // this.router
          //     .navigateByUrl('/', {skipLocationChange: true})
          //     .then(() => {
          //         this.router.navigate(['Positions']);
          //     });
      });
  });
}

}
