import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecruitmentService {
  headers = new HttpHeaders()
  .set('Authorization',  `Basic ${btoa('admin:h@n@')}`)
  .set('Content-Type',  'application/json')

  constructor(private http: HttpClient) { }

  /**
   * Get Job Openings
   * @returns
   */
  getJobOpenings() {
    return this.http.get(environment.globalUrl + '/job_openings' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Create Job Opening
   * @param payload
   * @returns
   */
  createJobOpening(payload) {
    return this.http.post(environment.globalUrl + '/job_openings/', payload ,{headers: this.headers})
  }

  /**
   * Update Job Opening
   * @param payload
   * @returns
   */
  updateJobOpening(payload) {
    return this.http.put(environment.globalUrl + '/job_openings/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Delete Job Opening
   * @param payload
   * @returns
   */
  deleteJobOpening(payload) {
    return this.http.delete(environment.globalUrl + '/job_openings/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }

  /**
   * Get Required Documents
   * @returns
   */
  getRequiredDocuments() {
    return this.http.get(environment.globalUrl + '/required_documents' + environment.apiIncludeDocs, {headers: this.headers}).pipe(shareReplay(1))
  }

  /**
   * Create Required Document
   * @param payload
   * @returns
   */
  createRequiredDocument(payload) {
    return this.http.post(environment.globalUrl + '/required_documents/', payload ,{headers: this.headers})
  }

  /**
   * Update Required Document
   * @param payload
   * @returns
   */
  updateRequiredDocument(payload) {
    return this.http.put(environment.globalUrl + '/required_documents/' + payload._id + "/?rev="+ payload._rev, payload ,{headers: this.headers})
  }

  /**
   * Delete Required Document
   * @param payload
   * @returns
   */
  deleteRequiredDocument(payload) {
    return this.http.delete(environment.globalUrl + '/required_documents/' + payload._id + "/?rev="+ payload._rev ,{headers: this.headers})
  }
}
