import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  headers = new HttpHeaders()
  .set('Authorization',  `Basic ${btoa('admin:h@n@')}`)
  .set('Content-Type',  'application/json')
  constructor(private http: HttpClient) { }

  /**
   * Get User
   * @returns
   */
  getUser() {
    return this.http.get(environment.globalUrl + '/users' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Update User
   * @param payload
   * @returns
   */
  updateUser(payload) {
    return this.http.put(environment.globalUrl + '/users/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Get Employees by id
   * @returns employees
   */
  getEmployeesById(id) {
    return this.http.get(environment.globalUrl + '/employees' + environment.apiIncludeDocs + `&key=\"${id}\"`
          , {headers: this.headers}).pipe(shareReplay(1))
  }

    /**
   * Get Employees
   * @returns employees
   */
    getEmployees() {
      return this.http.get(environment.globalUrl + '/employees' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
    }

  /**
   * Update Employee
   * @param payload
   * @returns
   */
  updateEmployee(payload) {
    return this.http.put(environment.globalUrl + '/employees/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Create Employee
   * @param payload
   * @returns
   */
  createEmployee(payload) {
    return this.http.post(environment.globalUrl + '/employees/', payload ,{headers: this.headers})
  }

  /**
   * Delete Employee
   * @param payload
   * @returns
   */
  deleteEmployee(payload) {
    return this.http.delete(environment.globalUrl + '/employees/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  /**
   * Get Positions
   * @returns
   */
  getPositions() {
    return this.http.get(environment.globalUrl + '/position' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Get Appointments
   * @returns
   */
  getAppointments() {
    return this.http.get(environment.globalUrl + '/appointment' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Create Appointment
   * @param payload
   * @returns
   */
  createAppointment(payload) {
    return this.http.post(environment.globalUrl + '/appointment/', payload ,{headers: this.headers})
  }

  /**
   * Update Appointment
   * @param payload
   * @returns
   */
  updateAppointment(payload) {
    return this.http.put(environment.globalUrl + '/appointment/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Delete Appointment
   * @param payload
   * @returns
   */
  deleteAppointment(payload) {
    return this.http.delete(environment.globalUrl + '/appointment/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  /**
   * Get Branches
   * @returns
   */
  getBranches() {
    return this.http.get(environment.globalUrl + '/branch' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Get Divisions
   * @returns
   */
  getDivisions() {
    return this.http.get(environment.globalUrl + '/divisions' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1));
  }

    /**
   * Get Branches
   * @returns
   */
    getDepartment() {
      return this.http.get(environment.globalUrl + '/departments' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
    }

    /**
   * Get Salary Grade Matrix 
   * @returns
   */
    getSalaryGrade() {
      return this.http.get(environment.globalUrl + '/salary_grades' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
    }

  /**
   * Get Requests
   * @returns
   */
  getRequests() {
    return this.http.get(environment.globalUrl + '/requests' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Create Request
   * @param payload
   * @returns
   */
  createRequest(payload) {
    return this.http.post(environment.globalUrl + '/requests/', payload ,{headers: this.headers})
  }

  /**
   * Update Request
   * @param payload
   * @returns
   */
  updateRequest(payload) {
    return this.http.put(environment.globalUrl + '/requests/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Delete Request
   * @param payload
   * @returns
   */
  deleteRequest(payload) {
    return this.http.delete(environment.globalUrl + '/requests/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }
}
