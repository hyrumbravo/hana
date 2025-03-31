import {Component, OnInit} from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LeaveService } from '@services/leave/leave.service';
import { BakcEndService } from '@/bakc-end.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-leave-settings',
    templateUrl: './leave-settings.component.html',
    styleUrls: ['./leave-settings.component.scss']
})
export class LeaveSettingsComponent implements OnInit {

  loading = false;
  leaveTypes = []
  approvers = []
  users = []
  typeFilters = ['All', 'Certification', 'Recommendation', 'Approval'];
  currentTypeFilter: string = 'All';
  form: FormGroup
  approverForm: FormGroup
  dtOptions: any
  dateToday = new Date()
  isEdit: boolean = false

  constructor(
    private leaveService: LeaveService,
    private backEndService: BakcEndService,
    private toastr: ToastrService,
    private fb: FormBuilder,
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
      dom: 'Brtip',
      buttons: [
        {extend: 'print', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'copyHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'csvHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'excelHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      ]
    }
    this.approverForm = fb.group({
      approverName: [null, Validators.required],
      position: [null, Validators.required],
      formApproval: [null, Validators.required],
      userId: [null, this.userIdApprovalTypeValidator()],
      createdAt: [null],
      updatedAt: [null]
    })

    this.form = fb.group({
      code: [null, Validators.required],
      leave_name: [null, Validators.required],
      classification: [null, Validators.required],
      description: [null, Validators.required],
      increment: [null, Validators.required],
      incrementSummary: [null, Validators.required],
      autoReset: [null, Validators.required],
      autoResetSummary: [null, Validators.required],
      monetization: [null, Validators.required],
      conversion: [null, Validators.required],
      amount: [null, Validators.required],
      remarks: [null, Validators.required],
      viewInReport: [null],
      referenceNumber: [null],
      inactive: [null],

      leaveReset: [null],
      leaveApproval: [null],
      approverCount: [null],
      checkIfAttachmentIsRequired: [null],
    })
  }

  ngOnInit(): void {
    this.loading = true;
    this.getLeaveTypes()
    this.getLeaveApprovers()
    this.getUsers()
  }

  get f() { return this.form }

  get af() { return this.approverForm }

  /**
   * Get Leave Types
   */
  getLeaveTypes() {
    this.loading = true;
    this.leaveTypes = []
    this.leaveService.getLeaveTypes().subscribe(
      (response: any) => {
        this.leaveTypes = response?.rows
        // Sort the documents by 'createdAt' in descending order (newest first)
        this.leaveTypes.sort((a, b) => {
          const dateA = new Date(a.doc.createdAt).getTime();
          const dateB = new Date(b.doc.createdAt).getTime();
          return dateB - dateA;  // Sort in descending order
        });
        this.loading = false;
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Leave Approvers
   */
  getLeaveApprovers() {
    this.loading = true;
    this.approvers = []
    this.leaveService.getLeaveApprovers().subscribe(
      (response: any) => {
        this.approvers = response?.rows
        // Sort the documents by 'createdAt' in descending order (newest first)
        this.approvers.sort((a, b) => {
          const dateA = new Date(a.doc.createdAt).getTime();
          const dateB = new Date(b.doc.createdAt).getTime();
          return dateB - dateA;  // Sort in descending order
        });
        this.loading = false;
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  getUsers() {
    this.backEndService.allUsers().subscribe((data: any) => {
      let list = data?.rows.filter(item => !(item.doc._id.includes('_design')));
      this.users = list
      this.loading = false;
    },
    (error) => {
      this.toastr.error(error.error.reason)
      this.loading = false;
    }
    )
  }

  /**
   * Edit Leave Type
   * @param data
   * @param content
   */
  editLeaveType(data, content) {
    this.form.addControl('_id', new FormControl(null, Validators.required))
    this.form.addControl('_rev', new FormControl(null))
    this.f.get('referenceNumber').disable()
    this.form.patchValue(data)
    this.isEdit = !this.isEdit
    this.open(content)
  }

  /**
   * Delete Leave
   * @param index
   */
  deleteLeaveType(data) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.leaveService.deleteLeaveType(data).subscribe(
          (response: any) => {
            Swal.fire('Deleted!', '', 'success')
            this.getLeaveTypes()
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
    this.modalService.open(content, { backdrop: false, centered: true, size: 'xl' })
  }

  /**
   * Dismiss all modals
   */
  dismiss() {
    this.form.removeControl('_id')
    this.form.removeControl('_rev')
    this.isEdit = false
    this.f.get('referenceNumber').enable()
    this.modalService.dismissAll()
  }
  
  // addCreatedTimestamps() {
  //   // Utilizing the service function
  //   this.backEndService.addCreatedAtToAllDocs();
  // }

  submitLeaveType() {
    if (this.form.valid) {
      if (this.f.get('_id')?.value) {
        this.leaveService.updateLeaveType(this.form.value).subscribe(
          (response: any) => {
            this.toastr.success('Leave type updated successfully.')
            this.form.removeControl('_id')
            this.form.removeControl('_rev')
            this.form.reset()
            this.dismiss()
            this.getLeaveTypes()
          },
          (error) => {
            this.f.disable()
            this.toastr.error(error.error.reason)
          }
        )
      } else {
        // Add timestamps for createdAt and updatedAt
        const createdAt = new Date().toISOString();  // Set current timestamp
        const updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
        // Add these fields to the form
        this.form.addControl('createdAt', this.fb.control(createdAt));
        this.form.addControl('updatedAt', this.fb.control(updatedAt));
      
        this.f.get('referenceNumber').patchValue(Math.floor(Math.random() * 9999999999) + 1)
        this.leaveService.createLeaveType(this.form.value).subscribe(
          (response: any) => {
            this.toastr.success('Leave type created successfully.')
            this.form.reset()
            this.dismiss()
            this.getLeaveTypes()
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

  submitApprover(){
    if (this.approverForm.valid) {
      const approverData = this.approverForm.value;
      
      // Preserve the createdAt timestamp from the original record
      // approverData.createdAt = this.approverForm.createdAt;  // Keep the original createdAt timestamp
      approverData.updatedAt = new Date().toISOString();  // Set current timestamp for updatedAt
      
      this.af.get('approverName').patchValue(this.af.get('approverName').value.toUpperCase())
      if(this.af.get('userId').value == 'null') this.af.get('userId').patchValue(null);
      if (this.af.get('_id')?.value) {
        this.leaveService.updateLeaveApprovers(approverData).subscribe(
          (response: any) => {
            this.toastr.success('Approver updated successfully.')
            this.approverForm.removeControl('_id')
            this.approverForm.removeControl('_rev')
            this.getLeaveApprovers()
            this.approverForm.reset()
            this.dismiss()
          },
          (error) => {
            this.af.disable()
            this.toastr.error(error.error.reason)
          }
        )
      } else {
        const approverData = this.approverForm.value;

        // Add timestamps for createdAt and updatedAt
        approverData.createdAt = new Date().toISOString();  // Set current timestamp
        approverData.updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
        
        this.leaveService.createLeaveApprovers(approverData).subscribe(
          (response: any) => {
            this.toastr.success('Approver created successfully.')
            this.getLeaveApprovers();
            this.approverForm.reset()
            this.dismiss()
            // this.getLeaveTypes()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    } else {
      this.approverForm.markAllAsTouched()
    }
  }

  /**
 * Edit Leave Type
 * @param data
 * @param content
 */
  editApprover(data, content) {
    this.approverForm.addControl('_id', new FormControl(null, Validators.required))
    this.approverForm.addControl('_rev', new FormControl(null))
    this.approverForm.patchValue(data)
    this.isEdit = !this.isEdit
    this.open(content)
  }

  /**
 * Delete Leave
 * @param index
 */
  deleteApprover(data) {
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.leaveService.deleteLeaveApprover(data).subscribe(
          (response: any) => {
            Swal.fire('Deleted!', '', 'success')
            this.getLeaveApprovers()
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    });
  }

   userIdApprovalTypeValidator(): any {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const selectedUserId = control.value;
      const selectedApprovalType = control.parent?.get('formApproval')?.value;
      if (selectedUserId && selectedApprovalType) {
        const existingApprover = this.approvers.find(approver => approver.doc.userId === selectedUserId && approver.doc.formApproval === selectedApprovalType);
        console.log(existingApprover)
        if (existingApprover) {
          return { userIdApprovalTypeConflict: true };
        }
      }
      return null;
    };
  }

  getTypeDescription(type: string): string {
    if (type === '7A') {
      return 'Certification';
    } else if (type === '7B') {
      return 'Recommendation';
    } else if (type === '7C') {
      return 'Approval';
    } else {
      return 'None';
    }
  }

  applyTypeFilter() {
    const table = $('#approversTable').DataTable();
    if (this.currentTypeFilter === 'All') {
        table.search('').columns().search('').draw();
        return;
    }
    if (this.currentTypeFilter !== 'All') {
      table.search(this.currentTypeFilter).draw();
    } else {
        table.search('').draw();
    }

  }
}
