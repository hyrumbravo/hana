import { Injectable } from '@angular/core';
import { LeaveService } from './leave.service';
import { async, map } from 'rxjs';
import { ProfileService } from '@services/profile/profile.service';
@Injectable({
  providedIn: 'root'
})
export class CreditEarningService {
  leaves          = []
  employees       = []
  leaveCardData   = []
  updateCardData  = []

  constructor(private leaveService: LeaveService, private profileService: ProfileService) { }

  /**
   * service entry point 
   */
  async creditEarning() {
    this.updateCardData = []
    await this.getEmployees();
    await this.getLeaves();
    await this.getEmployeeCards();
    this.monthlyCreditChecking()
  }
  
  // async calls 
  private async getEmployees(){
    return new Promise<void>((resolve, reject) => {
      this.profileService.getEmployees()
        .pipe(map((data: any) => {
            const prunedEmployees = data.rows.filter(item => (
              'doc' in item &&
              'disciplineManagements' in item.doc &&
              item.doc.disciplineManagements.length !== 0
            ));
            return { ...data, rows: prunedEmployees };
          })
        ).subscribe(
          (data: any) => {
            this.employees = data.rows;
            resolve();
          },
          error => {
            reject(error);
          }
        );
    });
  }
  private async getLeaves() {
    return new Promise<void>((resolve, reject) => {
      this.leaveService.getLeaveApprovals()
        .pipe(map((data: any) => {
            const prunedLeaves = data.rows.filter(row => row.doc.status === 'approved' && row.doc.leaveType === '010'
            );
            return { ...data, rows: prunedLeaves };
          })
        ).subscribe(
          (data: any) => {
            this.leaves = data.rows;
            resolve();
          },
          error => {
            reject(error);
          }
        );
    });
  }
  private async getEmployeeCards() {
    return new Promise<void>((resolve, reject) => {
      this.leaveService.getLeaveCard()
        .pipe(map((data: any) => {
            const prunedCards = data.rows.filter(
              row => row.doc.dateHired !== null && row.doc.dateHired !== ''
            );
            return { ...data, rows: prunedCards };
          })
        ).subscribe(
          data1 => {
            this.leaveCardData = data1.rows;
            resolve();
          },
          error => {
            reject(error);
          }
        );
    });
  }
  private async updateLeaveCards(){
    const promises = this.updateCardData.map((el) => this.leaveService.updateLeaveCard(el).toPromise());
    return Promise.all(promises)
    .then(() => {
      console.log('creditEarningService update: ', this.updateCardData.length)
      this.updateCardData = [] //clear queue
    })
    .catch((error) => {
      console.log(error.error.reason);
    });
  }
  //end of async calls

  /**
   * once all data is loaded, monthly credit checking will execute for employees
   */
  private monthlyCreditChecking(){
    //check if today is last day of month else service will check for previous monthly credit entries
    let creditMonth = (isLastDayOfMonth())? getCurrentMonth(): getPreviousMonth();
    console.log('creditEarningService: ', (isLastDayOfMonth())? 'Today is last day of the month': 'Today is not the last day of the month');

    //check if our leave cards are updated or needs updating
    this.leaveCardData.forEach(dt => {
      const check = isDateInMonth(creditMonth.firstDay, creditMonth.lastDay, dt.doc.dateHired)
      const isQualified = this.checkEmployeeLeaveStatus(dt, creditMonth)

      if(check && isQualified){
        let leaveCard = null;

        if(isWithinMonth(creditMonth.firstDay, creditMonth.lastDay, dt.doc.dateHired)){
          leaveCard = this.findLeaveCard(dt, dt.doc.dateHired, creditMonth.lastDay);
        } else leaveCard = this.findLeaveCard(dt, creditMonth.firstDay, creditMonth.lastDay);

        if (leaveCard !== null) this.updateCardData.push(leaveCard.doc);

      }  
    });  
    (this.updateCardData.length != 0)? this.updateLeaveCards(): console.log('creditEarningService: no updates');
  }
  
  /**
   * Looks up if employee already have a credit earned for that month
   * @param dt employee leave card
   * @param from start date
   * @param to end date
   */
  private findLeaveCard(dt, from, to){
    return (dt.doc.card.find(x=> x.as_of_start == from && x.as_of_end === to)!=undefined)? null:
        appendNewCreditToCard({ firstDay: from, lastDay: to }, dt);
  }

  /**
   * Checks if Employee is on Rehab Leave, Suspended or on Probation
   * @param employee employee card
   * @param creditMonth credit earning range
   * @returns boolean
   */
  private checkEmployeeLeaveStatus(employee, creditMonth){
    let result = this.findProbationEntry(employee.doc.id_no, creditMonth)
    if(result) return false;

    let leave = this.leaves.find(x=>x.doc.id_no === employee.doc.id_no && 
          new Date(creditMonth.firstDay) >= new Date(x.doc.startDateTime) 
          && new Date(creditMonth.lastDay) <= new Date(x.doc.finishDateTime));
    if(leave!=undefined) return false;

    return true
  }

  /**
   * Looks up disciplineManagements if employee is qualified for credit earning
   * @param id_no - Employee id
   * @param creditMonth - credit earning range
   * @returns 
   */
  private findProbationEntry(id_no, creditMonth){
    let employee = this.employees.find(x=>x.doc.id_no == id_no)
    if(employee == undefined) return false;

    return (employee.doc.disciplineManagements.find(x=>
      new Date(creditMonth.firstDay) >= new Date(x.actionPeriodFrom) 
      && new Date(creditMonth.lastDay) <= new Date(x.actionPeriodTo)) != undefined)
  }
}

function isWithinMonth(from: string, to: string, dateString: string): boolean {
  const dateHired = new Date(dateString);
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  if (isNaN(dateHired.getTime()) || isNaN(fromDate.getTime()) || isNaN(toDate.getTime()))
    throw new Error('Invalid date format');

  // Check if dateHired is within or before the range of fromDate and toDate
  return (dateHired >= fromDate && dateHired <= toDate);
}

function isDateInMonth(from: string, to: string, dateString: string): boolean {
  const dateHired = new Date(dateString);
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  if (isNaN(dateHired.getTime()) || isNaN(fromDate.getTime()) || isNaN(toDate.getTime()))
    throw new Error('Invalid date format');

  // Check if dateHired is within or before the range of fromDate and toDate
  return (dateHired <= toDate && dateHired <= fromDate) || (dateHired >= fromDate && dateHired <= toDate);
}

function isLastDayOfMonth(): boolean {
  const today = new Date();
  const nextDay = new Date(today);
  nextDay.setDate(today.getDate() + 1);
  return nextDay.getMonth() !== today.getMonth();
}

function getCurrentMonth(): { firstDay: string; lastDay: string } {
  const today = new Date();
  const currentMonth = new Date(today);

  const currentMonthYear = currentMonth.getFullYear();
  const currentMonthMonth = currentMonth.getMonth();

  // Get the first & last day of the previous month
  const lastDayOfMonth = formatDate(new Date(currentMonthYear, currentMonthMonth + 1, 0));
  const firstDayOfMonth = formatDate(new Date(currentMonthYear, currentMonthMonth, 1));

  return {
    firstDay: firstDayOfMonth,
    lastDay: lastDayOfMonth,
  };
}

function getPreviousMonth(): { firstDay: string; lastDay: string } {
  const today = new Date();
  const previousMonth = new Date(today);
  previousMonth.setMonth(today.getMonth() - 1);

  const previousMonthYear = previousMonth.getFullYear();
  const previousMonthMonth = previousMonth.getMonth();

  // Get the first & last day of the previous month
  const firstDayOfMonth = formatDate(new Date(previousMonthYear, previousMonthMonth, 1));
  const lastDayOfMonth = formatDate(new Date(previousMonthYear, previousMonthMonth + 1, 0));
  
  return {
    firstDay: firstDayOfMonth,
    lastDay: lastDayOfMonth,
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function newCredit(month){
  return {
    "dataType": "credit",
    "leavetype": null,
    "leaveId": null,
    "as_of_start": month.firstDay,
    "as_of_end": month.lastDay,
    "particulars": 'Earned Leave',
    "earnedVacationCredits": 1.25,
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
    "earnedSickLeaveCredits": 1.25,
    "previousSickLeaveBalance": 0,
    "currentSickLEaveBalance": 0,
    "wop": false,
    "sl_deduction": 0,
    "sl_start": null,
    "sl_end": null,
    "leaveTotalDays": 0
  }
}

function appendNewCreditToCard(cMonth, empCard){
  let credit = newCredit(cMonth) //new credit

  credit.previousBalance = empCard.doc.vlBalance
  credit.currentBalance = Number((empCard.doc.vlBalance + credit.earnedVacationCredits).toFixed(3))
  credit.previousSickLeaveBalance = empCard.doc.slBalance;
  credit.currentSickLEaveBalance = Number((empCard.doc.slBalance + credit.earnedSickLeaveCredits).toFixed(3))
  
  credit.forcedLeaveBalance = empCard.doc.flBalance
  credit.specialLeaveBalance = empCard.doc.splBalance

  //update new balance to card summary
  empCard.doc.vlBalance = credit.currentBalance
  empCard.doc.slBalance = credit.currentSickLEaveBalance
  empCard.doc.card.push(credit)

  return empCard;
}