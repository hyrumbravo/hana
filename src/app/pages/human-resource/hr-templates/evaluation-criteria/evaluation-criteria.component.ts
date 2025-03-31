import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HumanResourceService } from '@services/human-resource/human-resource.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-evaluation-criteria',
  templateUrl: './evaluation-criteria.component.html',
  styleUrls: ['./evaluation-criteria.component.scss']
})
export class EvaluationCriteriaComponent implements OnInit {

  evaluationCriterias = []
  loading:Boolean = false
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
      criteria: [null, Validators.required],
      points: [null, Validators.required],
      description: [null, Validators.required],
      inactive: [null],
    })
  }

  ngOnInit(): void {
    this.getEvaluationCriterias()
  }

  get f() {
    return this.form
  }

  /**
   * Get Evaluation Criterias
   */
  getEvaluationCriterias() {
    this.loading = true;
    this.evaluationCriterias = []
    this.humanResourceService.getEvaluationCriterias().subscribe(
      (response: any) => {
        this.evaluationCriterias = response?.rows
        this.loading = false
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Edit Evaluation Criteria
   * @param data
   * @param content
   */
  editEvaluationCriteria(data, content) {
    this.f.addControl('_id', new FormControl(null, Validators.required))
    this.f.addControl('_rev', new FormControl(null))
    this.f.patchValue(data)
    this.open(content)
  }

  /**
   * Delete Evaluation Criteria
   * @param index
   */
  deleteEvaluationCriteria(data) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.humanResourceService.deleteEvaluationCriteria(data).subscribe(
          (response: any) => {
            Swal.fire('Deleted!', '', 'success')
            this.getEvaluationCriterias()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    });
  }

  /**
   * Submit Evaluation Criteria
   */
  submitEvaluationCriteria() {
    if (this.f.valid) {
      if (this.f.get('_id')?.value) {
        this.humanResourceService.updateEvaluationCriteria(this.f.value).subscribe(
          (response: any) => {
            this.toastr.success('Evaluation criteria updated successfully.')
            this.f.removeControl('_id')
            this.f.removeControl('_rev')
            this.f.reset()
            this.dismiss()
            this.getEvaluationCriterias()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      } else {
        this.humanResourceService.createEvaluationCriteria(this.f.value).subscribe(
          (response: any) => {
            this.toastr.success('Evaluation criteria created successfully.')
            this.f.reset()
            this.dismiss()
            this.getEvaluationCriterias()
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
