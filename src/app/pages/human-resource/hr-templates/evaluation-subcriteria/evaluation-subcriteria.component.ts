import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HumanResourceService } from '@services/human-resource/human-resource.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-evaluation-subcriteria',
  templateUrl: './evaluation-subcriteria.component.html',
  styleUrls: ['./evaluation-subcriteria.component.scss']
})
export class EvaluationSubcriteriaComponent implements OnInit {

  loading:Boolean = false;
  evaluationCriterias = []
  evaluationSubCriterias = []
  dtOptions: any
  form: FormGroup
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
      subCriteria: [null, Validators.required],
      criteria: [null, Validators.required],
      criteriaPoints: [null, Validators.required],
      points: [null, Validators.required],
      description: [null, Validators.required],
      inactive: [null],
    })
  }

  ngOnInit(): void {
    this.loading = true;
    this.getEvaluationCriterias()
  }


  /**
   * Get Evaluation Criteria Name
   */
  getEvaluationCriteriaName(id) {
    for (let index = 0; index < this.evaluationCriterias?.length; index++) {
      if (this.evaluationCriterias[index].doc._id == id) {
        return this.evaluationCriterias[index].doc.criteria
      }
    }
  }

  /**
   * Get Evaluation Criterias
   */
  getEvaluationCriterias() {
    this.evaluationCriterias = []
    this.humanResourceService.getEvaluationCriterias().subscribe(
      (response: any) => {
        this.evaluationCriterias = response?.rows
        this.getEvaluationSubCriterias()
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  get f() {
    return this.form
  }

  /**
   * Get Evaluation Sub Criterias
   */
  getEvaluationSubCriterias() {
    this.loading = true;
    this.evaluationSubCriterias = []
    this.humanResourceService.getEvaluationSubCriterias().subscribe(
      (response: any) => {
        this.evaluationSubCriterias = response?.rows
        this.evaluationSubCriterias.forEach(data => {
          data.doc.criteriaName = this.getEvaluationCriteriaName(data.doc.criteria)
        })
        this.loading = false;
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Edit Evaluation Sub Criteria
   * @param data
   * @param content
   */
  editEvaluationSubCriteria(data, content) {
    this.f.addControl('_id', new FormControl(null, Validators.required))
    this.f.addControl('_rev', new FormControl(null))
    this.f.patchValue(data)
    this.open(content)
  }

  /**
   * Delete Evaluation Sub Criteria
   * @param index
   */
  deleteEvaluationSubCriteria(data) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.humanResourceService.deleteEvaluationSubCriteria(data).subscribe(
          (response: any) => {
            Swal.fire('Deleted!', '', 'success')
            this.getEvaluationSubCriterias()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    });
  }

  /**
   * Submit Evaluation Sub Criteria
   */
  submitEvaluationSubCriteria() {
    if (this.f.valid) {
      if (this.f.get('_id')?.value) {
        this.humanResourceService.updateEvaluationSubCriteria(this.f.value).subscribe(
          (response: any) => {
            this.toastr.success('Evaluation sub-criteria updated successfully.')
            this.f.removeControl('_id')
            this.f.removeControl('_rev')
            this.f.reset()
            this.dismiss()
            this.getEvaluationSubCriterias()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      } else {
        this.humanResourceService.createEvaluationSubCriteria(this.f.value).subscribe(
          (response: any) => {
            this.toastr.success('Evaluation sub-criteria created successfully.')
            this.f.reset()
            this.dismiss()
            this.getEvaluationSubCriterias()
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
