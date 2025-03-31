import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { BakcEndService } from '@/bakc-end.service';
import { LeaveService } from '@services/leave/leave.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService } from '@services/profile/profile.service';
import { ToastrService } from 'ngx-toastr';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';

var header = {
  headers: new HttpHeaders({
    'Authorization':  `Basic ${btoa('jasperadmin:jasperadmin')}`,
    'Access-Control-Allow-Origin': 'http://localhost:4200'
  })
    .set('Authorization',  `Basic ${btoa('jasperadmin:jasperadmin')}`)
}
@Component({
  selector: 'app-hr-certifications',
  templateUrl: './hr-certifications.component.html',
  styleUrls: ['./hr-certifications.component.scss']
})
export class HrCertificationsComponent implements OnInit {
  @ViewChild('pdfIframe') pdfIframe: ElementRef;
  employee: any;
  posts: any;
  dtOptions: any;
  createForm: FormGroup;
  editForm: FormGroup;
  certForm: FormGroup;
  id: any;
  rev: any;
  leave: any;
  positionForm: any;
  app: any;
  viewForm: FormGroup;
  emp: any;
  rate: any;
  previewURL: any
  positions = []
  leaveCards = []
  currentUser:any = null;
  currentGroup:any = null;

  constructor(private service: BakcEndService, private leaveService: LeaveService, private router: Router, private modalService: NgbModal, private profileService: ProfileService, private toastr: ToastrService, private http : HttpClient) { }

  ngOnInit(): void {
    this.getCurrentUser()
    this.getLeaveCard()
    this.getPositions()
    this.getEmployees()

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

    this.certForm = new FormGroup({
      type: new FormControl(null, [Validators.required]),
      id: new FormControl(null, [Validators.required]),
    })
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
      });
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Leave Card
   */
  getLeaveCard(){
    this.leaveService.getLeaveCard().subscribe((response:any)=>{
      this.leaveCards = response.rows
    })
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

  getEmployees(){
    this.service.employee().subscribe((data: any) => {
      // this.employee = data.rows.filter(item => !(item.doc._id.includes('_design')));
      let list = data?.rows.filter(item => !(item.doc._id.includes('_design')));
      if(this.currentUser?.department != null){
        this.employee = list.filter(item => (item.doc.serviceInformation?.department?.includes(this.currentUser?.department)));
      } else {
        this.employee = list
      }

      this.emp = this.employee;

    });
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
    this.modalService.open(content, { backdrop: false, centered: false, size: 'lg'})
  }

  addEvaluation() {

    if (this.createForm.valid) {
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
      };
      this.service.createEvaluation(postObject).subscribe((data) => {
          console.log('Warning', data);
          Swal.fire(
              'Success!',
              ' New File has been Created!',
              'success'
          ).then((result) => {
              window.location.reload()
              this.dismiss()
          });
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
    window.location.reload()
    this.dismiss()
  }

  printCert(){
    this.goToLink()
    console.log(this.certForm.value)
  }

  goToLink(){
    this.http.get(this.previewURL, {
      responseType: 'text',
      headers: {
        'Authorization': 'Basic ' + btoa('jasperadmin:jasperadmin')
      }
    }).subscribe((response: any) => {
      // Handle the response
      let printWindow = window.open('', '_blank');
      printWindow.document.write(response);
      setTimeout(function(){
        printWindow.print();
      },1000)
    });
    // if(this.certForm.value.type == 'COE_Report'){
    //   window.open('http://18.143.192.66:8080/jasperserver/rest_v2/reports/reports/COE_Report.pdf?_id="'+this.certForm.value.id + '"', "_blank");
    // }
    // else if(this.certForm.value.type == 'Certification_Record'){
    //   window.open('http://localhost:8080/jasperserver/rest_v2/reports/reports/' + this.certForm.controls['type'].value + '.pdf?_id="' + this.certForm.controls['id'].value + '"', "_blank");
    // }
    // else if(this.certForm.value.type == 'ServiceRecord_Report'){
    //   window.open('http://localhost:8080/jasperserver/rest_v2/reports/reports/' + this.certForm.controls['type'].value + '.pdf?_id="' + this.certForm.controls['id'].value + '"', "_blank");
    // }
  }

  typeChange(){
    if(this.certForm.value.type == 'Certificate_of_Employment'){
      this.previewURL = '/jasperserver/rest_v2/reports/reports/' + this.certForm.controls['type'].value + '.html?_id="' + this.certForm.controls['id'].value + '"'
    }
    else if(this.certForm.value.type == 'Certification_Record' || 'Certifcation_Medical'){
      this.previewURL = '/jasperserver/rest_v2/reports/reports/' + this.certForm.controls['type'].value + '.html?_id="' + this.certForm.controls['id'].value + '"'
    }
    else if(this.certForm.value.type == 'Service_Record'){
      this.previewURL = '/jasperserver/rest_v2/reports/reports/' + this.certForm.controls['type'].value + '.html?_id="' + this.certForm.controls['id'].value + '"'
    }
  }

  updateData(type){ //update employee profile's leave credit before printing
    const leaveCardId = this.leaveCards.find(x=>x.doc.employee_id == this.certForm.controls['id'].value)
    const selectedEmployee = this.employee.find(x=>x.id == this.certForm.controls['id'].value)
    
    if(selectedEmployee && leaveCardId){
      const currentBalance = leaveCardId.doc.vlBalance

      if(currentBalance != selectedEmployee.doc.leaveBalance){
        selectedEmployee.doc.leaveBalance = currentBalance

        this.profileService.updateEmployee(selectedEmployee.doc).subscribe(
          (response: any) => {
            if(response.ok) this.getEmployees();
          })
      }
     
    }

    if(type == 'print') this.download('print');
    if(type == 'download') this.download('download');

  }

  download(type) {
    const titleMessage = (type === 'print')? 'Opening Print Preview...':'Downloading...';
      // Show the Swal dialog with custom progress bar template
      Swal.fire({
        title: titleMessage,
        // html: '<div class="progress-bar-container"><div class="progress-bar"></div></div>',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(null);
          this.print(type);
        }
      });
  }

  private print(type) {
    this.http.get(this.previewURL.replace("html", "pdf"), {
      responseType: 'blob',
      headers: {
        'Authorization': 'Basic ' + btoa('jasperadmin:jasperadmin')
      },
      reportProgress: true, // Enable progress tracking
      observe: 'events' // Observe the HTTP events to track progress
    }).subscribe((event: any) => {
      if (event.type === HttpEventType.DownloadProgress) {
        // Calculate the progress percentage
        const progress = Math.round(100 * event.loaded / event.total);
        // this.updateProgress(progress);
      } else if (event.type === HttpEventType.Response) {
        if(type === 'print'){
          const blob = new Blob([event.body], { type: 'application/pdf' });
          // Create a blob URL and set it as the iframe source
          const blobUrl = window.URL.createObjectURL(blob);
          this.pdfIframe.nativeElement.src = blobUrl;
  
          setTimeout(() => {
            this.pdfIframe.nativeElement.contentWindow.print();
            //revoke the object URL after printing
            window.URL.revokeObjectURL(blobUrl);
          }, 1000); // Adjust the timeout as needed
        }

        if(type === 'download'){
          // On complete, trigger the file download
          const filename = this.certForm.value.type.replace("html", "pdf"); // Set the desired filename here

          const blob = new Blob([event.body], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(link.href);
        }
        this.closeDialog();
      }
    }, error => {
      // Handle error (optional)
      this.closeDialog();
      Swal.fire('Error', 'Failed to download the file.', 'error');
    });
  }

  private closeDialog() {
    Swal.close();
  }

  // download(){
  //   this.http.get(this.previewURL.replace("html", "pdf"), {
  //     responseType: 'blob',
  //     headers: {
  //       'Authorization': 'Basic ' + btoa('jasperadmin:jasperadmin')
  //     }
  //   }).subscribe((response: any) => {
  //     const filename = this.certForm.value.type.replace("html", "pdf"); // Set the desired filename here

  //     const link = document.createElement('a');
  //     link.href = window.URL.createObjectURL(response);
  //     link.download = filename;
  //     link.click();
  //   });
  // }
}

