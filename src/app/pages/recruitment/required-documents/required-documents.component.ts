import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService } from '@services/profile/profile.service';
import { RecruitmentService } from '@services/recruitment/recruitment.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-required-documents',
  templateUrl: './required-documents.component.html',
  styleUrls: ['./required-documents.component.scss']
})
export class RequiredDocumentsComponent implements OnInit {

  requiredDocuments = []
  positions = []
  dtOptions: any
  form: FormGroup
  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private recruitmentService: RecruitmentService,
    private profileService: ProfileService,
    private modalService: NgbModal
  ) {
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
    this.form = fb.group({
      fileName: [null, Validators.required],
      openForAdmission: [null],
    })
  }

  ngOnInit(): void {
    this.getRequiredDocuments()
  }

  /**
   * Get Classification Name
   */
  getClassificationName(id) {
    for (let index = 0; index < this.requiredDocuments?.length; index++) {
      if (this.requiredDocuments[index].doc._id == id) {
        return this.requiredDocuments[index].doc.criteria
      }
    }
  }

  get f() {
    return this.form
  }

  /**
   * Get Required Documents
   */
  getRequiredDocuments() {
    this.recruitmentService.getRequiredDocuments().subscribe(
      (response: any) => {
        this.requiredDocuments = response?.rows
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Edit Required Documents
   * @param data
   * @param content
   */
  editRequiredDocument(data, content) {
    this.f.addControl('_id', new FormControl(null, Validators.required))
    this.f.addControl('_rev', new FormControl(null))
    this.f.patchValue(data)
    this.open(content)
  }

  /**
   * Delete Required Documents
   * @param index
   */
  deleteRequiredDocument(data) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.recruitmentService.deleteRequiredDocument(data).subscribe(
          (response: any) => {
            Swal.fire('Deleted!', '', 'success')
            this.getRequiredDocuments()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    });
  }

  /**
   * Submit Required Document
   */
  submitRequiredDocument() {
    if (this.f.valid) {
      if (this.f.get('_id')?.value) {
        this.recruitmentService.updateRequiredDocument(this.f.value).subscribe(
          (response: any) => {
            this.toastr.success('Required Documents updated successfully.')
            this.f.removeControl('_id')
            this.f.removeControl('_rev')
            this.f.reset()
            this.dismiss()
            this.getRequiredDocuments()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      } else {
        this.recruitmentService.createRequiredDocument(this.f.value).subscribe(
          (response: any) => {
            this.toastr.success('Required Documents created successfully.')
            this.f.reset()
            this.dismiss()
            this.getRequiredDocuments()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    } else {
      this.f.markAllAsTouched()
    }
  }


  /**
   * Open Modal
   * @param content
   */
  open(content) {
    this.modalService.open(content, { backdrop: false, centered: true, size: 'lg' })
  }

  /**
   * Dismiss all modals
   */
  dismiss() {
    this.f.removeControl('_id')
    this.f.removeControl('_rev')
    this.modalService.dismissAll()
  }
}
