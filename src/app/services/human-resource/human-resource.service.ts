import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HumanResourceService {
  headers = new HttpHeaders()
  .set('Authorization',  `Basic ${btoa('admin:h@n@')}`)
  .set('Content-Type',  'application/json')

  constructor(private http: HttpClient) { }

  /**
   * Get Evaluation Factors
   * @returns
   */
  getEvaluationFactors() {
    return this.http.get(environment.globalUrl + '/evaluation_factors' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Create Evaluation Factor
   * @param payload
   * @returns
   */
  createEvaluationFactor(payload) {
    return this.http.post(environment.globalUrl + '/evaluation_factors/', payload ,{headers: this.headers})
  }

  /**
   * Update Evaluation Factor
   * @param payload
   * @returns
   */
  updateEvaluationFactor(payload) {
    return this.http.put(environment.globalUrl + '/evaluation_factors/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Delete Evaluation Factor
   * @param payload
   * @returns
   */
  deleteEvaluationFactor(payload) {
    return this.http.delete(environment.globalUrl + '/evaluation_factors/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  /**
   * Get Employee Ratings
   * @returns
   */
  getEmployeeRatings() {
    return this.http.get(environment.globalUrl + '/employee_ratings' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Create Employee Rating
   * @param payload
   * @returns
   */
  createEmployeeRating(payload) {
    return this.http.post(environment.globalUrl + '/employee_ratings/', payload ,{headers: this.headers})
  }

  /**
   * Update Employee Rating
   * @param payload
   * @returns
   */
  updateEmployeeRating(payload) {
    return this.http.put(environment.globalUrl + '/employee_ratings/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Delete Evaluation Factor
   * @param payload
   * @returns
   */
  deleteEmployeeRating(payload) {
    return this.http.delete(environment.globalUrl + '/employee_ratings/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  /**
   * Get Evaluation Templates
   * @returns
   */
  getEvaluationTemplates() {
    return this.http.get(environment.globalUrl + '/evaluation_templates' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Create Evaluation Template
   * @param payload
   * @returns
   */
  createEvaluationTemplate(payload) {
    return this.http.post(environment.globalUrl + '/evaluation_templates/', payload ,{headers: this.headers})
  }

  /**
   * Update Evaluation Template
   * @param payload
   * @returns
   */
  updateEvaluationTemplate(payload) {
    return this.http.put(environment.globalUrl + '/evaluation_templates/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Delete Evaluation Template
   * @param payload
   * @returns
   */
  deleteEvaluationTemplate(payload) {
    return this.http.delete(environment.globalUrl + '/evaluation_templates/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  /**
   * Get Evaluation Criterias
   * @returns
   */
  getEvaluationCriterias() {
    return this.http.get(environment.globalUrl + '/evaluation_criterias' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Create Evaluation Critera
   * @param payload
   * @returns
   */
  createEvaluationCriteria(payload) {
    return this.http.post(environment.globalUrl + '/evaluation_criterias/', payload ,{headers: this.headers})
  }

  /**
   * Update Evaluation Criteria
   * @param payload
   * @returns
   */
  updateEvaluationCriteria(payload) {
    return this.http.put(environment.globalUrl + '/evaluation_criterias/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Delete Evaluation Criteria
   * @param payload
   * @returns
   */
  deleteEvaluationCriteria(payload) {
    return this.http.delete(environment.globalUrl + '/evaluation_criterias/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  /**
   * Get Evaluation Sub Criterias
   * @returns
   */
  getEvaluationSubCriterias() {
    return this.http.get(environment.globalUrl + '/evaluation_subcriterias' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Create Evaluation Sub Critera
   * @param payload
   * @returns
   */
  createEvaluationSubCriteria(payload) {
    return this.http.post(environment.globalUrl + '/evaluation_subcriterias/', payload ,{headers: this.headers})
  }

  /**
   * Update Evaluation Sub Criteria
   * @param payload
   * @returns
   */
  updateEvaluationSubCriteria(payload) {
    return this.http.put(environment.globalUrl + '/evaluation_subcriterias/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Delete Evaluation Sub Criteria
   * @param payload
   * @returns
   */
  deleteEvaluationSubCriteria(payload) {
    return this.http.delete(environment.globalUrl + '/evaluation_subcriterias/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }
}
