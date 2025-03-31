import { BakcEndService } from '@/bakc-end.service';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-division',
  templateUrl: './division.component.html',
  styleUrls: ['./division.component.scss']
})
export class DivisionComponent implements OnInit {

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
    this.service.division().subscribe((data: any) => {
      this.leave = data.rows;
      this.getDivisions();
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
      // branchLocation: new FormControl('', [Validators.required]),
      divisionName: new FormControl('', [Validators.required]),
  });

  this.editForm = new FormGroup({
    // branchLocation: new FormControl('', [Validators.required]),
    divisionName: new FormControl('', [Validators.required]),
});

  }

  getDivisions(){
    this.leave = [];
    this.loading = true;
    this.service.division().subscribe((data: any) => {
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

deleteDivision(id: any, rev: any, name: any) {
  console.log(id, rev)
      Swal.fire({
        icon: 'info',
        title: `Do you want to delete the division "${name}"?`,
        showCancelButton: true,
        confirmButtonText: 'Delete',
      }).then((result) => {
        if (result.isConfirmed) {
          this.service.deleteDivision(id, rev).subscribe((data) => {
            console.log(data);
          })
          Swal.fire('Deleted!', '', 'success').then((result) => {
            this.loading = true;
            this.getDivisions();
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
  // this.editForm.controls['branchLocation'].setValue(data.branchLocation);
  this.editForm.controls['divisionName'].setValue(data.divisionName);
  this.id = data._id;
  this.rev = data._rev;
}

editDivision() {
  // const branchLocation = this.editForm.value.branchLocation;
  const divisionName = this.editForm.value.divisionName;
  const updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
  
  // Preserve the original createdAt value, if available
  const originalCreatedAt = this.leave.find((div: any) => div.doc._id === this.id)?.doc.createdAt;
  const postObject = {
      _id: this.id,
      _rev: this.rev,
      // branchLocation: branchLocation,
      divisionName: divisionName,
      createdAt: originalCreatedAt,
      updatedAt: updatedAt
  };
  this.service.editDivision(postObject, this.id).subscribe((data) => {
      console.log('Warning', data);
      Swal.fire(
          'Success!',
          ' Successfully Updated!',
          'success'
      ).then((result) => {
        this.loading = true;
        this.getDivisions();
        // this.router
          //     .navigateByUrl('/', {skipLocationChange: true})
          //     .then(() => {
          //         this.router.navigate(['Positions']);
          //     });
      });
  });
}

saveLeave() {
  // const branchLocation = this.createForm.value.branchLocation;
  const divisionName = this.createForm.value.divisionName;
  
  // Add timestamps for createdAt and updatedAt
  const createdAt = new Date().toISOString();  // Set current timestamp
  const updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
  const postObject = {
      // branchLocation: branchLocation,
      divisionName: divisionName,
      createdAt: createdAt,
      updatedAt: updatedAt
  };
  this.service.createDivision(postObject).subscribe((data) => {
      console.log('Warning', data);
      Swal.fire(
          'Success!',
          ' New Division has been Created!',
          'success'
      ).then((result) => {
        this.createForm.reset();
        this.loading = true;
        this.getDivisions();
          // this.router
          //     .navigateByUrl('/', {skipLocationChange: true})
          //     .then(() => {
          //         this.router.navigate(['Positions']);
          //     });
      });
  });
}

}
