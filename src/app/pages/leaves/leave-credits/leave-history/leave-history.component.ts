import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LeaveService } from '@services/leave/leave.service';
import { ProfileService } from '@services/profile/profile.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-leave-history',
  templateUrl: './leave-history.component.html',
  styleUrls: ['./leave-history.component.scss']
})
export class LeaveHistoryComponent implements OnInit {

  leaveCard = []

  dtOptions: any
  form: FormGroup
  leaveForm: FormGroup
  leaves = []
  leaveTypes: any = []
  employees: any = []
  employeeData: any;
  id_no: string = ''
  previousTotalDays = 0;

  constructor(
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    private leaveService: LeaveService,
    private profileService: ProfileService,
  ) {
    this.activatedRoute.params.subscribe(data => {
      this.id_no = data.id
    })
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
      referenceNumber: [null],
      id_no: [null, Validators.required],
      leaveType: [null, Validators.required],
      startDateTime: [null, Validators.required],
      finishDateTime: [null, Validators.required],
      reason: [null, Validators.required],
      location: [null, Validators.required],
      leaveWithoutPay: [null],
      otherReason: [null],
      vacationDescription: [null],
      approver: [null],
      dateOfApproval: [null],
      dateFiled: [null],
      totalDays: [null],
      status: [null],
    })
    this.form.controls.id_no.patchValue(this.id_no)

    this.leaveForm = fb.group({
      id: [null],
      referenceNumber: [null],
      id_no: [null, Validators.required],
      leaveType: [null, Validators.required],
      dateFiled: [null, Validators.required],
      totalDays: [null],
      others: [null], //if selected different leavetype beyond 013 or specified
      commutation:[null],

      startDateTime: [null, Validators.required],
      finishDateTime: [null, Validators.required],
      leaveLocation: [null], //if VL/SPL   "local" / "international"
      leaveLocationDetail: [null], //if VL/SPL specify details
      sickLeaveLocation: [null], //if sick leave "hospital" / "out patient"
      sickLeaveDetail: [null], // specify details
      splBenefitsForWomenDetail:[null], //if spl leave benefits for women specify details
      
      studyLeaveDetail: [null], //if study leave "master degree" / "BAR"
      otherPurpose: [null], //"monetization" / "terminal leave"
      
      approverA: [null, Validators.required], //person who certified the leave credit
      approverAPosition: [null, Validators.required],
      approverB: [null], //recommendation optional
      approverBPosition: [null],
      approverC: [null],
      approverCPosition: [null],
      
      status: [null], //approved or not
      dateOfApproval: [null],
      recommendationDisapprovalReason:[null],
      disapprovalReason:[null],

      //signatures
      applicantSignature: [null],
      approverASignature: [null],
      approverBSignature: [null],
      approverCSignature: [null],
    })

    this.leaveForm.controls.id_no.patchValue(this.id_no)
  }

  ngOnInit(): void {
    this.getLeaveTypes()
    this.getEmployees()
    this.getLeaveCard();
  }

  get f() {
    return this.leaveForm
  }

  /**
   * Get Leave Card of employee
   */
  getLeaveCard(){
    this.leaveService.getLeaveCard().subscribe(
      (response: any) => {
        this.leaveCard = response?.rows.filter(data => {
          return data.doc.id_no == this.id_no
        })

        this.leaveCard.forEach(data => {
          data.doc.card.forEach(el => {
            el.leaveName = this.getLeaveTypeName(el.leaveType)
          });
        })
      
      
        // this.leaves = this.leaveCard[0].doc.card
        // console.log('asdasdsa', this.leaveCard)
        // console.log('asdasdsa', this.leaves)
      }
    )
  }

  /**
   * Get Leave History
   */
  getLeaveHistory() {
    this.leaveService.getLeaveHistory().subscribe(
      (response: any) => {
        this.leaves = response?.rows.filter(data => {
          return data.doc.id_no == this.id_no
        })
        this.leaves.sort((a, b) => -1)
        this.leaves.forEach(data => {
          // data.doc.employeeName = this.getEmployeeName(data.doc.id_no)
          // data.doc.branch = this.getEmployeeBranch(data.doc.id_no)
          data.doc.leaveName = this.getLeaveTypeName(data.doc.leaveType)
        });
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }
  /**
   * Get Leave Type Name
   * @param id
   * @returns
   */
  getLeaveTypeName(id) {
    if(id == null){
      return null
    }

    for (let index = 0; index < this.leaveTypes?.length; index++) {
      if (this.leaveTypes[index].doc.code == id) {
        return this.leaveTypes[index].doc.leave_name
      }
    }
  }

  /**
   * Get Leave Types
   */
  getLeaveTypes() {
    this.leaveService.getLeaveTypes().subscribe(
      (response: any) => {
        this.leaveTypes = response?.rows
        this.getLeaveHistory()
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Employees
   */
  getEmployees() {
    this.profileService.getEmployees().subscribe(
      (response: any) => {
        this.employees = response?.rows

        this.employeeData = this.employees.find(x=>x.doc.id_no == this.id_no)?.doc
        console.log('s', this.employeeData)
        this.getLeaveHistory()
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Diff Days
   * @param startDate
   * @param endDate
   * @returns
   */
  getDiffDays(startDate, endDate) {
    if (startDate && endDate) {
      startDate = startDate.split('T')[0]
      endDate = endDate.split('T')[0]
      startDate = new Date(startDate)
      endDate = new Date(endDate)
      endDate.setDate(endDate.getDate() + 1)
      return Math.ceil(Math.abs(startDate - endDate) / (1000 * 60 * 60 * 24));
    }
  }

  /**
   * Submit Leave History
   */
  submitLeaveHistory() {
    this.f.get('totalDays').patchValue(this.getDiffDays(this.f.get('startDateTime').value, this.f.get('finishDateTime').value))
    if (this.form.valid) {
      if (this.f.get('_id')?.value) {
        this.leaveService.updateLeaveHistory(this.form.value).subscribe(
          (response: any) => {
            this.toastr.success('Leave updated successfully.')
            this.form.removeControl('_id')
            this.form.removeControl('_rev')
            this.form.reset()
            this.getLeaveHistory()
          },
          (error) => {
            this.f.disable()
            this.toastr.error(error.error.reason)
          }
        )
      } else {
        this.f.get('referenceNumber').patchValue(Math.floor(Math.random() * 9999999999) + 1)
        this.leaveService.createLeaveHistory(this.form.value).subscribe(
          (response: any) => {
            this.updateEmployeeLeaveCard(this.form.value)
            this.toastr.success('Leave created successfully.')
            this.form.reset()
            this.getLeaveHistory()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
      this.getEmployees();
    } else {
      this.form.markAllAsTouched()
    }
  }

  /**
   * Updates Employee and remaining balance of leaves
   * @param id 
  */
 updateEmployeeLeaveCard(row){
   let employee = this.employees.find(x=> x.doc.id_no == row.id_no);
   
   if(employee){
     this.profileService.getEmployeesById(employee.id).subscribe( (response: any) => {
      let temp = response.rows[0]
           //only updates leave card info if leave finishDateTime is equal to leave card's dateEarned
           temp.doc.leaveCard.forEach(lc => {
            
            console.log(lc.leaveType, ' ', row.leaveType)
            if(lc.leaveType === row.leaveType){
              if(row.dateEarned == JSON.stringify(row.finishDateTime).split('T')[0].replace('"', '')){
                if (row?._id) { //check if creating or updating
                  if(this.previousTotalDays != row.totalDays){
                    lc.remainingBalance = lc.remainingBalance + this.previousTotalDays
                    this.previousTotalDays = 0; //de
                  }
                }  
                lc.remainingBalance = lc.remainingBalance - row.totalDays
              }
            }
          });
          this.profileService.updateEmployee(temp.doc).subscribe(
            (response: any) => {
              // this.form.patchValue({_rev: response.rev})
            })
          console.log(employee)
    });


    } 
  }

  /**
   * Edit Leave History
   * @param data
   * @param content
   */
  editLeaveHistory(data) {
    // this.f.get('dateFiled').patchValue(this.dateToday.toString().split('T')[0])
    this.previousTotalDays = data.totalDays;
    this.form.addControl('_id', new FormControl(null, Validators.required))
    this.form.addControl('_rev', new FormControl(null))
    this.form.patchValue(data)
  }

  /**
   * Delete Leave
   * @param index
   */
  deleteLeaveHistory(data) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.leaveService.deleteLeaveHistory(data).subscribe(
          (response: any) => {
            //update employee leave card
            let employee = this.employees.find(x=> x.doc.id_no == data.id_no);
            if(employee){
              employee.doc.leaveCard.forEach(lc => {
                if(lc.leaveType == data.leaveType){
                  if(lc.dateEarned == JSON.stringify(data.finishDateTime).split('T')[0].replace('"', '')){
                    lc.remainingBalance = lc.remainingBalance + data.totalDays
                  }
                }
              });

              this.profileService.updateEmployee(employee.doc).subscribe(
                (response: any) => {
                  // this.form.patchValue({_rev: response.rev})
                  this.getEmployees();
                })
              console.log(employee)
            }
            Swal.fire('Deleted!', '', 'success')
            this.getLeaveHistory()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    });
  }

  hideOthers(){
    if(this.leaveForm.get('leaveType').value === 'others'){
      return true
    } else {
      this.leaveForm.get('others').setValue('');
      return false
    }
  }

  hideDetails(type){
    if(type == 'vl'){
      return (this.leaveForm.get('leaveType').value === '001' || this.leaveForm.get('leaveType').value === '006');
    } else if(type == 'sl'){
      return (this.leaveForm.get('leaveType').value === '003');
    } else if(type == 'splw'){ //special benefits for women
      return (this.leaveForm.get('leaveType').value === '011');
    } else if(type == 'std'){ //study leave
      return (this.leaveForm.get('leaveType').value === '008');
    } else if(type == 'others'){ //Other purposes
      return (this.leaveForm.get('leaveType').value === 'others');
    }
  }
}
