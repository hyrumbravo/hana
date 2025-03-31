import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HumanResourceService } from '@services/human-resource/human-resource.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-hr-templates',
  templateUrl: './hr-templates.component.html',
  styleUrls: ['./hr-templates.component.scss']
})
export class HrTemplatesComponent implements OnInit {

  loading = false;
  evaluationFactors = []
  dtOptions: any
  evaluationFactorForm: FormGroup
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
    this.evaluationFactorForm = fb.group({
      code: [null, Validators.required],
      description: [null, Validators.required],
      inactive: [null],
    })
  }

  ngOnInit(): void {
    this.loading = true;
    this.getEvaluationFactors()
  }

  get ef() {
    return this.evaluationFactorForm
  }

  /**
   * Get Evaluation Factors
   */
  getEvaluationFactors() {
    this.loading = true;
    this.evaluationFactors = []
    this.humanResourceService.getEvaluationFactors().subscribe(
      (response: any) => {
        this.evaluationFactors = response?.rows
        this.loading = false;
      },
      (error) => {
        this.toastr.error(error.error.reason)
        this.loading = false;
      }
    )
  }

  /**
   * Edit Evaluation Factor
   * @param data
   * @param content
   */
  editEvaluationFactor(data, content) {
    this.ef.addControl('_id', new FormControl(null, Validators.required))
    this.ef.addControl('_rev', new FormControl(null))
    this.ef.patchValue(data)
    this.open(content)
  }

  /**
   * Delete Evaluation Factor
   * @param index
   */
  deleteEvaluationFactor(data) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.humanResourceService.deleteEvaluationFactor(data).subscribe(
          (response: any) => {
            Swal.fire('Deleted!', '', 'success')
            this.loading = true;
            this.getEvaluationFactors()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    });
  }

  /**
   * Submit Evaluation Factor
   */
  submitEvaluationFactor() {
    if (this.ef.valid) {
      this.loading = true;
      if (this.ef.get('_id')?.value) {
        this.humanResourceService.updateEvaluationFactor(this.ef.value).subscribe(
          (response: any) => {
            this.toastr.success('Evaluation factor updated successfully.')
            this.ef.removeControl('_id')
            this.ef.removeControl('_rev')
            this.ef.reset()
            this.dismiss()
            this.getEvaluationFactors()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      } else {
        this.humanResourceService.createEvaluationFactor(this.ef.value).subscribe(
          (response: any) => {
            this.toastr.success('Evaluation factor created successfully.')
            this.ef.reset()
            this.dismiss()
            this.getEvaluationFactors()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    } else {
      this.ef.markAllAsTouched()
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
    this.ef.removeControl('_id')
    this.ef.removeControl('_rev')
    this.modalService.dismissAll()
  }
}
