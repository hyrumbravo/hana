import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  headers = new HttpHeaders()
  .set('Authorization',  `Basic ${btoa('admin:h@n@')}`)
  .set('Content-Type',  'application/json')

  constructor(private http: HttpClient) { }

  /**
   * Get Leave Approvals
   * @returns
   */
  getLeaveApprovals() {
    return this.http.get(environment.globalUrl + '/leave_approval' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Get Leave History
   * @returns
   */
  getLeaveHistory() {
    return this.http.get(environment.globalUrl + '/leave_history' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Create Leave Approval
   * @param payload
   * @returns
   */
  createLeaveApproval(payload) {
    return this.http.post(environment.globalUrl + '/leave_approval/', payload ,{headers: this.headers})
  }

  /**
   * Create Leave History
   * @param payload
   * @returns
   */
  createLeaveHistory(payload) {
    return this.http.post(environment.globalUrl + '/leave_history/', payload ,{headers: this.headers})
  }

  /**
   * Update Leave Approval
   * @param payload
   * @returns
   */
  updateLeaveApproval(payload) {
    return this.http.put(environment.globalUrl + '/leave_approval/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Update Leave History
   * @param payload
   * @returns
   */
  updateLeaveHistory(payload) {
    return this.http.put(environment.globalUrl + '/leave_history/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Get Leave Types
   * @returns
   */
  getLeaveTypes() {
    return this.http.get(environment.globalUrl + '/leave_types' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Create Leave Types
   * @param payload
   * @returns
   */
  createLeaveType(payload) {
    return this.http.post(environment.globalUrl + '/leave_types/', payload ,{headers: this.headers})
  }

  /**
   * Update Leave Type
   * @param payload
   * @returns
   */
  updateLeaveType(payload) {
    return this.http.put(environment.globalUrl + '/leave_types/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Delete Leave Type
   * @param payload
   * @returns
   */
  deleteLeaveType(payload) {
    return this.http.delete(environment.globalUrl + '/leave_types/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  /**
   * Get Leave Approvers
   * @returns
   */
  getLeaveApprovers() {
    return this.http.get(environment.globalUrl + '/approvers' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  createLeaveApprovers(payload) {
    return this.http.post(environment.globalUrl + '/approvers/', payload ,{headers: this.headers})
  }

  updateLeaveApprovers(payload){
    return this.http.put(environment.globalUrl + '/approvers/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Delete Leave Approver
   * @param payload
   * @returns
   */
  deleteLeaveApprover(payload) {
    return this.http.delete(environment.globalUrl + '/approvers/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  /**
   * Delete Leave Approval
   * @param payload
   * @returns
   */
  deleteLeaveApproval(payload) {
    return this.http.delete(environment.globalUrl + '/leave_approval/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  /**
   * Delete Leave History
   * @param payload
   * @returns
   */
  deleteLeaveHistory(payload) {
    return this.http.delete(environment.globalUrl + '/leave_history/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  /**
   * Get Leave Credits
   * @returns
   */
  getLeaveCredits() {
    return this.http.get(environment.globalUrl + '/leave_credit' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Delete Leave Credit
   * @param payload
   * @returns
   */
  deleteLeaveCredit(payload) {
    return this.http.delete(environment.globalUrl + '/leave_credit/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  /**
   * Create Leave Credit
   * @param payload
   * @returns
   */
  createLeaveCredit(payload) {
    return this.http.post(environment.globalUrl + '/leave_credit/', payload ,{headers: this.headers})
  }

  getLeaveCard() {
    return this.http.get(environment.globalUrl + '/leave_card' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  updateLeaveCard(payload){
    return this.http.put(environment.globalUrl + '/leave_card/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  addLeaveCard(payload) {
    return this.http.post(environment.globalUrl + '/leave_card/', payload ,{headers: this.headers})
  }

  deleteLeaveCardEntry(payload) {
    return this.http.delete(environment.globalUrl + '/leave_card/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  getApprovalData(leaveId){
    return this.http.get(environment.globalUrl + `/leave_approval/_all_docs?include_docs=true&key=\"${leaveId}\"`, {headers: this.headers});
  }
}
