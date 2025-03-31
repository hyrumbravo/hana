import { Component, OnInit } from '@angular/core';
import { BakcEndService } from '@/bakc-end.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService } from '@services/profile/profile.service';
import { ToastrService } from 'ngx-toastr';

var $: any;
@Component({
  selector: 'app-hr-announcements',
  templateUrl: './hr-announcements.component.html',
  styleUrls: ['./hr-announcements.component.scss']
})
export class HrAnnouncementsComponent implements OnInit {
  isSubmitting = false; // Flag to track submission status
  loading = false;
  content: any;
  employee: any;
  posts: any;
  dtOptions: any;
  createForm: FormGroup;
  editForm: FormGroup;
  id: any;
  rev: any;
  leave: any;
  positionForm: any;
  app: any;
  viewForm: FormGroup;
  emp: any;
  rate: any;
  positions = []
  announcements: any = [];
  departments: any = [];
  departments1: any = [];
  currentUser:any = null;
  currentGroup:any = null;
  currentDept: any;

  
  constructor(private service: BakcEndService,
              private fb: FormBuilder, private router: Router,
              private modalService: NgbModal,
              private profileService: ProfileService,
              private toastr: ToastrService) { 


    this.dtOptions = {
      language: {
        search: '',
        searchPlaceholder: 'Search',
        lengthMenu: 'Show _MENU_ entries'
      },
      pageLength: 6,
      ordering: false,
      paging: true,
      dom: 'frtip',
      // buttons: [
      //   {extend: 'print', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      //   {extend: 'copyHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      //   {extend: 'csvHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      //   {extend: 'excelHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      // ]
    }
  }

  ngOnInit(): void {
    // $('#summernote').summernote();
    this.loading = true;
    this.getCurrentUser()
    
    this.getPositions()
    this.getAnnouncements()

  this.service.employee().subscribe((data: any) => {
    // this.employee = data.rows;
    let list = data?.rows.filter(item => !(item.doc._id.includes('_design')));
    if(this.currentUser?.department != null){
      this.employee = list.filter(item => (item.doc.serviceInformation?.department?.includes(this.currentUser?.department)));
      this.loading = false;
    } else {
      this.employee = list
    }

    this.emp = this.employee;

});

  this.createForm = this.fb.group({
    purpose: [null, [Validators.required]],
    date: [null, [Validators.required]],
    place: [null, [Validators.required]],
    department: [null, [Validators.required]],
    description: [null, [Validators.required]],
  })

  this.editForm = this.fb.group({
    _id: [null],
    _rev: [null],
    purpose: [null, [Validators.required]],
    date: [null, [Validators.required]],
    place: [null, [Validators.required]],
    department: ['', [Validators.required]],
    description: [null, [Validators.required]],
  })

  this.service.rating().subscribe((data: any) => {
    this.rate = data.rows;
  });
  
  this.service.department().subscribe((data: any) => {
      this.departments = data.rows;
      console.log('Display', this.departments);
      this.loading = false;
  });
  
  // Find the selected branch after the branches are loaded
  this.service.department().subscribe((data: any) => {
    this.departments1 = data.rows;
  
    // After loading branches, find the correct branch to set in the form
    if (this.currentDept) {
      const selectedDepartment = this.departments1.find((dept: any) => dept.doc.departmentName === this.currentDept);
      this.editForm.controls['department'].setValue(selectedDepartment?.doc || null);
    }
    this.loading = false;
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
    this.profileService.getPositions().subscribe(
      (response: any) => {
        this.positions = response?.rows
        this.service.performance().subscribe((data: any) => {
          this.app = data.rows;
          this.posts = this.app;
          this.posts.forEach(data => {
            data.doc.position_title = this.getPositionName(data.doc.positionTitle)
          });
      });
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Announcements
   */
  getAnnouncements() {
    this.loading = true;
    this.announcements = []
    this.service.announcementsList().subscribe(
      (response: any) => {
        this.announcements = response?.rows
        this.announcements.sort((a, b) => {
          const dateA = new Date(a.doc.createdAt).getTime();
          const dateB = new Date(b.doc.createdAt).getTime();
          return dateB - dateA;  // Sort in descending order
        });
        this.loading = false; //endpoint
      },
      (error) => {
        this.toastr.error(error.error.reason)
        this.loading = false; //endpoint
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
    this.modalService.open(content, { backdrop: false, centered: true, size: 'xl' })
  }

  addAnnouncement() {

    if (this.createForm.valid) {
      this.isSubmitting = true;  // Disable the button
      // Add timestamps for createdAt and updatedAt
      const createdAt = new Date().toISOString();  // Set current timestamp
      const updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
      
      // Add timestamps to the form value
      const announcementData = {
        ...this.createForm.value,
        createdAt: createdAt,
        updatedAt: updatedAt
      };
      
      this.service.addAnnouncement(announcementData).subscribe((data) => {
          console.log('Warning', data);
          Swal.fire(
            'Success!',
            'Announcement has been added.',
            'success'
          ).then((result) => {
            this.loading = true;
            this.createForm.reset()
            this.getAnnouncements()
            this.dismiss()
            this.isSubmitting = false;  // Enable the button after completion
          });
      });
    } else {
      this.createForm.markAllAsTouched()
    }
}

editAnnouncement(content, data) {
  this.editForm.reset()
  // Set the currentBranch to the department's branch
  this.currentDept = data.department;
  // Find the selected department from departments
  const selectedDepartment = this.departments.find(
    (dept: any) => dept.doc.departmentName === this.currentDept
  );
  
  // Patch the form with the data, including the selected department
  this.editForm.patchValue({
    ...data,
    department: selectedDepartment ? selectedDepartment?.doc : null,
  });
  
  console.log(this.editForm)
  this.open(content)
}

updateAnnouncement(id){
  if(this.editForm.valid){
    const selectedDept = this.editForm.value.department;
    const department = selectedDept?.departmentName || '';  // The selected department name
    const updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
    
    // Try to find the announcement by _id
    const foundAnnouncement = this.announcements.find((annc: any) => annc.doc._id === id);
    
    if (!foundAnnouncement) {
      this.toastr.error('Announcement not found.');
      return;
    }
     // Use the original createdAt value from the found announcement
    const originalCreatedAt = foundAnnouncement.doc.createdAt;
    
    // Add timestamps to the form value
    const announcementData = {
      ...this.editForm.value,
      department: department,
      createdAt: originalCreatedAt,
      updatedAt: updatedAt
    };
    
    this.service.editAnnouncement(announcementData, id).subscribe(data => {
      console.log("Warning",data);
      Swal.fire('Success!', 'Announcement been updated', 'success')
      .then((result) => {
        this.loading = true;
        this.editForm.reset()
        this.getAnnouncements()
        this.dismiss()
      })
  
    });
  }
  else{
    this.editForm.markAllAsTouched()
  }
}

deleteAnnouncement(id, rev){
  Swal.fire({
    icon: 'info',
    title: 'Do you want to delete this announcement?',
    showCancelButton: true,
    confirmButtonText: 'Delete',
  }).then((result) => {
    if (result.isConfirmed) {
      this.service.deleteAnnouncement(id, rev).subscribe(
        (response: any) => {
          Swal.fire('Deleted!', '', 'success')
          this.loading = true;
          this.getAnnouncements()
        },
        (error) => {
          this.toastr.error(error.error.reason)
        }
      )
    }
  });
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
  };
  this.service.editPerf(postObject1, this.id).subscribe((data) => {
      console.log('Warning', data);
      Swal.fire(
          'Success!',
          ' Successfully Updated!',
          'success'
      ).then((result) => {
        window.location.reload()
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
            window.location.reload()
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
    this.dismiss()
    this.getAnnouncements()
  }

}
