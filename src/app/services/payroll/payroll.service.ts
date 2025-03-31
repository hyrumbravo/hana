import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbDateStruct, NgbCalendar, NgbDate, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { BakcEndService } from '@/bakc-end.service';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {

	hoveredDate: NgbDate | null = null;
	fromDate: NgbDate | null;
	toDate: NgbDate | null;

  constructor(
    private calendar: NgbCalendar,
    public formatter: NgbDateParserFormatter,
    private http: HttpClient,
    private backendService: BakcEndService,
  ) { }

  formatCurrency(value: number | null): string {
    if (value === null || value === undefined) {
      return '₱ 0.00';
    }
    return `₱ ${value.toFixed(2)}`;
  }

  fieldValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const validPattern = /^[0-9\- ]*$/;
      return validPattern.test(control.value) ? null : { invalidTin: true };
    };
  }
  
  setFilterMode(mode: boolean, today: NgbDate) {
    if (mode) {
      this.fromDate = today;
      this.toDate = this.calendar.getNext(today, 'd', 30);
    }
    return mode;
  }

  validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
    const parsed = this.formatter.parse(input);
    return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
  }

  printSinglePayslip(employeeId: string) {
    this.backendService.getPayrollData().subscribe(dataArray => {
      if (!dataArray || dataArray.length === 0) {
        console.error("No payroll data available.");
        return;
      }

      let targetEmployee = null;
      let payrollMetadata = { payrollType: 'N/A', dateFrom: 'N/A', dateTo: 'N/A' };
  
      for (const payrollDoc of dataArray) {
        const employee = (payrollDoc.employees || []).find(emp => emp.employeeId === employeeId);
        if (employee) {
          targetEmployee = employee;
          payrollMetadata = {
            payrollType: payrollDoc.payrollType,
            dateFrom: payrollDoc.dateFrom,
            dateTo: payrollDoc.dateTo
          };
          break; // Stop searching once we find the employee
        }
      }
  
      if (!targetEmployee) {
        console.warn(`No payslip found for employee ID: ${employeeId}`);
        return;
      }
      const payslipContent = this.buildPrintContent(
        targetEmployee,
        payrollMetadata.payrollType,
        payrollMetadata.dateFrom,
        payrollMetadata.dateTo
      );
  
      // Wrap the payslip content in the full HTML document
      const fullHtmlContent = this.generateFullHtmlContent(payslipContent);
      this.openPrintWindow(fullHtmlContent);
    });
  }
  
  printPayslips(payrollDoc: any) {
    if (!payrollDoc || !payrollDoc.employees || payrollDoc.employees.length === 0) {
      console.error("No data available for printing payslips.");
      return;
    }
  
    let payslips = '';
    const payrollType = payrollDoc.payrollType;
    const dateFrom = payrollDoc.dateFrom;
    const dateTo = payrollDoc.dateTo;
  
    // Generate payslip content for each employee in this specific payroll document
    (payrollDoc.employees || []).forEach(employee => {
      payslips += this.buildPrintContent(employee, payrollType, dateFrom, dateTo);
    });
  
    const fullHtmlContent = this.generateFullHtmlContent(payslips);
    this.openPrintWindow(fullHtmlContent);
  }    

  private buildPrintContent(employee: any, payrollType: string, dateFrom: string, dateTo: string): string {
    const serviceInfo = employee.serviceInformation || {};
    const payrollDetails = employee.payrollDetails || {};
  
    return `
      <div class="payslip-container" style="page-break-after: always;">
        <div class="payslip-header">
          <div class="header-left">
            <img src="assets/img/upward.jpg" alt="Company Logo" class="company-logo">
            <div>
              <p class="company-name">Upward Solutions Inc.</p>
              <p class="company-address">53-1 Market-Site Balaguer St.<br>Daraga, Albay 4501</p>
            </div>
          </div>
          <div class="header-right">
            <p class="payroll-number"><strong>Payroll Number:</strong> ${employee.payrollNum || 'N/A'}</p>
          </div>
        </div>
  
        <div class="payslip-info" style="display: flex; justify-content: space-between;">
          <div>
            <p><strong>Employee Name:</strong> ${employee.employeeName || 'N/A'}</p>
            <p><strong>Payroll Type:</strong> ${payrollType || 'N/A'}</p>
            <p><strong>Branch:</strong> ${serviceInfo.branch || 'N/A'}</p>
            <p><strong>Salary Grade:</strong> ${serviceInfo.salaryGrade || 'N/A'}</p>
          </div>
          <div>
            <p><strong>Position Title:</strong> ${serviceInfo.position || 'N/A'}</p>
            <p><strong>Payroll Range:</strong> ${dateFrom} - ${dateTo}</p>
            <p><strong>Department:</strong> ${serviceInfo.department || 'N/A'}</p>
            <p><strong>Salary Step:</strong> ${serviceInfo.salaryStep || 'N/A'}</p>
          </div>
        </div>

        <div class="payslip-header"></div>
        <p><strong>Number of Workdays:</strong> ${payrollDetails.workdays || '0'}</p>
  
        <div class="payslip-earnings-deductions">
          <table class="payslip-table">
            <thead>
              <tr><th colspan="2">Earnings</th><th>Amount</th></tr>
            </thead>
            <tbody>
              <tr><td colspan="2">Basic Pay</td><td>₱ ${(payrollDetails.basicPay || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">Overtime Pay</td><td>₱ ${(payrollDetails.overtimePay || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">Leave Pay</td><td>₱ ${(payrollDetails.leavePay || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">Allowance</td><td>₱ ${(serviceInfo.allowance || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">CNA Incentive</td><td>₱ ${(serviceInfo.cnaIncentive || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">RATA</td><td>₱ ${(serviceInfo.cashGift || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">Performance Enhancement Incentive</td><td>₱ ${(serviceInfo.performanceEhcIncentive || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">Subsistence</td><td>₱ ${(serviceInfo.subsistence || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">ECOLA</td><td>₱ ${(serviceInfo.ecola || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2"><strong>Total Earnings</strong></td><td><strong>₱ ${(payrollDetails.grossPayTotal || 0).toFixed(2)}</strong></td></tr>
            </tbody>
          </table>
  
          <table class="payslip-table">
            <thead>
              <tr><th colspan="2">Deductions</th><th>Amount</th></tr>
            </thead>
            <tbody>
              <tr><td colspan="2">Income Tax</td><td>₱ ${(payrollDetails.incomeTax || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">Late Deduction</td><td>₱ ${(serviceInfo.late || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">Absent Deduction</td><td>₱ ${(serviceInfo.absent || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">Loan Deduction</td><td>₱ ${(serviceInfo.loan || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">SSS Contribution</td><td>₱ ${(payrollDetails.sssContribution || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">PhilHealth Contribution</td><td>₱ ${(payrollDetails.philHealthContribution || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">PAGIBIG Contribution</td><td>₱ ${(payrollDetails.pagibigContribution || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2">GSIS Contribution</td><td>₱ ${(payrollDetails.gsisContribution || 0).toFixed(2)}</td></tr>
              <tr><td colspan="2"><strong>Total Deductions</strong></td><td><strong>₱ ${(payrollDetails.deductionTotal || 0).toFixed(2)}</strong></td></tr>
            </tbody>
          </table>
        </div>
  
        <div class="payslip-netpay-box">
          <p><strong>Net Pay:</strong>₱ ${(payrollDetails.netPayTotal || 0).toFixed(2)}</p>
        </div>
      </div>
    `;
  }

  private generateFullHtmlContent(payslips: string): string {
    return `
      <html>
        <head>
          <style>
            @media print {
              body {
                width: 100%;
                margin: 0;
                padding: 0;
              }
              .payslip-container {
                width: 230mm;
                height: 300mm;
                padding: 10mm;
                box-sizing: border-box;
                font-family: Arial, sans-serif;
              }
            }
  
            .payslip-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
              font-size: 14px;
              color: #333;
            }
            .header-left {
              display: flex;
              align-items: center;
            }
            .company-logo {
              width: 50px;
              height: 50px;
              margin-right: 10px;
            }
            .company-name {
              margin: 0;
              font-weight: bold;
              font-size: 1.2em;
            }
            .company-address {
              margin: 0;
              font-size: 0.9em;
            }
            .header-right {
              text-align: right;
            }
            .payroll-number {
              font-size: 0.9em;
            }
            .payslip-info {
              display: flex;
              justify-content: space-between;
              padding-top: 10px;
            }
            .payslip-earnings-deductions {
              display: flex;
              justify-content: space-between;
              gap: 20px;
            }
            .payslip-table {
              width: 100%;
              border-collapse: collapse;
            }
            .payslip-table th, .payslip-table td {
              border: 1px solid #000;
              padding: 5px;
            }
            .payslip-netpay-box {
              margin-top: 5px;
              border: 1px solid #000;
              padding: 5px;
              text-align: right;
            }
          </style>
        </head>
        <body>
          ${payslips}
        </body>
      </html>
    `;
  }

  private openPrintWindow(content: string) {
    const printWindow = window.open('', '', 'height=800,width=1000');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  }
}