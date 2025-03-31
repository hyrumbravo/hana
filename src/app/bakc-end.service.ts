import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from 'environments/environment';

var header = {
  headers: new HttpHeaders()
    .set('Authorization',  `Basic ${btoa('admin:h@n@')}`)
}

var postHeader = {
  headers: new HttpHeaders()
    .set('Authorization',  `Basic ${btoa('admin:h@n@')}`)
    .set('Content-Type',  'application/json')
}

var leaveHeader = {
  headers: new HttpHeaders()
    .set('Authorization',  `Basic ${btoa('admin:h@n@')}`)
    .set('Content-Type',  'application/json')
}

var delHeader = {
  headers: new HttpHeaders()
    .set('Authorization',  `Basic ${btoa('admin:h@n@')}`)
    .set('Content-Type',  'application/json')
}

var editHeader = {
  headers: new HttpHeaders()
    .set('Authorization',  `Basic ${btoa('admin:h@n@')}`)
    .set('Content-Type',  'application/json')
}

@Injectable({
  providedIn: 'root'
})

export class BakcEndService {
  leaveSummaryUrl = environment.globalUrl + '/leave_approval/_design/leave_summary/_view/leaveDetails';
  logsUrl = environment.globalUrl + "/audit-logs/_all_docs?include_docs=true"
  // filteredLogsUrl = environment.globalUrl + "/audit-logs/_design/audit-logs/_view/by_timestamp?descending=true&limit=250"
  groupSettingsUrl = environment.globalUrl + "/user_groups/_all_docs?include_docs=true"
  approveUrl = environment.globalUrl + "/leave_approval/_all_docs?include_docs=true";
  url = environment.globalUrl + "/user_groups/_all_docs?include_docs=true";
  announcements = environment.globalUrl + "/announcements/_all_docs?include_docs=true";
  announcementsUrl = environment.globalUrl + "/announcements/";
  usersUrl = environment.globalUrl + "/users/";
  allUsersUrl = environment.globalUrl + "/users/_all_docs?include_docs=true";
  creditUrl = environment.globalUrl + "/leave_credit/_all_docs?include_docs=true";
  leaveUrl = environment.globalUrl + "/leave_types/_all_docs?include_docs=true";
  positions = environment.globalUrl + "/position/_all_docs?include_docs=true";
  appointments = environment.globalUrl + "/appointment/_all_docs?include_docs=true";
  performanceUrl = environment.globalUrl + "/performance_evaluation/_all_docs?include_docs=true";
  approverUrl = environment.globalUrl + "/approvers/_all_docs?include_docs=true";
  employeeUrl = environment.globalUrl + "/employees/_all_docs?include_docs=true";
  empURL = environment.globalUrl + "/employees";
  employeeRatesUrl = environment.globalUrl + "/employees/_design/employeeRates/_view/all_employees";

  ratingUrl = environment.globalUrl + "/rating_table/_all_docs?include_docs=true";
  advanceUrl = environment.globalUrl + "/advance_settings/_all_docs?include_docs=true";
  institution = environment.globalUrl + "/institution/_all_docs?include_docs=true";
  postUrl = environment.globalUrl + "/user_groups";
  leaveTypeUrl = environment.globalUrl + "/leave_types";
  positionUrl = environment.globalUrl + "/position";
  createLeaveTypeUrl = environment.globalUrl + "/leave_approval";
  createEvaluationUrl = environment.globalUrl + "/performance_evaluation";
  createAppointmentUrl = environment.globalUrl + "/appointment";
  createCreditUrl = environment.globalUrl + "/leave_credit";
  institutionUrl = environment.globalUrl + "/institution/";
  branches = environment.globalUrl + "/branch/_all_docs?include_docs=true";
  branchUrl = environment.globalUrl + "/branch/";
  divisions = environment.globalUrl + "/divisions/_all_docs?include_docs=true";
  divisionUrl = environment.globalUrl + "/divisions/";
  departments = environment.globalUrl + "/departments/_all_docs?include_docs=true";
  departmentUrl = environment.globalUrl + "/departments/";
  payrollUrl = environment.globalUrl + "/payroll";

  constructor(private http: HttpClient) { }

  users(): Observable<any> {
    return this.http.get(this.url, header);
  }
  
  // FOR UPDATING BULK DATA FROM DBS WITH CREATED AT AND UPDATED AT IN 'card' ARRAY
  addCreatedAtToAllDocs() {
    // Step 1: Fetch all documents from the leave_card database
    this.http.get(environment.globalUrl + '/leave_card/_all_docs?include_docs=true', header)
      .subscribe((response: any) => {
        const docsToUpdate = [];
  
        // Step 2: Loop through each document
        response.rows.forEach((row: any) => {
          let docNeedsUpdate = false; // Flag to track if the document needs an update
  
          // Step 3: Check if 'createdAt' and 'updatedAt' exist in the document itself
          // if (!row.doc.createdAt || !row.doc.updatedAt) {
          //   row.doc.createdAt = new Date().toISOString();
          //   row.doc.updatedAt = new Date().toISOString();
          //   docNeedsUpdate = true;
          // }
  
          // Step 4: Loop through the 'card' array and add 'createdAt' and 'updatedAt' to each card entry if missing
          if (row.doc.card && Array.isArray(row.doc.card)) {
            row.doc.card.forEach((card: any) => {
              if (!card.createdAt || !card.updatedAt) {
                card.createdAt = new Date().toISOString();
                card.updatedAt = new Date().toISOString();
                docNeedsUpdate = true;
              }
            });
          }
  
          // If the document or any card in the document needs an update, add it to the list of docs to update
          if (docNeedsUpdate) {
            docsToUpdate.push(row.doc);
          }
        });
  
        // Step 5: Perform a bulk update to save the changes
        if (docsToUpdate.length > 0) {
          this.bulkUpdateDocs(docsToUpdate);
        }
        
        console.log("Documents Updated!");
      });
  }
  
  // BULK UPDATE FUNCTION
  bulkUpdateDocs(docs: any[]) {
    const payload = { docs: docs };
    this.http.post(environment.globalUrl + '/leave_card/_bulk_docs', payload, header)
      .subscribe((response: any) => {
        console.log('Bulk update response:', response);
      });
  }


  institutionData(): Observable<any> {
    return this.http.get(this.institution, header);
  }

  addInstitution(data:any): Observable<any> {
    const body=JSON.stringify(data);
    console.log(body);
    return this.http.post(this.institutionUrl, body, postHeader);
  }

  updateInstitution(data: any, id: any): Observable<any> {
    const editUrl = this.institutionUrl + id;
    console.log(data);
    return this.http.put(editUrl, data, editHeader);

  }

  announcementsList(): Observable<any> {
    return this.http.get(this.announcements, header);
  }
  approval(): Observable<any> {
    return this.http.get(this.approveUrl, leaveHeader);
  }
  credits(): Observable<any> {
    return this.http.get(this.creditUrl, header);
  }
  leaveTypes() {
    return this.http.get(this.leaveUrl, header);
  }
  position() {
    return this.http.get(this.positions, header);
  }
  branch() {
    return this.http.get(this.branches, header);
  }
  division() {
    return this.http.get(this.divisions, header);
  }
  department() {
    return this.http.get(this.departments, header);
  }
  appointment() {
    return this.http.get(this.appointments, header);
  }
  performance() {
    return this.http.get(this.performanceUrl, header);
  }
  approvers() {
    return this.http.get(this.approverUrl, header);
  }
  employee() {
    return this.http.get(this.employeeUrl, header);
  }
  rating() {
    return this.http.get(this.ratingUrl, header);
  }
  advanceFunc(): Observable<any>  {
    return this.http.get(this.advanceUrl, postHeader);
  }
  allUsers(): Observable<any>  {
    return this.http.get(this.allUsersUrl, postHeader);
  }
  addGroup(person:any): Observable<any> {
    const body=JSON.stringify(person);
    console.log(body);
    return this.http.post(this.postUrl, body, postHeader);
  }
  addLeave(person:any): Observable<any> {
    const body=JSON.stringify(person);
    console.log(body);
    return this.http.post(this.leaveTypeUrl, body, leaveHeader);
  }
  addPosition(person:any): Observable<any> {
    const body=JSON.stringify(person);
    console.log(body);
    return this.http.post(this.positionUrl, body, leaveHeader);
  }
  createBranch(person:any): Observable<any> {
    const body=JSON.stringify(person);
    console.log(body);
    return this.http.post(this.branchUrl, body, leaveHeader);
  }
  createDivision(person:any): Observable<any> {
    const body=JSON.stringify(person);
    console.log(body);
    return this.http.post(this.divisionUrl, body, leaveHeader);
  }
  createDepartment(person:any): Observable<any> {
    const body=JSON.stringify(person);
    console.log(body);
    return this.http.post(this.departmentUrl, body, leaveHeader);
  }
  createLeave(person:any): Observable<any> {
    const body=JSON.stringify(person);
    console.log(body);
    return this.http.post(this.createLeaveTypeUrl, body, leaveHeader);
  }
  createEvaluation(person:any): Observable<any> {
    const body=JSON.stringify(person);
    console.log(body);
    return this.http.post(this.createEvaluationUrl, body, leaveHeader);
  }
  createAppointment(person:any): Observable<any> {
    const body=JSON.stringify(person);
    console.log(body);
    return this.http.post(this.createAppointmentUrl, body, leaveHeader);
  }
  createCredit(person:any): Observable<any> {
    const body=JSON.stringify(person);
    console.log(body);
    return this.http.post(this.createCreditUrl, body, leaveHeader);
  }
  removeGroup(id: any, rev: any): Observable<any> {
    const delUrl = environment.globalUrl + "/user_groups/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delUrl, delHeader)

  }
  deleteLeave(id: any, rev: any): Observable<any> {
    const delUrl = environment.globalUrl + "/leave_approval/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delUrl, delHeader)

  }
  deletePosition(id: any, rev: any): Observable<any> {
    const delPosUrl = environment.globalUrl + "/position/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delPosUrl, delHeader)

  }
  deleteBranch(id: any, rev: any): Observable<any> {
    const delPosUrl = environment.globalUrl + "/branch/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delPosUrl, delHeader)

  }
  deleteDivision(id: any, rev: any): Observable<any> {
    const delPosUrl = environment.globalUrl + "/divisions/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delPosUrl, delHeader)

  }
  deleteDepartment(id: any, rev: any): Observable<any> {
    const delPosUrl = environment.globalUrl + "/departments/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delPosUrl, delHeader)

  }
  deleteApp(id: any, rev: any): Observable<any> {
    const delPosUrl = environment.globalUrl + "/appointment/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delPosUrl, delHeader)

  }
  deleteEval(id: any, rev: any): Observable<any> {
    const delPosUrl = environment.globalUrl + "/performance_evaluation/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delPosUrl, delHeader)

  }
  deleteCred(id: any, rev: any): Observable<any> {
    const delUrl = environment.globalUrl + "/leave_credit/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delUrl, delHeader)

  }
  removeLeave(id: any, rev: any): Observable<any> {
    const delUrl = environment.globalUrl + "/leave_types/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delUrl, delHeader)

  }
  updateGroup(display: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/user_groups/"+ id;
    console.log(display);
    return this.http.put(editUrl, display, editHeader);

  }
  editLeave(display: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/leave_approval/"+ id;
    console.log(display);
    return this.http.put(editUrl, display, editHeader);

  }
  editApp(display: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/appointment/"+ id;
    console.log(display);
    return this.http.put(editUrl, display, editHeader);

  }
  editPerf(display: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/performance_evaluation/"+ id;
    console.log(display);
    return this.http.put(editUrl, display, editHeader);

  }
  editPosition(display: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/position/"+ id;
    console.log(display);
    return this.http.put(editUrl, display, editHeader);

  }
  editBranch(display: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/branch/"+ id;
    console.log(display);
    return this.http.put(editUrl, display, editHeader);

  }
  editDivision(display: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/divisions/"+ id;
    console.log(display);
    return this.http.put(editUrl, display, editHeader);

  }
  editDepartment(display: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/departments/"+ id;
    console.log(display);
    return this.http.put(editUrl, display, editHeader);

  }

  editCred(display: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/leave_credit/"+ id;
    console.log(display);
    return this.http.put(editUrl, display, editHeader);

  }

  updateLeave(display: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/leave_types/"+ id;
    console.log(display);
    return this.http.put(editUrl, display, editHeader);

  }
  addUser(person:any): Observable<any> {
    const body=JSON.stringify(person);
    console.log(body);
    return this.http.post(this.usersUrl, body, leaveHeader);
  }
  editUser(display: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/users/"+ id;
    console.log(display);
    return this.http.put(editUrl, display, editHeader);

  }
  deleteUser(id: any, rev: any): Observable<any> {
    const delPosUrl = environment.globalUrl + "/users/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delPosUrl, delHeader)

  }
  addAnnouncement(data:any): Observable<any> {
    const body=JSON.stringify(data);
    console.log(body);
    return this.http.post(this.announcementsUrl, body, leaveHeader);
  }
  editAnnouncement(data: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/announcements/"+ id;
    console.log(data);
    return this.http.put(editUrl, data, editHeader);

  }
  deleteAnnouncement(id: any, rev: any): Observable<any> {
    const delPosUrl = environment.globalUrl + "/announcements/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delPosUrl, delHeader)

  }

  group_settings(): Observable<any> {
    return this.http.get(this.groupSettingsUrl, header);
  }

  updateUserGroup(display: any, id: any): Observable<any> {
    const editUrl = environment.globalUrl + "/user_groups/"+ id;
    console.log(display);
    return this.http.put(editUrl, display, editHeader);
  }

  removeUserGroup(id: any, rev: any): Observable<any> {
    const delUrl = environment.globalUrl + "/user_groups/"+ id + "/?rev="+ rev;
    console.log(id);
    return this.http.delete(delUrl, delHeader)
  }


  addUserGroup(person:any): Observable<any> {
    const body=JSON.stringify(person);
    console.log(body);
    return this.http.post(environment.globalUrl + '/user_groups', body, postHeader);
  }

  getUserGroupbyId(id): Observable<any> {
    const group_id = id
    return this.http.get(environment.globalUrl + `/user_groups/_all_docs?include_docs=true&key=\"${group_id}\"`, header);
  }

  getSystemUser():Observable<any>{
    const userId = localStorage.getItem('userID');
    return this.http.get(environment.globalUrl + `/users/_all_docs?include_docs=true&key=\"${userId}\"`, header);
  }

  getLogs(): Observable<any> {
    return this.http.get(this.logsUrl, header);
  }
  
  
  getfilteredLogs(): Observable<any> {
    const today = new Date().toISOString().split('T')[0]; // Gets the date in 'YYYY-MM-DD' format
    const endkey = `"${today}T00:00:00.000Z"`;
    const startkey = `"${today}T23:59:59.999Z"`;
    const url = `${environment.globalUrl}/audit-logs/_design/audit-logs/_view/by_timestamp?descending=true&startkey=${startkey}&endkey=${endkey}`;

    return this.http.get(url, header);
  }
  
  getFilteredLogsByDate(date: string): Observable<any> {
    const endkey = `"${date}T00:00:00.000Z"`;
    const startkey = `"${date}T23:59:59.999Z"`;
    const url = `${environment.globalUrl}/audit-logs/_design/audit-logs/_view/by_timestamp?descending=true&startkey=${startkey}&endkey=${endkey}`;
    return this.http.get(url, header);
  }
  
  getFilteredLogsByDateRange(startDate: string, endDate: string): Observable<any> {
    const endkey = `"${startDate}T00:00:00.000Z"`;
    const startkey = `"${endDate}T23:59:59.999Z"`;
    const url = `${environment.globalUrl}/audit-logs/_design/audit-logs/_view/by_timestamp?descending=true&startkey=${startkey}&endkey=${endkey}`;
    return this.http.get(url, header);
  }

  getFields(): Observable<any> {
    return this.http.get(this.employeeUrl);
  }

  addFieldToUser(idNo: string, newField: any): Observable<any> {
    const mangoQuery = {
      selector: {
        id_no: idNo
      }
    };
    return this.http.post(`${this.empURL}/_find`, mangoQuery, postHeader).pipe(
      switchMap((response: any) => {
        if (response.docs && response.docs.length > 0) {
          const userDoc = response.docs[0];
          if (!userDoc.serviceInformation) {
            userDoc.serviceInformation = {};
          }
          if (!userDoc.serviceInformation.newfield) {
            userDoc.serviceInformation.newfield = {};
          }
          userDoc.serviceInformation.newfield = { ...userDoc.serviceInformation.newfield, ...newField };
          const updatedDoc = {
            ...userDoc,
            _rev: userDoc._rev
          };
          return this.http.put(`${this.empURL}/${userDoc._id}`, updatedDoc, postHeader);
        } else {
          return throwError(() => new Error('Document not found'));
        }
      }),
      catchError((error) => {
        console.error('Error while updating document:', error);
        return throwError(() => new Error('Failed to update document'));
      })
    );
  }

  getEmployeeById(idNo: string): Observable<any> {
    const mangoQuery = {
      selector: {
        id_no: idNo,
      },
    };
    const url = `${this.empURL}/_find`;
    return this.http.post(url,mangoQuery,header);
  }
  getEmployeeData(): Observable<any> {
    const employeeDataViewUrl = `${this.empURL}/_design/employeeData/_view/fetchEmployeeData?include_docs=true`;
    return this.http.get(employeeDataViewUrl, header).pipe(
      map((response: any) => {
        return response.rows.map((row: any) => {
          const employee = row.value;
          employee.serviceInformation = row.value.serviceInformation || null;
          return employee;
        });
      }),
      catchError(error => {
        console.error('Error fetching employee data:', error);
        return throwError(error);
      })
    );
  }
  saveEmployeeData(payrollData: any): Observable<any> {
    const payload = {
      ...payrollData
    };
    return this.http.post(this.payrollUrl, payload, postHeader);
  }
  savePayrollBatch(compiledPayrollData: any): Observable<any> {
    return this.http.post(this.payrollUrl, compiledPayrollData, postHeader);
  }  
  getPayrollData(): Observable<any> {
    const payrollUrlWithDocs = this.payrollUrl + '/_all_docs?include_docs=true';
    return this.http.get<any>(payrollUrlWithDocs, header).pipe(
      map((response: any) => {
        if (response && response.rows) {
          return response.rows.reverse().map((row: any) => row.doc);
        } else {
          return [];
        }
      })
    );
  }
  getPayrollCount(): Observable<number> {
    const url = `${this.payrollUrl}/_find`;
    const mangoQuery = {
        selector: {
            _id: { $exists: true }
        }
    };
    return this.http.post<any>(url, mangoQuery, header).pipe(
        map(response => {
            return response?.docs?.length || 0;
        })
    );
  }
  getNextSequentialNumberForMonth(yearMonth: string): Observable<number> {
    const url = `${this.payrollUrl}/_find`;
    const mangoQuery = {
      selector: {
        payrollNum: {
          $regex: `^${yearMonth}-`
        }
      },
      fields: ['payrollNum']
    };
    return this.http.post<any>(url, mangoQuery, header).pipe(
      map(response => {
        if (response?.docs?.length) {
          const nextSequentialNumber = response.docs.length + 1;
          return nextSequentialNumber;
        } else {
          return 1;
        }
      })
    );
  }
  getEmployeeRates(): Observable<any[]> {
    return this.http.get<any>(this.employeeRatesUrl, header).pipe(
      map(response => response.rows.map(row => row.value)), // Extract the values from the response
      catchError(error => {
        console.error('Error fetching employee rates:', error);
        return throwError(error);
      })
    );
  }
  getLeaveSummary(): Observable<any> {
    return this.http.get<any>(this.leaveSummaryUrl, leaveHeader);
  }  
  deletePayslip(payslipId: string, rev: string): Observable<any> {
    const delUrl = `${this.payrollUrl}/${payslipId}?rev=${rev}`;
    // console.log(`Deleting payslip with ID: ${payslipId} and revision: ${rev}`);
    return this.http.delete(delUrl, delHeader);
  }
}
