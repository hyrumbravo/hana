import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HumanResourceService } from '@services/human-resource/human-resource.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-evaluation-templates',
  templateUrl: './evaluation-templates.component.html',
  styleUrls: ['./evaluation-templates.component.scss']
})
export class EvaluationTemplatesComponent implements OnInit {

  evaluationTemplates = []
  dtOptions: any
  form: FormGroup
  loading:Boolean = false;
  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private humanResourceService: HumanResourceService,
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
      code: [null, Validators.required],
      name: [null, Validators.required],
      classification: [null, Validators.required],
      notes: [null, Validators.required],
      inactive: [null],
    })
  }

  ngOnInit(): void {
    this.getEvaluationTemplates()
  }


  /**
   * Get Classification Name
   */
  getClassificationName(id) {
    for (let index = 0; index < this.evaluationTemplates?.length; index++) {
      if (this.evaluationTemplates[index].doc._id == id) {
        return this.evaluationTemplates[index].doc.criteria
      }
    }
  }

  get f() {
    return this.form
  }

  /**
   * Get Evaluation Templates
   */
  getEvaluationTemplates() {
    this.loading = true
    this.evaluationTemplates = []
    this.humanResourceService.getEvaluationTemplates().subscribe(
      (response: any) => {
        this.evaluationTemplates = response?.rows
        this.loading = false
        // this.evaluationTemplates.forEach(data => {
        //   data.doc.criteriaName = this.getClassificationName(data.doc.criteria)
        // })
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Edit Evaluation Template
   * @param data
   * @param content
   */
  editEvaluationTemplate(data, content) {
    this.f.addControl('_id', new FormControl(null, Validators.required))
    this.f.addControl('_rev', new FormControl(null))
    this.f.patchValue(data)
    this.open(content)
  }

  /**
   * Delete Evaluation Template
   * @param index
   */
  deleteEvaluationTemplate(data) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.humanResourceService.deleteEvaluationTemplate(data).subscribe(
          (response: any) => {
            Swal.fire('Deleted!', '', 'success')
            this.getEvaluationTemplates()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    });
  }

  /**
   * Submit Evaluation Template
   */
  submitEvaluationTemplate() {
    if (this.f.valid) {
      if (this.f.get('_id')?.value) {
        this.humanResourceService.updateEvaluationTemplate(this.f.value).subscribe(
          (response: any) => {
            this.toastr.success('Evaluation Template updated successfully.')
            this.f.removeControl('_id')
            this.f.removeControl('_rev')
            this.f.reset()
            this.dismiss()
            this.getEvaluationTemplates()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      } else {
        this.humanResourceService.createEvaluationTemplate(this.f.value).subscribe(
          (response: any) => {
            this.toastr.success('Evaluation Template created successfully.')
            this.f.reset()
            this.dismiss()
            this.getEvaluationTemplates()
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
