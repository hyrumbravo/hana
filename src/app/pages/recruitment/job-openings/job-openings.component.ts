import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService } from '@services/profile/profile.service';
import { RecruitmentService } from '@services/recruitment/recruitment.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-job-openings',
  templateUrl: './job-openings.component.html',
  styleUrls: ['./job-openings.component.scss']
})
export class JobOpeningsComponent implements OnInit {

  jobOpenings = []
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
      branch: [null, Validators.required],
      position: [null, Validators.required],
      employmentType: [null, Validators.required],
      requiredForThisPosition: [null, Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      description: [null],
      openForApplication: [null],
    })
  }

  ngOnInit(): void {
    this.getPositions()
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
   * Get Positions
   */
  getPositions() {
    this.profileService.getPositions().subscribe(
      (response: any) => {
        this.positions = response?.rows
        this.getJobOpenings()
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Classification Name
   */
  getClassificationName(id) {
    for (let index = 0; index < this.jobOpenings?.length; index++) {
      if (this.jobOpenings[index].doc._id == id) {
        return this.jobOpenings[index].doc.criteria
      }
    }
  }

  get f() {
    return this.form
  }

  /**
   * Get Job Openings
   */
  getJobOpenings() {
    this.recruitmentService.getJobOpenings().subscribe(
      (response: any) => {
        this.jobOpenings = response?.rows
        this.jobOpenings.forEach(data => {
          data.doc.positionName = this.getPositionName(data.doc.position)
        })
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Edit Job Opening
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
   * Delete Job Opening
   * @param index
   */
  deleteJobOpening(data) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.recruitmentService.deleteJobOpening(data).subscribe(
          (response: any) => {
            Swal.fire('Deleted!', '', 'success')
            this.getJobOpenings()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    });
  }

  /**
   * Submit Job Opening
   */
  submitJobOpening() {
    if (this.f.valid) {
      if (this.f.get('_id')?.value) {
        this.recruitmentService.updateJobOpening(this.f.value).subscribe(
          (response: any) => {
            this.toastr.success('Job Opening updated successfully.')
            this.f.removeControl('_id')
            this.f.removeControl('_rev')
            this.f.reset()
            this.dismiss()
            this.getJobOpenings()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      } else {
        this.recruitmentService.createJobOpening(this.f.value).subscribe(
          (response: any) => {
            this.toastr.success('Job Opening created successfully.')
            this.f.reset()
            this.dismiss()
            this.getJobOpenings()
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
