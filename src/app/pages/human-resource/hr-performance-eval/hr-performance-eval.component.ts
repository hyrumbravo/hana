import { Component, OnInit } from '@angular/core';
import { BakcEndService } from '@/bakc-end.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService } from '@services/profile/profile.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-hr-performance-eval',
  templateUrl: './hr-performance-eval.component.html',
  styleUrls: ['./hr-performance-eval.component.scss']
})

export class HrPerformanceEvalComponent implements OnInit {
  isSubmitting = false; // Flag to track submission status
  loading = false;
  employee: any;
  posts: any = [];
  dtOptions: any;
  createForm: FormGroup;
  editForm: FormGroup;
  id: any;
  rev: any;
  leave: any;
  positionForm: any;
  app: any = [];
  viewForm: FormGroup;
  emp: any;
  rate: any = [];
  positions = []
  currentUser:any = null;
  currentGroup:any = null;

  constructor(private service: BakcEndService, private router: Router, private modalService: NgbModal, private profileService: ProfileService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loading = true;
    this.getPositions()
    this.getCurrentUser()
  this.service.employee().subscribe((data: any) => {
    // this.employee = data.rows;
    let list = data?.rows.filter(item => !(item.doc._id.includes('_design')));
    if(this.currentUser?.department != null){
      this.employee = list.filter(item => (item.doc.serviceInformation?.department?.includes(this.currentUser?.department)));
    } else {
      this.employee = list
    }
    this.emp = this.employee;
    this.loading = false; //endpoint
});

  this.service.rating().subscribe((data: any) => {
    this.rate = data.rows;
});

this.createForm = new FormGroup({
  name: new FormControl(null, [Validators.required]),
  id_no: new FormControl(null, [Validators.required]),
  positionTitle: new FormControl(null),
  assessment: new FormControl(null, [Validators.required]),
  date_cover: new FormControl(null, [Validators.required]),
  absent: new FormControl(null, [Validators.required]),
  evaluator: new FormControl(null, [Validators.required]),
  date_from: new FormControl(null, [Validators.required]),
  date_to: new FormControl(null, [Validators.required]),
  comment: new FormControl(null, [Validators.required]),
});

  this.editForm = new FormGroup({
    name: new FormControl(null, [Validators.required]),
    id_no: new FormControl(null, [Validators.required]),
    positionTitle: new FormControl(null),
    assessment: new FormControl(null, [Validators.required]),
    date_cover: new FormControl(null, [Validators.required]),
    absent: new FormControl(null, [Validators.required]),
    evaluator: new FormControl(null, [Validators.required]),
    date_from: new FormControl(null, [Validators.required]),
    date_to: new FormControl(null, [Validators.required]),
    comment: new FormControl(null, [Validators.required]),
  });
  }

  getCurrentUser(){
    this.service.getSystemUser().subscribe(
      (response: any) => {
        this.currentUser = response?.rows[0].doc
        if(this.currentUser){
          this.service.getUserGroupbyId(this.currentUser.setting_id).subscribe(
            (response: any) => {
              this.currentGroup = response?.rows[0].doc
            })
        }
      })

  }

  /**
   * Get Positions
   */
  getPositions() {
    this.app = []
    this.posts = []
    this.profileService.getPositions().subscribe(
      (response: any) => {
        this.positions = response?.rows
        this.service.performance().subscribe((data: any) => {
          this.app = data.rows;
          this.posts =  data.rows;
          this.posts.forEach(data => {
            data.doc.position_title = this.getPositionName(data.doc.positionTitle)
          });
          this.posts.sort((a, b) => {
            const dateA = new Date(a.doc.createdAt).getTime();
            const dateB = new Date(b.doc.createdAt).getTime();
            return dateB - dateA;  // Sort in descending order
          });
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
          this.loading = false
      });
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Position Name
   */
  getPositionName(id) {
    for (let index = 0; index < this.positions?.length; index++) {
      if (this.positions[index].doc.position_name == id) {
        return this.positions[index].doc.position_name
      }
    }
  }


  /**
   * Dismiss all modals
   */
  dismiss() {
    this.modalService.dismissAll()
  }

  /**
   * Open Modal
   * @param content
   */
  open(content, index?) {
    this.modalService.open(content, { backdrop: false, centered: true, size: 'lg' })
  }

  addEvaluation() {

    if (this.createForm.valid) {
      this.isSubmitting = true;  // Disable the button
      const id_no = this.createForm.value.id_no;
      const name = this.createForm.value.name;
      const assessment = this.createForm.value.assessment;
      const date_cover = this.createForm.value.date_cover;
      const absent = this.createForm.value.absent;
      const evaluator = this.createForm.value.evaluator;
      const comment = this.createForm.value.comment;
      const date_from = this.createForm.value.date_from;
      const date_to = this.createForm.value.date_to;
      const positionTitle = this.createForm.value.positionTitle;
      // Add timestamps for createdAt and updatedAt
      const createdAt = new Date().toISOString();  // Set current timestamp
      const updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
      const postObject = {
          id_no: id_no,
          name: name,
          assessment: assessment,
          date_cover: date_cover,
          absent: absent,
          evaluator: evaluator,
          comment: comment,
          date_from: date_from,
          date_to: date_to,
          positionTitle: positionTitle,
          createdAt: createdAt,
          updatedAt: updatedAt
      };
      this.service.createEvaluation(postObject).subscribe((data) => {
          console.log('Warning', data);
          Swal.fire(
              'Success!',
              ' New File has been Created!',
              'success'
          ).then((result) => {
              this.loading = true;
              this.getPositions()
              this.dismiss()
              this.createForm.reset();
              this.isSubmitting = false;  // Enable the button after completion
          });
      },
        (error) => {
          this.isSubmitting = false;  // Enable the button after an error
          this.createForm.markAllAsTouched();
        });
    } else {
      this.createForm.markAllAsTouched()
    }
}

editEval() {
  const id_no = this.editForm.value.id_no;
  const name = this.editForm.value.name;
  const assessment = this.editForm.value.assessment;
  const rating_new = this.editForm.value.rating_new;
  const remarks_new = this.editForm.value.remarks_new;
  const rating_old = this.editForm.value.rating_old;
  const remarks_old = this.editForm.value.remarks_old;
  const date_cover = this.editForm.value.date_cover;
  const absent = this.editForm.value.absent;
  const evaluator = this.editForm.value.evaluator;
  const comment = this.editForm.value.comment;
  const date_from = this.editForm.value.date_from;
  const date_to = this.editForm.value.date_to;
  const positionTitle = this.editForm.value.positionTitle;
  const updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
  
  // Preserve the original createdAt value, if available
  const originalCreatedAt = this.posts.find((post: any) => post.doc._id === this.id)?.doc.createdAt;
  const postObject1 = {
      _id: this.id,
      _rev: this.rev,
      id_no: id_no,
      name: name,
      assessment: assessment,
      rating_new: rating_new,
      remarks_new: remarks_new,
      rating_old: rating_old,
      remarks_old: remarks_old,
      date_cover: date_cover,
      absent: absent,
      evaluator: evaluator,
      comment: comment,
      date_from: date_from,
      date_to: date_to,
      positionTitle: positionTitle,
      createdAt: originalCreatedAt,
      updatedAt: updatedAt
  };
  this.service.editPerf(postObject1, this.id).subscribe((data) => {
      console.log('Warning', data);
      Swal.fire(
          'Success!',
          ' Successfully Updated!',
          'success'
      ).then((result) => {
        this.loading = true;
        this.getPositions()
        this.dismiss()
      });
  });
}

edit(data: any, content){
  this.editForm.controls['name'].setValue(data.name);
  this.editForm.controls['id_no'].setValue(data.id_no);
  this.editForm.controls['positionTitle'].setValue(data.positionTitle);
  this.editForm.controls['assessment'].setValue(data.assessment);
  this.editForm.controls['date_cover'].setValue(data.date_cover);
  this.editForm.controls['absent'].setValue(data.absent);
  this.editForm.controls['evaluator'].setValue(data.evaluator);
  this.editForm.controls['comment'].setValue(data.comment);
  this.editForm.controls['date_from'].setValue(data.date_from);
  this.editForm.controls['date_to'].setValue(data.date_to);
  this.id = data._id;
  this.rev = data._rev;
  this.open(content)
}

deleteApp(id: any, rev: any) {
  console.log(id, rev)
      Swal.fire({
        icon: 'info',
        title: 'Do you want to delete this File?',
        showCancelButton: true,
        confirmButtonText: 'Delete',
      }).then((result) => {
        if (result.isConfirmed) {
          this.service.deleteEval(id, rev).subscribe((data) => {
            console.log(data);
          })
          Swal.fire('Deleted!', '', 'success').then((result) => {
            this.loading = true;
            this.getPositions()
            this.dismiss()
        });

        }
  });
}

  getId(){
    var emp_name = this.employee.filter((x: any)=>
    x.doc.id_no == this.createForm.value.id_no
    )
    this.createForm.controls['name'].setValue(emp_name[0].doc.firstName + ' ' + emp_name[0].doc.middleName + ' ' + emp_name[0].doc.lastName)
    this.createForm.controls['positionTitle'].setValue(emp_name[0].doc.serviceInformation.position)
  }

  getIdOf(){
    var emp = this.employee.filter(
    (x: any)=>
    x.doc.id_no == this.editForm.value.id_no
    )
    this.editForm.controls['name'].setValue(emp[0].doc.firstName + ' ' + emp[0].doc.middleName + ' ' + emp[0].doc.lastName)
    this.editForm.controls['positionTitle'].setValue(emp[0].doc.serviceInformation.position)
  }

  refresh() {
    this.loading = true;
    this.getPositions()
    this.dismiss()
  }

}
