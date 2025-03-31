import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HumanResourceService } from '@services/human-resource/human-resource.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employee-ratings',
  templateUrl: './employee-ratings.component.html',
  styleUrls: ['./employee-ratings.component.scss']
})
export class EmployeeRatingsComponent implements OnInit {

  evaluationCriterias = []
  employeeRatings = []
  dtOptions: any
  loading:Boolean = false;
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
      classification: [null, Validators.required],
      min: [null, Validators.required],
      max: [null, Validators.required],
      description: [null, Validators.required],
      remarks: [null, Validators.required],
      inactive: [null],
    })
  }

  ngOnInit(): void {
    this.getEmployeeRatings()
  }


  /**
   * Get Evaluation Criteria Name
   */
  getClassificationName(id) {
    for (let index = 0; index < this.evaluationCriterias?.length; index++) {
      if (this.evaluationCriterias[index].doc._id == id) {
        return this.evaluationCriterias[index].doc.criteria
      }
    }
  }

  get f() {
    return this.form
  }

  /**
   * Get Employee Ratings
   */
  getEmployeeRatings() {
    this.loading = true;
    this.employeeRatings = []
    this.humanResourceService.getEmployeeRatings().subscribe(
      (response: any) => {
        this.employeeRatings = response?.rows
        this.loading = false;
        // this.employeeRatings.forEach(data => {
        //   data.doc.criteriaName = this.getClassificationName(data.doc.criteria)
        // })
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Edit Employee Rating
   * @param data
   * @param content
   */
  editEmployeeRating(data, content) {
    this.f.addControl('_id', new FormControl(null, Validators.required))
    this.f.addControl('_rev', new FormControl(null))
    this.f.patchValue(data)
    this.open(content)
  }

  /**
   * Delete Employee Rating
   * @param index
   */
  deleteEmployeeRating(data) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.humanResourceService.deleteEmployeeRating(data).subscribe(
          (response: any) => {
            Swal.fire('Deleted!', '', 'success')
            this.getEmployeeRatings()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    });
  }

  /**
   * Submit Employee Rating
   */
  submitEmployeeRating() {
    if (this.f.valid) {
      if (this.f.get('_id')?.value) {
        this.humanResourceService.updateEmployeeRating(this.f.value).subscribe(
          (response: any) => {
            this.toastr.success('Employee Rating updated successfully.')
            this.f.removeControl('_id')
            this.f.removeControl('_rev')
            this.f.reset()
            this.dismiss()
            this.getEmployeeRatings()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      } else {
        this.humanResourceService.createEmployeeRating(this.f.value).subscribe(
          (response: any) => {
            this.toastr.success('Employee Rating created successfully.')
            this.f.reset()
            this.dismiss()
            this.getEmployeeRatings()
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
