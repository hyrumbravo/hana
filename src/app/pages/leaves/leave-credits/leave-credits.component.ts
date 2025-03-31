import {Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { LeaveService } from '@services/leave/leave.service';
import { ProfileService } from '@services/profile/profile.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { BakcEndService } from '@/bakc-end.service';
import { Subject } from 'rxjs';


@Component({
    selector: 'app-leave-credits',
    templateUrl: './leave-credits.component.html',
    styleUrls: ['./leave-credits.component.scss']
})
export class LeaveCreditsComponent implements OnInit {
  
  loading = false;
  ledgerForm: FormGroup;
  leaveCardList = [];
  selectedEmployee = null;
  totalFlEarned: number = 0;
  totalSplEarned: number = 0;
  editMode:boolean = false;

  dtOptions: any;
  dtOptionsAddedCreditLeave: any;
  dtTrigger: Subject<any> = new Subject<any>();
  form: FormGroup;
  employees = [];
  leaveCredits = [];
  leaves = [];
  leaveTypes = [];
  positions = [];
  employeeLeaveCredits = [];
  dateToday = new Date();
  id_no: string = '';
  totalEarned: number = 0;
  totalSick: number = 0;
  totalVacation: number = 0;
  modalCreateRef: NgbModalRef;
  leaveHistory: boolean = false;
  currentUser:any = null;
  currentGroup:any = null;

  constructor(
    private fb: FormBuilder,
    private service: BakcEndService,
    private leaveService: LeaveService,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private router: Router
    ) {
      this.ledgerForm = fb.group({
        index             : [null],
        type              : [null, Validators.required],
        creditType        : [null],
        leavetype         : [null],
        inclusive_from    : [null, Validators.required],
        inclusive_to      : [null],
        from              : [null, Validators.required],
        to                : [null],
        vacationCredits   : [0],
        sickCredits       : [0],
        forcedLeaveAdd    : [0],
        specialLeaveAdd   : [0],
        particulars       : ["", Validators.required],
        days              : [0],
        daysEquiv         : [0],
        hours             : [0],
        hoursEquiv        : [0],
        minutes           : [0],
        minutesEquiv      : [0],
        monet             : [0],
        withoutPay        : [false],
      })
      
  }

  ngOnInit(): void {
    this.loading = true;
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
      ],
    };
    
    this.dtOptionsAddedCreditLeave = {
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
      ],
    };
    
    
    this.getCurrentUser();
    this.getLeaveTypes();
    this.getPositions();
    this.getEmployeLeaveData();
    this.getEmployeeProfileLeaveData();
    // this.loading = false;
    // this.reinitializeMainDataTable();
    // this.reinitializeCreditDataTable();
  }
  
  ngOnDestroy(): void {
    // Unsubscribe from the dtTrigger to prevent memory leaks
    this.dtTrigger.unsubscribe();
  }

  getCurrentUser(){
    this.service.getSystemUser().subscribe(
      (response: any) => {
        this.currentUser = response?.rows[0].doc
        if(this.currentUser){
          this.service.getUserGroupbyId(this.currentUser.setting_id).subscribe(
            (response: any) => {
              this.currentGroup = response?.rows[0].doc
            })
        }
        
      })

  }
  
  reinitializeMainDataTable() {
    
    // Destroy DataTable instance and reset it
    $('#leaveCreditsTable').DataTable().clear().destroy();
      
    setTimeout(() => {
      this.dtTrigger.next(null);
    });
  }
  
  reinitializeCreditDataTable() {
    
    // Destroy DataTable instance and reset it
    $('#addedCreditsLeavesTable').DataTable().clear().destroy();
      
    setTimeout(() => {
      this.dtTrigger.next(null);
    });
  }
  
  //For bulk updates
  // addCreatedAt(){
  //   this.service.addCreatedAtToAllDocs();
  // }

  getEmployeLeaveData(){
    this.leaveCardList = []
    this.loading = true;
    this.leaveService.getLeaveCard().subscribe((response: any) => {
        // this.leaveCardList = response.rows
        
        if(this.currentUser?.department != null){
          this.leaveCardList = response?.rows.filter(item => (item.doc.department.includes(this.currentUser?.department)));
        } else {
          this.leaveCardList = response?.rows
        }
        
        // Sort the card array inside each leave card document by createdAt
      this.leaveCardList.forEach(leaveCard => {
        if (leaveCard.doc.card && leaveCard.doc.card.length > 0) {
          leaveCard.doc.card.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;  // Sort in descending order
          });
        }
      });
      
      this.loading = false;
    });
  }
  
  getEmployeeProfileLeaveData()
  {
    this.employees = [];
    this.loading = true;
    this.profileService.getEmployees().subscribe((response1: any) => {
      let list = response1?.rows.filter(item => !(item.doc._id.includes('_design')));
      if(this.currentUser?.department != null){
        this.employees = list.filter(item => (item.doc.serviceInformation?.department?.includes(this.currentUser?.department)));
      } else {
        this.employees = list
      }

      if(this.id_no != ''){
        this.selectedEmployee = null;
        let empCard = this.leaveCardList.find(x=> x.doc.employee_id === this.id_no)
        this.selectedEmployee = empCard.doc
      }
      // Call dtTrigger after data is set
      this.dtTrigger.next(null);
        
      this.loading = false; //endpoint
    },
    (error) => {
      this.toastr.error(error.error.reason)
      this.loading = false;
    });
  }
  


  /**
   * Show Leave Credits
   * @param employee
   * @param content
   */
  showLeaveCredit(employee, content) {
    this.id_no = employee.employee_id
    this.selectedEmployee = employee
    this.computeTotalCredits()
    this.open(content)
  }

  computeTotalCredits(){
    this.totalSick =0; this.totalVacation = 0; this.totalFlEarned = 0; this.totalSplEarned = 0;

    this.selectedEmployee.card.forEach(el => {
      if(el.dataType == 'credit'){
        this.totalVacation = this.totalVacation + el.earnedVacationCredits
        this.totalSick = this.totalSick + el.earnedSickLeaveCredits
        this.totalFlEarned = this.totalFlEarned + el.addedForcedLeave
        this.totalSplEarned = this.totalSplEarned + el.addedSpecialLeave
      }

    });
  }

  openEditLedger(employee, content, index){
    // this.editMode = true
    this.id_no = employee.employee_id
    this.selectedEmployee = employee

    let employeeCard = this.leaveCardList.find(x=> x.doc.employee_id == this.id_no);
    console.log(employeeCard)
    //patch

    if(employeeCard){
      this.patchToLedgerForm(employeeCard.doc.card[index], index);
      this.openCreate(content, 'edit')
    } else {
      this.toastr.error('Failed to load data.')
      console.log("employee card data not found")
    }
    // console.log(this.editMode)
  }

  showLeaveCard(employee, content){
    this.id_no = employee.id_no
    this.selectedEmployee = employee
    console.log(this.selectedEmployee.card)
    this.open(content)
  }

  /**
   * Get Positions
   */
  getPositions() {
    this.profileService.getPositions().subscribe(
      (response: any) => {
        this.positions = response?.rows;
        // this.getEmployees()
        
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
      
    )
  }

  /**
   * Get Leave Types
   */
  getLeaveTypes() {
    this.leaveService.getLeaveTypes().subscribe(
      (response: any) => {
        this.leaveTypes = response?.rows;
        
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
    for (let index = 0; index < this.leaveTypes?.length; index++) {
      if (this.leaveTypes[index].doc.code == id) {
        return this.leaveTypes[index].doc.leave_name
      }
    }
  }

  goToLeaveHistory() {
    this.modalService.dismissAll()
    this.router.navigate(['/LeaveHistory/', this.id_no])
  }

  /**
   * Open Modal
   * @param content
   */
  open(content) {
    this.modalService.open(content, { backdrop: false, centered: true, size: 'xl'})
  }

  /**
   * Open Modal Create
   * @param content
   */
  openCreate(content , type) {
    // if(type == 'add'){this.editMode = false}
    this.modalCreateRef = this.modalService.open(content, { backdrop: false, centered: true, size: 'lg' })
  }

  /**
   * Dismiss all modals
   */
  dismiss() {
    this.modalService.dismissAll()
  }

  dismissModal() {
    this.ledgerForm.reset()
    this.modalCreateRef.dismiss()
  }

  patchToLedgerForm(row, indx){
    console.log('patching value')

    this.ledgerForm.patchValue({
      index           : indx,
      type            : row.dataType,
      from            : row.as_of_start,
      to              : row.as_of_end,
      vacationCredits : row.earnedVacationCredits,
      sickCredits     : row.earnedSickLeaveCredits,
      forcedLeaveAdd  : row.addedForcedLeave,
      specialLeaveAdd : row.addedSpecialLeave,
      particulars     : row.particulars,
      days            : row.daysTU,
      daysEquiv       : row.daysTU,
      hours           : row.hoursTU,
      hoursEquiv      : row.hoursEQUIV,
      minutes         : row.minsTU,
      minutesEquiv    : row.minsEQUIV,
      monet           : row.vlslMonet,
    });
  }

  submitLedgerForm() {
    let formValue = this.ledgerForm.value
    let employeeCard = this.leaveCardList.find(x=> x.doc.employee_id == this.id_no)
    
    if(employeeCard){
      employeeCard = this.updatePrimaryDetails(employeeCard)

      let row = this.newCredit()
      row.dataType = formValue.type
      row.leavetype = formValue.leavetype
      row.as_of_start = formValue.from
      row.as_of_end = formValue.to
      row.particulars = formValue.particulars
      row.earnedVacationCredits = formValue.vacationCredits  ?? 0
      row.earnedSickLeaveCredits = formValue.sickCredits  ?? 0
      row.addedForcedLeave = formValue.forcedLeaveAdd  ?? 0
      row.addedSpecialLeave = formValue.specialLeaveAdd  ?? 0
      row.vlslMonet = formValue.monet ?? 0
      row.daysTU = formValue.days  ?? 0
      row.hoursTU = formValue.hours ?? 0
      row.hoursEQUIV = formValue.hoursEquiv ?? 0
      row.minsTU = formValue.minutes ?? 0
      row.minsEQUIV = formValue.minutesEquiv  ?? 0
      row.previousBalance = employeeCard.doc.vlBalance
      row.previousSickLeaveBalance = employeeCard.doc.slBalance
      row.wop = formValue.withoutPay
      
      // Add createdAt and updatedAt timestamps
      row.createdAt = new Date().toISOString();
      row.updatedAt = new Date().toISOString();
    
      if(this.editMode){
        let index = formValue.index
      } else {
        if(row.dataType == 'leave'){
          const totalDays = this.getDiffDays(formValue.inclusive_from, formValue.inclusive_to);
          
          row.leaveTotalDays = totalDays
          row.currentBalance = row.previousBalance
          row.currentSickLEaveBalance = row.previousSickLeaveBalance
          row.forcedLeaveBalance = employeeCard.doc.flBalance
          row.specialLeaveBalance = employeeCard.doc.splBalance

          if(row.leavetype == '001' || row.leavetype == '002'){
            row.vlslMonet = totalDays;
            row.currentBalance = Number((row.previousBalance  -  row.vlslMonet).toFixed(3));

            if(row.leavetype == '002'){
                row.forcedLeaveBalance = Number((employeeCard.doc.flBalance - totalDays).toFixed(3));
            }
            row.vacationLeaveDates = finalDateString(formValue.inclusive_from, formValue.inclusive_to)
          } else if(row.leavetype == '003'){// sl
            row.sl_deduction = totalDays
            if(!row.wop){
              row.currentSickLEaveBalance = Number((row.previousSickLeaveBalance - row.sl_deduction).toFixed(3));
            } else row.particulars = `${row.particulars} (W/O pay)`;

            row.sl_start = formatDate(formValue.inclusive_from)
            row.sl_end = formatDate(formValue.inclusive_to)
          } else if(row.leavetype == '006'){// spl
            row.specialLeaveBalance = Number((employeeCard.doc.splBalance  - totalDays).toFixed(3));
            row.vacationLeaveDates = finalDateString(formValue.inclusive_from, formValue.inclusive_to)
          } else row.particulars = `${row.particulars} (${totalDays})`

        } else {
          //vacay credits
          row.currentBalance = Number((row.previousBalance  + formValue.vacationCredits).toFixed(3));
          //sick credits
          row.currentSickLEaveBalance = Number((row.previousSickLeaveBalance + formValue.sickCredits).toFixed(3))
          row.forcedLeaveBalance = employeeCard.doc.flBalance + formValue.forcedLeaveAdd
          row.specialLeaveBalance = employeeCard.doc.splBalance + formValue.specialLeaveAdd
        }
    
        //TU deductions
        row.totEQUIV = Number((formValue.days + formValue.hoursEquiv + formValue.minutesEquiv).toFixed(3))
        row.currentBalance = Number((row.currentBalance  - row.totEQUIV).toFixed(3));
  
        //monetization deductions
        row.currentBalance = Number((row.currentBalance  - formValue.monet).toFixed(3));
  
        // update balances
        employeeCard.doc.vlBalance = row.currentBalance
        employeeCard.doc.slBalance = row.currentSickLEaveBalance
        employeeCard.doc.flBalance = row.forcedLeaveBalance
        employeeCard.doc.splBalance = row.specialLeaveBalance
  
        employeeCard.doc.card.push(row)
      }

      this.leaveService.updateLeaveCard(employeeCard.doc).subscribe(
        (response: any) => { 
          console.log(response)
          this.toastr.success(formValue.type + ' added successfully.')
          this.ledgerForm.reset()
          this.getEmployeLeaveData()
          this.computeTotalCredits()
          this.dismissModal()
          this.reinitializeMainDataTable()
          this.reinitializeCreditDataTable()
        }),
        (error) => {
          this.toastr.error(error.error.reason)
        }
    } else {
      console.log('no employee found')
    }
  }

  deductionWarnings(){
    const frm = this.ledgerForm.controls
    const employeeCard = this.leaveCardList.find(x=> x.doc.employee_id == this.id_no);
    if(frm.type.value == 'leave'){

      if(frm.withoutPay.value) return ''

      if(frm.inclusive_from.value != null && frm.inclusive_to.value != null){
        const totalDays = this.getDiffDays(frm.inclusive_from.value, frm.inclusive_to.value);
        if(frm.leavetype.value == '001' || frm.leavetype.value == '002'){
          if( frm.leavetype.value == '002'){
            if(employeeCard.doc.flBalance == 0) return "You dont have available FL Balance"
            if ((employeeCard.doc.flBalance - totalDays) < 0) return 'Total leave deduction is more than available FL balance'
          } 
          if((employeeCard.doc.vlBalance - totalDays) < 0) return 'Total leave deduction is more than available VL credits'
        } else if(frm.leavetype.value == '003'){
          if((employeeCard.doc.slBalance - totalDays) < 0) return 'Total leave deduction is more than available SL credits'
        } else if(frm.leavetype.value == '006'){
          if(employeeCard.doc.splBalance == 0) return "You dont have available SPL Balance"
          if((employeeCard.doc.splBalance - totalDays) < 0) return 'Total leave deduction is more than available SPL balance'
        }
      }
    } return '';
  }

  updatePrimaryDetails(emp){
    let data = this.employees.find(x=>x.doc.id ==emp.doc.employee_id)

    if(data){
      emp.doc.card['name'] = data.doc.lastName + ", " + data.doc.firstName + " " + data.doc.middleName +" "+ (data.doc?.ext ?? "")
      emp.doc.card['monthlyRate'] = data.doc.serviceInformation.monthlyRate
      emp.doc.card['position'] = data.doc.position_title
      emp.doc.card['civilStatus'] = data.doc.civilStatus
      emp.doc.card['salaryGrade'] = data.doc.salaryGrade
      emp.doc.card['salaryStep'] = data.doc.salaryStep
      emp.doc.card['dateHired'] = data.doc.dateHired
      emp.doc.card['birthDate'] = data.doc.birthDate
      emp.doc.card['gsis'] = data.doc.gsis
      emp.doc.card['tin'] = data.doc.tin
    }
    return emp
  }

  deleteLedgerFormEntry(data, index){
    let employeeCard = this.leaveCardList.find(x=> x.doc.employee_id == data.employee_id);
    Swal.fire({
      icon: 'info',
      title: 'Do you want to delete this record?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        if(employeeCard){
          employeeCard = this.updatePrimaryDetails(employeeCard)
          const credit = employeeCard.doc.card[index]

          let updatedCard = updateComputedChanges(employeeCard, index)
          this.leaveService.updateLeaveCard(updatedCard.doc).subscribe(
            (response: any) => { 
              if(credit?.leaveId != null){ //countercheck if entry has leaveId
                this.leaveService.getApprovalData(credit.leaveId).subscribe(
                  (response: any) => {
                  if(response.rows.length){
                  this.leaveService.deleteLeaveApproval(response.rows[0].doc).subscribe(//deleteLeaveApproval
                    (response: any) => {
                      console.log(response)
                    })
                  }
                })
              }
              Swal.fire('Deleted!', '', 'success')
              this.ledgerForm.reset()
              this.getEmployeLeaveData()
              this.computeTotalCredits()
            }),
            (error) => {
              this.toastr.error(error.error.reason)
            }
        }
      }
    });
  }

  clearLedgerFormValues(){
    const type = this.ledgerForm.get('type').value;

    if(type === 'credit'){
      this.ledgerForm.get('monet').setValue(0)
      this.ledgerForm.get('days').setValue(0)
      this.ledgerForm.get('daysEquiv').setValue(0)
      this.ledgerForm.get('hours').setValue(0)
      this.ledgerForm.get('hoursEquiv').setValue(0)
      this.ledgerForm.get('minutes').setValue(0)
      this.ledgerForm.get('minutesEquiv').setValue(0)
    } else if(type === 'tu'){
      this.ledgerForm.get('vacationCredits').setValue(0)
      this.ledgerForm.get('sickCredits').setValue(0)
      this.ledgerForm.get('forcedLeaveAdd').setValue(0)
      this.ledgerForm.get('specialLeaveAdd').setValue(0)
      this.ledgerForm.get('sickCredits').setValue(0)
      this.ledgerForm.get('creditType').setValue(null)
      this.ledgerForm.get('monet').setValue(0)
      this.ledgerForm.get('to').setValue(null)
    } else if(type === 'monetization'){
      this.ledgerForm.get('vacationCredits').setValue(0)
      this.ledgerForm.get('sickCredits').setValue(0)
      this.ledgerForm.get('forcedLeaveAdd').setValue(0)
      this.ledgerForm.get('specialLeaveAdd').setValue(0)
      this.ledgerForm.get('creditType').setValue(null)
      this.ledgerForm.get('days').setValue(0)
      this.ledgerForm.get('daysEquiv').setValue(0)
      this.ledgerForm.get('hours').setValue(0)
      this.ledgerForm.get('hoursEquiv').setValue(0)
      this.ledgerForm.get('minutes').setValue(0)
      this.ledgerForm.get('minutesEquiv').setValue(0)
      this.ledgerForm.get('to').setValue(null)
    }
  }

  hideCreditType(){
    return this.ledgerForm.get('type').value === 'credit';
  }

  hideTU(){
    return this.ledgerForm.get('type').value === 'tu';
  }
  
  hideLeave(){
    return this.ledgerForm.get('type').value === 'leave';
  }

  hideMonetization(){
    return this.ledgerForm.get('type').value === 'monetization';
  }

  setMonthlyEarnedCredit(){
    if(this.ledgerForm.get('type').value === 'credit'){
      this.ledgerForm.get('vacationCredits').setValue(1.250)
      this.ledgerForm.get('sickCredits').setValue(1.250)
      this.ledgerForm.get('forcedLeaveAdd').setValue(0)
      this.ledgerForm.get('specialLeaveAdd').setValue(0)
    }
  }

  computeDaysTU($event){
      this.ledgerForm.get('daysEquiv').setValue(Number($event.target.value))
  }
  computeHoursTU($event){ //compute hours equiv
    this.ledgerForm.get('hoursEquiv').setValue(Number((($event.target.value) / 8).toFixed(3)))
  }
  computeMinsTU($event){ //compute mins equiv (8hrs*60mins = 480mins)
    const inputValue = $event.target.value;
    let convertedValue: number;

    if (inputValue == 6) {
      convertedValue = 0.012;
    } else convertedValue = Number((inputValue / 480).toFixed(3));

    this.ledgerForm.get('minutesEquiv').setValue(convertedValue);
    // this.ledgerForm.get('minutesEquiv').setValue(Number((($event.target.value) / 480).toFixed(3)))
  }

  checkAddToLedgerForm(){
    const formValues = this.ledgerForm.value
    let disabled = true

    if(formValues.type == 'credit'){
      if(formValues.from != null && formValues.to != null && formValues.particulars != "" && formValues.vacationCredits != null
            && formValues.sickCredits != null && formValues.forcedLeaveAdd != null && formValues.specialLeaveAdd != null){
        disabled = false;
      }
    } else if(formValues.type == 'tu'){
      console.log('tu')
      if(formValues.from != null && formValues.particulars != "" && formValues.days != null && formValues.hours != null
      && formValues.minutes != null){
        console.log('tu2')
        disabled = false;
      }
    } else if(formValues.type == 'monetization'){
      if(formValues.from != null && formValues.particulars != "" && formValues.monet != null){
          disabled = false;
      }
    } else if(formValues.type == 'leave'){
      if(this.deductionWarnings() == '' && formValues.from != null && formValues.inclusive_from != null && formValues.inclusive_to != null && formValues.particulars != "" && formValues.leavetype != null){
        disabled = false;
      }
    }
    return disabled
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
  
  newCredit(){
    return {
      "dataType": "",
      "leavetype": null,
      "leaveId": null,
      "as_of_start": null,
      "as_of_end": null,
      "particulars": null,
      "earnedVacationCredits": 0,
      "daysTU": 0,
      "hoursTU": 0,
      "hoursEQUIV": 0,
      "minsTU": 0,
      "minsEQUIV": 0,
      "totEQUIV": 0,
      "vlslMonet": 0,
      "previousBalance": 0,
      "currentBalance": 0,
      "vacationLeaveDates": null,
      "ctoDates": null,
      "abs_und_wop": null,
      "addedForcedLeave": 0,
      "addedSpecialLeave": 0,
      "forcedLeaveBalance": 0,
      "specialLeaveBalance": 0,
      "earnedSickLeaveCredits": 0,
      "previousSickLeaveBalance": 0,
      "currentSickLEaveBalance": 0,
      "wop": false,
      "sl_deduction": 0,
      "sl_start": null,
      "sl_end": null,
      "leaveTotalDays": 0,
      "createdAt": '', // Add this field
      "updatedAt": ''  // Add this field
    }
  }
}

function updateComputedChanges(employeeCard, index){
  let newEmployeeCard = employeeCard
  let credit = employeeCard.doc.card[index]

  let newPrevBalance = credit.previousBalance
  let newPrevSBalance = credit.previousSickLeaveBalance
  let newFlSBalance = credit.forcedLeaveBalance
  let newSplBalance = credit.specialLeaveBalance
  //recompute the other entries to update balances
  if(index < (newEmployeeCard.doc.card.length-1)){
    for (let idx = index+1; idx < newEmployeeCard.doc.card.length; idx++) {
      let element = newEmployeeCard.doc.card[idx];

      element.previousBalance = newPrevBalance //take last previous vacation balance
      element.currentBalance = Number((element.previousBalance + element.earnedVacationCredits).toFixed(3));
      element.currentBalance = Number((element.currentBalance - element.totEQUIV).toFixed(3));//deduct monet/TU
      
      if(!element.wop){
        element.currentBalance = Number((element.currentBalance - element.vlslMonet).toFixed(3));//deduct leave only if !wop
      }

      element.previousSickLeaveBalance = newPrevSBalance //take last previous sick leave balance        
      element.currentSickLEaveBalance = Number((element.previousSickLeaveBalance + element.earnedSickLeaveCredits).toFixed(3));

      if(!element.wop){
        element.currentSickLEaveBalance = Number((element.currentSickLEaveBalance - (element.sl_deduction)).toFixed(3));//sl deductions
      }
      
      element.forcedLeaveBalance = newFlSBalance + element.addedForcedLeave
      element.specialLeaveBalance = newSplBalance + element.addedSpecialLeave

      //other leaves deduction
      if(element.leavetype == '002') element.forcedLeaveBalance =  Number(element.forcedLeaveBalance - element.vlslMonet);

      if(element.leavetype == '006') element.specialLeaveBalance = Number(element.specialLeaveBalance - element.leaveTotalDays);

      
      newPrevBalance = element.currentBalance
      newPrevSBalance = element.currentSickLEaveBalance
      newFlSBalance = element.forcedLeaveBalance
      newSplBalance = element.specialLeaveBalance

      newEmployeeCard.doc.card[idx] = element;
      newEmployeeCard.doc.vlBalance = newPrevBalance
      newEmployeeCard.doc.slBalance = newPrevSBalance
      newEmployeeCard.doc.flBalance = newFlSBalance
      newEmployeeCard.doc.splBalance = newSplBalance
    }
  }

  //re-add deleted leave credits
  if(credit.dataType == 'monetization'){ //others
    newEmployeeCard.doc.vlBalance = Number((newEmployeeCard.doc.vlBalance + credit.vlslMonet).toFixed(3))
  } else if(credit.leavetype == '001' || credit.leavetype == '002'){ //vacation/fl
    if(!credit.wop){
      newEmployeeCard.doc.vlBalance = Number((newEmployeeCard.doc.vlBalance + credit.vlslMonet).toFixed(3))
    
      if(credit.leavetype == '002') newEmployeeCard.doc.flBalance = Number((newEmployeeCard.doc.flBalance + credit.vlslMonet).toFixed(3))
    }
  } else if(credit.leavetype == '003'){ //sick leave
    if(!credit.wop) newEmployeeCard.doc.slBalance = Number((newEmployeeCard.doc.slBalance + credit.sl_deduction).toFixed(3))
  } else if(credit.leavetype == '006'){ //
    if(!credit.wop) newEmployeeCard.doc.splBalance = Number((newEmployeeCard.doc.splBalance + credit.leaveTotalDays).toFixed(3))
  }

  newEmployeeCard.doc.card.splice(index, 1)
  return newEmployeeCard
}

function finalDateString(start, end){
  const startDate = formatDate(start);
  const finishDate = formatDate(end);

  if (startDate === finishDate) {
    return `${startDate}`;
  } else return `${startDate} - ${finishDate}`;
}

function formatDate(dateString: string,): string {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString();

  return `${month}/${day}/${year}`;
}