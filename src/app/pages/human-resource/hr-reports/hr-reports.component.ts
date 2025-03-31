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

const jasperHeaders = new HttpHeaders({
  Authorization: 'Basic ' + btoa('jasperadmin:jasperadmin')
});
@Component({
  selector: 'app-hr-reports',
  templateUrl: './hr-reports.component.html',
  styleUrls: ['./hr-reports.component.scss']
})
export class HrReportsComponent implements OnInit {
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
  branches = []
  leaveCards = []
  currentUser:any = null;
  currentGroup:any = null;

  constructor(private service: BakcEndService, private leaveService: LeaveService, private router: Router, private modalService: NgbModal, private profileService: ProfileService, private toastr: ToastrService, private http : HttpClient) { }

  ngOnInit(): void {
    this.getCurrentUser()
    this.getPositions()
    this.getBranches()
    this.getLeaveCard()

    this.service.employee().subscribe((data: any) => {
      // this.employee = data.rows.filter(item => !(item.doc._id.includes('_design')));
      let list = data?.rows.filter(item => !(item.doc._id.includes('_design')));
      if(this.currentUser?.department != null){
        this.employee = list.filter(item => (item.doc.serviceInformation?.department?.includes(this.currentUser?.department)));
      } else {
        this.employee = list
      }
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

    this.certForm = new FormGroup({
      type: new FormControl('', [Validators.required]),
      id: new FormControl(null, [Validators.required]),
      branchId: new FormControl(null, [Validators.required]),
      quarter: new FormControl(null, [Validators.required]),
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
   * Get Position Name
   */
  getPositionName(id) {
    for (let index = 0; index < this.positions?.length; index++) {
      if (this.positions[index].doc.position_name == id) {
        return this.positions[index].doc.position_name
      }
    }
  }

  getBranches() {
    this.profileService.getBranches().subscribe(
      (response: any) => {
        this.branches = response?.rows
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  getLeaveCard(){
    this.leaveService.getLeaveCard().subscribe((response:any)=>{
      this.leaveCards = response.rows
    })
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
  }

  typeChange(){
    if(this.certForm.value.type == 'Waiver_Form' || this.certForm.value.type == 'Employee_Leave_Card'){
      this.certForm.controls['id'].patchValue(null)
      this.certForm.controls['branchId'].patchValue(' ')
      this.certForm.controls['quarter'].patchValue(' ')
    }
    else if(this.certForm.value.type == 'Plantilla_of_Personnel'){
      this.certForm.controls['id'].patchValue(' ')
      this.certForm.controls['branchId'].patchValue(null)
      this.certForm.controls['quarter'].patchValue(null)
    }
    else if(this.certForm.value.type == 'Employee_Profile_List'){
      this.certForm.controls['id'].patchValue(' ')
      this.certForm.controls['branchId'].patchValue(' ')
      this.certForm.controls['quarter'].patchValue(' ')
      this.previewURL = '/jasperserver/rest_v2/reports/reports/' + this.certForm.controls['type'].value + '.html'
    }
  }

  idChange(){
    if(this.certForm.value.type == 'Waiver_Form'){
      this.previewURL = '/jasperserver/rest_v2/reports/reports/' + this.certForm.controls['type'].value + '.html?_id="' + this.certForm.controls['id'].value  + '"'
    }
    if(this.certForm.value.type == 'Employee_Leave_Card'){
      const leaveCardId = this.leaveCards.find(x=>x.doc.employee_id == this.certForm.controls['id'].value)
      const id = leaveCardId.id
      
      // this.previewURL = '/jasperserver/rest_v2/reports/reports/' + this.certForm.controls['type'].value + '.html?_id="' + this.certForm.controls['id'].value  + '"'
      this.previewURL = '/jasperserver/rest_v2/reports/reports/' + this.certForm.controls['type'].value + '.html?_id="' + id  + '"'
    }
    else if(this.certForm.value.type == 'RPFVP_Report'){
      this.certForm.controls['id'].patchValue(' ')
      this.previewURL = '/jasperserver/rest_v2/reports/reports/' + this.certForm.controls['type'].value + '.html'
    }
  }

  valChange(){
    this.previewURL = '/jasperserver/rest_v2/reports/reports/' + this.certForm.controls['type'].value + '.html?branchId="' + this.certForm.controls['branchId'].value + '"&currentQuarter=' + this.certForm.controls['quarter'].value
  }

  private print(){
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
        // On complete, trigger the file download
        const filename = this.certForm.value.type.replace("html", "pdf"); // Set the desired filename here
        
        const blob = new Blob([event.body], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(blob);
        this.pdfIframe.nativeElement.src = blobUrl;

        setTimeout(() => {
          this.pdfIframe.nativeElement.contentWindow.print();
          //revoke the object URL after printing
          window.URL.revokeObjectURL(blobUrl);
        }, 1000); // Adjust the timeout as needed
        
        this.closeDialog();
      }
    }, error => {
      // Handle error (optional)
      this.closeDialog();
      Swal.fire('Error', 'Failed to initiate print preview', 'error');
    });
  }

  download(r?) {
    const titleMessage = (r === 'print')? 'Opening Print Preview...':'Downloading...';
    // Show the Swal dialog with custom progress bar template
    Swal.fire({
      title: titleMessage,
      // html: '<div class="progress-bar-container"><div class="progress-bar"></div></div>',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(null);

        if(r === 'print'){
          this.print();
        } else {
          this.downloadF(r);
        }
      }
    });
  }

  private downloadF(r?) {
    if(!r){
      console.log(r);
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
          // On complete, trigger the file download
          const filename = this.certForm.value.type.replace("html", "pdf"); // Set the desired filename here
          
          const blob = new Blob([event.body], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          this.closeDialog();
          window.URL.revokeObjectURL(link.href);
        }
      }, error => {
        // Handle error (optional)
        this.closeDialog();
        Swal.fire('Error', 'Failed to download the file.', 'error');
      });
    }
    else if(r == 'csv'){
      this.downloadCSV()
    }
    else{
      this.downloadXLS()
    }
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

  downloadCSV(){
    this.http.get(this.previewURL.replace('html', 'csv'), {
      responseType: 'text',
      headers: {
        Authorization: 'Basic ' + btoa('jasperadmin:jasperadmin'),
      },
    }).subscribe((response: any) => {
      const filename = this.certForm.value.type.replace('html', 'csv'); // Set the desired filename here
  
      // Download as CSV
      const link = document.createElement('a');
      link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(response);
      link.download = filename;
      link.click();

      this.closeDialog();
      window.URL.revokeObjectURL(link.href);
    });
  }

  downloadXLS(){
    this.http.get(this.previewURL.replace('html', 'xls'), {
      responseType: 'arraybuffer',
      headers: {
        Authorization: 'Basic ' + btoa('jasperadmin:jasperadmin'),
      },
    }).subscribe((response: any) => {
      const filename = this.certForm.value.type.replace('html', 'xls'); // Set the desired filename here
  
      // Download as Excel
      const blob = new Blob([response], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      this.closeDialog();
      window.URL.revokeObjectURL(link.href);
    });
  }

  showMultiDownload() {
    return this.certForm.controls['type'].value == 'Plantilla_of_Personnel' ||
     this.certForm.controls['type'].value == 'Employee_Profile_List';
  }
  
}

