import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService } from '@services/profile/profile.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-hr-appointments',
  templateUrl: './hr-appointments.component.html',
  styleUrls: ['./hr-appointments.component.scss']
})
export class HrAppointmentsComponent implements OnInit {

  loading = false;
  employees: any = []
  positions: any = []
  branches: any = []
  divisions: any = []
  salaryGrades: any = []
  appointments: any = []
  dtOptions: any
  form: FormGroup

  constructor(
    private profileService: ProfileService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private router: Router
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
      // _id: ['', Validators.required],
      // _rev: [''],
      id_no: [null, Validators.required],
      dateOfOriginalAppointment: [null, Validators.required],
      natureOfAppointment: [null, Validators.required],
      plantillaPage: [null, Validators.required],
      employeeStatus: [null, Validators.required],
      branch: [null, Validators.required],
      department: [null, Validators.required],
      division: [null],
      monthlyRate: [null, Validators.required],
      annualSalary: [null, Validators.required],
      replacementStatus: [null, Validators.required],
      dateOfLastPromotion: [null],
      datePosted: [null],
      itemNumber: [null],
      positionTitle: [null],
      salaryGrade: [null],
      agency: [null],
      amountInWords: [null],
      replacementOf: [null],
      dateEffectivity: [null],
    })
  }

  ngOnInit(): void {
    this.loading = true;
    this.getEmployees()
    this.getPositions()
    this.getBranch()
    this.getDivisions(); // Add this
    this.getSalaryGrades();
  }

  get f() {
    return this.form
  }


  /**
   * Get Employees
   */
  getEmployees() {
    this.profileService.getEmployees().subscribe(
      (response: any) => {
        this.employees = response?.rows.filter(item => !(item.id.includes('_design')));
        this.getAppointments()
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Employee Name
   * @param id
   * @returns
   */
  getEmployeeName(id) {
    for (let index = 0; index < this.employees?.length; index++) {
      if (this.employees[index].doc.id_no == id) {
        return this.employees[index].doc.firstName + ' ' + this.employees[index].doc.middleName + ' ' + this.employees[index].doc.lastName + ' ' + this.employees[index].doc.ext
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
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Branches
   */
  getBranch() {
    this.profileService.getBranches().subscribe(
      (response: any) => {
        this.branches = response?.rows
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }
  
  /**
   * Get Divisions
   */
  getDivisions() {
    this.profileService.getDivisions().subscribe(
      (response: any) => {
        this.divisions = response?.rows
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }
  
  /**
   * Get Salary Grades
   */
  getSalaryGrades() {
    this.profileService.getSalaryGrade().subscribe(
      (response: any) => {
        this.salaryGrades = response?.rows
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Set Position Title
   * @returns
   */
  setPositionTitle() {
    for (let index = 0; index < this.positions?.length; index++) {
      if (this.positions[index].doc.position_num == this.f.get('itemNumber').value) {
        this.f.get('positionTitle').patchValue(this.positions[index].doc.position_name)
        return
      }
    }
  }

  setItemNumber() {
    for (let index = 0; index < this.positions?.length; index++) {
      if (this.positions[index].doc.position_name == this.f.get('positionTitle').value) {
        this.f.get('itemNumber').patchValue(this.positions[index].doc.position_num)
        return
      }
    }
  }

  /**
   * Get Appointments
   */
  getAppointments() {
    this.loading = true;
    this.profileService.getAppointments().subscribe(
      (response: any) => {
        this.appointments = response?.rows
        this.appointments.forEach(data => {
          data.doc.employeeName = this.getEmployeeName(data.doc.id_no)
        });

        this.loading = false; //enpoint
      },
      (error) => {
        this.toastr.error(error.error.reason)
        this.loading = false;
      }
    )
  }

  /**
   * Submit Appointment
   */
  submitAppointment() {
    if (this.form.valid) {
      if (this.f.get('_id')?.value) {
        this.profileService.updateAppointment(this.form.value).subscribe(
          (response: any) => {
            this.toastr.success('Appointment updated successfully.')
            this.form.reset()
            this.dismiss()
            this.getAppointments()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      } else {
        this.profileService.createAppointment(this.form.value).subscribe(
          (response: any) => {
            this.toastr.success('Appointment created successfully.')
            this.form.reset()
            this.dismiss()
            this.getAppointments()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    } else {
      this.form.markAllAsTouched()
    }
  }

  editAppointment(data, content) {
    this.form.addControl('_id', new FormControl(null, Validators.required))
    this.form.addControl('_rev', new FormControl(null))
    this.form.patchValue(data)
    this.open(content)
  }

  /**
   * Delete Appointment
   * @param index
   */
  deleteAppointment(data) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.profileService.deleteAppointment(data).subscribe(
          (response: any) => {
            Swal.fire('Deleted!', '', 'success').then(() => { window.location.reload() })
            this.getAppointments()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    });
  }

  /**
   * Open Modal
   * @param content
   */
  open(content) {
    this.modalService.open(content, { backdrop: false, centered: true, size: 'lg' })
  }

  /**
   * Dismiss All Modals
   */
  dismiss() {
    this.form.removeControl('_id')
    this.form.removeControl('_rev')
    this.modalService.dismissAll()
  }
}
